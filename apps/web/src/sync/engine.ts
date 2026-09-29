import { CURSOR_KEY, db, syncedTable, type OutboxEntry } from '@/db/db'
import { isSyncedTable, SYNCED_TABLES } from '@/db/tables'
import {
  PUSH_BATCH_SIZE,
  syncApi,
  type Change,
  type PullResponse,
  type PushResponse,
  type SyncApi,
} from './api'

/**
 * One sync round (ADR 0025): push this device's queued changes, then pull everyone else's.
 *
 * Screens only read Dexie. The outbox remembers which rows still have to reach the server,
 * so nothing is lost while offline.
 */

export async function syncOnce(api: SyncApi = syncApi): Promise<void> {
  await pushOutbox(api)
  await pullChanges(api)
}

// --- Push ------------------------------------------------------------------------------------

async function pushOutbox(api: SyncApi): Promise<void> {
  let entries: OutboxEntry[]
  do {
    entries = await db.outbox.limit(PUSH_BATCH_SIZE).toArray()
    if (entries.length === 0) return
    const changes = await changesFor(entries)
    const result = await api.push(changes)
    await settle(entries, changes, result)
  } while (entries.length === PUSH_BATCH_SIZE) // a full batch: more may be waiting
}

async function changesFor(entries: OutboxEntry[]): Promise<Change[]> {
  const changes: Change[] = []
  for (const entry of entries) {
    const row = await syncedTable(entry.table).get(entry.id)
    if (row) changes.push({ table: entry.table, row })
  }
  return changes
}

/** Clear what the server handled, keeping a copy of every version it did not keep. */
async function settle(entries: OutboxEntry[], changes: Change[], result: PushResponse) {
  const notKept = new Map<string, string>()
  for (const id of result.skipped) notKept.set(id, 'newer_on_server')
  for (const rejected of result.rejected) {
    if (rejected.id) notKept.set(rejected.id, rejected.reason)
  }
  const sentRows = new Map(changes.map((change) => [change.row.id, change.row]))

  await db.transaction('rw', db.outbox, db.conflicts, async () => {
    for (const entry of entries) {
      const current = await db.outbox.get([entry.table, entry.id])
      if (current && current.change_id !== entry.change_id) continue // edited again meanwhile

      const reason = notKept.get(entry.id)
      const row = sentRows.get(entry.id)
      if (reason && row) {
        await db.conflicts.add({
          table: entry.table,
          id: entry.id,
          row,
          reason,
          saved_at: new Date().toISOString(),
        })
      }
      await db.outbox.delete([entry.table, entry.id])
    }
  })
}

// --- Pull ------------------------------------------------------------------------------------

async function pullChanges(api: SyncApi): Promise<void> {
  let page: PullResponse
  do {
    const cursor = ((await db.meta.get(CURSOR_KEY))?.value as number | undefined) ?? 0
    page = await api.pull(cursor)
    await applyPulled(page)
  } while (page.has_more)
}

async function applyPulled(page: PullResponse): Promise<void> {
  const tables = [...SYNCED_TABLES.map(syncedTable), db.outbox, db.meta]
  await db.transaction('rw', tables, async () => {
    for (const { table, row } of page.changes) {
      if (!isSyncedTable(table)) continue // a table this version of the app doesn't know yet
      const hasLocalEdit = await db.outbox.get([table, row.id])
      if (hasLocalEdit) continue // the local edit is pushed next round; the server decides then
      await syncedTable(table).put(row)
    }
    await db.meta.put({ key: CURSOR_KEY, value: page.cursor })
  })
}
