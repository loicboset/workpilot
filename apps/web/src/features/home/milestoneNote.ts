import { parseDate, type CalendarDate } from '@internationalized/date'
import type { Milestone } from '@/db/types'
import { dayOf } from '@/lib/dates'

/** Where a milestone is on the path. */
export type MilestoneState = 'reached' | 'here' | 'ahead'

/** When it was reached, or is hoped for: a quarter of this year, else a year. */
export type MilestoneWhen = { quarter: number } | { year: number } | null

/** The reached milestones, then the first one not reached ("you are here"), then the rest. */
export const milestoneState = (
  milestone: Milestone,
  here: Milestone | undefined,
): MilestoneState => {
  if (milestone.completed_at !== null) return 'reached'
  return milestone.id === here?.id ? 'here' : 'ahead'
}

export const milestoneWhen = (
  milestone: Milestone,
  today: CalendarDate,
  timeZone: string,
): MilestoneWhen => {
  let day: CalendarDate | null = null
  if (milestone.completed_at) day = dayOf(milestone.completed_at, timeZone)
  else if (milestone.target_date) day = parseDate(milestone.target_date)
  if (!day) return null
  return day.year === today.year ? { quarter: Math.ceil(day.month / 3) } : { year: day.year }
}
