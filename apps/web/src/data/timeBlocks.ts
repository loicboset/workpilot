import type { CalendarDate } from '@internationalized/date'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { TimeBlock } from '@/db/types'
import { dayBounds, isBetween } from '@/lib/dates'
import { deleteLocally, newRowFields, nowIso, saveLocally, updateLocally } from './localWrites'

/** Time blocks repository (ADR 0017): reserved slots in the day, e.g. "Deep work 9:00–11:00". */

export type TimeBlockFields = Pick<TimeBlock, 'title' | 'start_at' | 'end_at' | 'milestone_id'>

/** Active blocks starting on the day (in the timezone), in time order. */
export async function listTimeBlocksOn(day: CalendarDate, timeZone: string): Promise<TimeBlock[]> {
  const bounds = dayBounds(day, timeZone)
  const blocks = await db.time_blocks
    .filter((block) => block.deleted_at === null && isBetween(block.start_at, bounds))
    .toArray()
  return blocks.sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at))
}

export function useTimeBlocksOn(day: CalendarDate, timeZone: string): TimeBlock[] | undefined {
  return useLiveQuery(() => listTimeBlocksOn(day, timeZone), [day.toString(), timeZone])
}

/** Every active block, for "time aligned" over a week. */
export function useAllTimeBlocks(): TimeBlock[] | undefined {
  return useLiveQuery(() => db.time_blocks.filter((block) => block.deleted_at === null).toArray())
}

export function addTimeBlock(
  fields: Pick<TimeBlockFields, 'title' | 'start_at' | 'end_at'> & Partial<TimeBlockFields>,
): Promise<TimeBlock> {
  return saveLocally<TimeBlock>('time_blocks', {
    ...newRowFields(),
    milestone_id: null,
    completed_at: null,
    ...fields,
    title: fields.title.trim(),
  })
}

export function updateTimeBlock(
  id: string,
  changes: Partial<TimeBlockFields & Pick<TimeBlock, 'completed_at'>>,
): Promise<TimeBlock> {
  return updateLocally<TimeBlock>('time_blocks', id, changes)
}

export const completeTimeBlock = (id: string) => updateTimeBlock(id, { completed_at: nowIso() })
export const reopenTimeBlock = (id: string) => updateTimeBlock(id, { completed_at: null })
export const deleteTimeBlock = (id: string) => deleteLocally('time_blocks', id)

/** Move a block by whole days, keeping its times: "postpone to tomorrow". */
export function shiftTimeBlock(block: TimeBlock, days: number): Promise<TimeBlock> {
  const shift = (iso: string) => new Date(Date.parse(iso) + days * 86_400_000).toISOString()
  return updateTimeBlock(block.id, { start_at: shift(block.start_at), end_at: shift(block.end_at) })
}
