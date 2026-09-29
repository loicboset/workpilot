import Dexie, { type EntityTable, type Table } from 'dexie'
import type { SyncedTableName, WritableTableName } from './tables'
import type {
  Idea,
  JournalEntry,
  Milestone,
  NorthStar,
  Note,
  Profile,
  Reminder,
  ReviewTemplate,
  Space,
  SyncedRow,
  TickerMessage,
  TimeBlock,
  Todo,
} from './types'

/**
 * Local database in IndexedDB: the UI reads and writes here first, so the app works offline.
 * The sync engine (src/sync) keeps it in step with the server (ADR 0025).
 *
 * Every schema change adds a new `db.version(n)` below; never edit an old one.
 */

/** A row changed on this device that still has to reach the server. One entry per row. */
export interface OutboxEntry {
  table: WritableTableName
  id: string
  // New for every local edit, so sync can tell whether the row changed again meanwhile.
  change_id: string
}

/** A local version the server did not keep, saved so nothing is silently lost. */
export interface Conflict {
  seq?: number
  table: string
  id: string
  row: SyncedRow
  reason: string // "newer_on_server", or why the server rejected it
  saved_at: string
}

/** Where the last pull stopped, in `meta` (ADR 0025): the next one asks for what came after. */
export const CURSOR_KEY = 'sync.cursor'

/** Small key/value store for local app state (e.g. the sync cursor). */
export interface MetaEntry {
  key: string
  value: unknown
}

export const db = new Dexie('workpilot') as Dexie & {
  spaces: EntityTable<Space, 'id'>
  profiles: EntityTable<Profile, 'id'>
  north_stars: EntityTable<NorthStar, 'id'>
  milestones: EntityTable<Milestone, 'id'>
  review_templates: EntityTable<ReviewTemplate, 'id'>
  todos: EntityTable<Todo, 'id'>
  time_blocks: EntityTable<TimeBlock, 'id'>
  reminders: EntityTable<Reminder, 'id'>
  ideas: EntityTable<Idea, 'id'>
  notes: EntityTable<Note, 'id'>
  journal_entries: EntityTable<JournalEntry, 'id'>
  ticker_messages: EntityTable<TickerMessage, 'id'>
  outbox: Table<OutboxEntry, [string, string]>
  conflicts: EntityTable<Conflict, 'seq'>
  meta: EntityTable<MetaEntry, 'key'>
}

db.version(1).stores({
  meta: 'key',
})

db.version(2).stores({
  profiles: 'id',
  north_stars: 'id',
  milestones: 'id, north_star_id, position',
  review_templates: 'id, kind',
  todos: 'id, due_date, milestone_id',
  time_blocks: 'id, start_at, milestone_id',
  reminders: 'id, remind_at',
  ideas: 'id, created_at',
  notes: 'id, milestone_id, updated_at',
  journal_entries: 'id, entry_date',
  ticker_messages: 'id, created_at',
  outbox: '[table+id]',
  conflicts: '++seq, [table+id]',
})

// Spaces (ADR 0031). Rows saved before them have no `space_id`: the server gave each one its
// space. The sync cursor is forgotten, so this device pulls everything again, once: an app from
// before spaces skipped the `spaces` rows it didn't know, but still moved its cursor past them.
db.version(3)
  .stores({
    spaces: 'id, slug',
    north_stars: 'id, space_id',
    milestones: 'id, space_id, north_star_id, position',
    review_templates: 'id, space_id, kind',
    todos: 'id, space_id, due_date, milestone_id',
    time_blocks: 'id, space_id, start_at, milestone_id',
    reminders: 'id, space_id, remind_at',
    ideas: 'id, space_id, created_at',
    notes: 'id, space_id, milestone_id, updated_at',
    journal_entries: 'id, space_id, entry_date',
    ticker_messages: 'id, space_id, created_at',
  })
  .upgrade((tx) => tx.table('meta').delete(CURSOR_KEY))

/** A synced table by name, for code that handles every table the same way (sync). */
export function syncedTable(name: SyncedTableName): Table<SyncedRow, string> {
  return db.table(name)
}
