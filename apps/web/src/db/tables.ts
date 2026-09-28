/** The tables that sync with the server. Same names as on the server (apps/api/app/sync/tables.py). */
export const SYNCED_TABLES = [
  'profiles',
  'north_stars',
  'milestones',
  'review_templates',
  'todos',
  'time_blocks',
  'reminders',
  'ideas',
  'notes',
  'journal_entries',
  'ticker_messages',
] as const

export type SyncedTableName = (typeof SYNCED_TABLES)[number]

/** Tables this device may change. Ticker messages are written by the server (the AI) only. */
export type WritableTableName = Exclude<SyncedTableName, 'ticker_messages'>

export function isSyncedTable(name: string): name is SyncedTableName {
  return (SYNCED_TABLES as readonly string[]).includes(name)
}
