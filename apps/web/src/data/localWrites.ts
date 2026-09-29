import { db, syncedTable } from '@/db/db'
import type { WritableTableName } from '@/db/tables'
import type { SpaceRow, SyncedRow } from '@/db/types'
import { requestSync } from '@/sync/scheduler'

/**
 * Writes made on this device ("lazy writes", ADR 0025): save to Dexie first, so the screen
 * updates at once and nothing needs the network, then queue the row for sync.
 * Repositories use these helpers; screens use the repositories.
 */

export function nowIso(): string {
  return new Date().toISOString()
}

/** The fields every new row starts with. The id is created here, on the device. */
export function newRowFields(): SyncedRow {
  const now = nowIso()
  return { id: crypto.randomUUID(), created_at: now, updated_at: now, deleted_at: null }
}

/** The fields every new row of a space starts with (ADR 0031). */
export const newSpaceRowFields = (spaceId: string): SpaceRow => ({
  ...newRowFields(),
  space_id: spaceId,
})

/** Save a whole row and queue it for sync. */
export async function saveLocally<Row extends SyncedRow>(
  table: WritableTableName,
  row: Row,
): Promise<Row> {
  const saved = { ...row, updated_at: nowIso() }
  await db.transaction('rw', syncedTable(table), db.outbox, async () => {
    await syncedTable(table).put(saved)
    await db.outbox.put({ table, id: saved.id, change_id: crypto.randomUUID() })
  })
  requestSync()
  return saved
}

/** Change some fields of an existing row and queue it for sync. */
export async function updateLocally<Row extends SyncedRow>(
  table: WritableTableName,
  id: string,
  changes: Partial<Row>,
): Promise<Row> {
  // One transaction, so a pulled version can't land between reading and saving.
  return db.transaction('rw', syncedTable(table), db.outbox, async () => {
    const current = (await syncedTable(table).get(id)) as Row | undefined
    if (!current || current.deleted_at) throw new Error(`${table} ${id} not found`)
    return saveLocally(table, { ...current, ...changes })
  })
}

/** Soft delete: the row stays, marked deleted, so the deletion syncs to every device. */
export async function deleteLocally(table: WritableTableName, id: string): Promise<void> {
  await updateLocally(table, id, { deleted_at: nowIso() })
}
