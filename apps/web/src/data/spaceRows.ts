import type { Table } from 'dexie'
import type { SpaceRow } from '@/db/types'

/**
 * The active rows of one space, in no particular order. Every repository reads through here, so
 * a screen only ever sees the rows of its own space (ADR 0031).
 */
export const activeRowsIn = <Row extends SpaceRow, Insert>(
  table: Table<Row, string, Insert>,
  spaceId: string,
): Promise<Row[]> =>
  table
    .where('space_id')
    .equals(spaceId)
    .filter((row) => row.deleted_at === null)
    .toArray()
