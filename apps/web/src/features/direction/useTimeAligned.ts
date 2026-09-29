import { today } from '@internationalized/date'
import { useTranslation } from 'react-i18next'
import { timeAligned } from '@/data/direction'
import { useTimeZone } from '@/data/profile'
import { useAllTimeBlocks } from '@/data/timeBlocks'
import { useTodos } from '@/data/todos'
import { weekBounds } from '@/lib/dates'

/** Shares (0–1) of done work linked to a milestone; `null` for a week with nothing done. */
export type TimeAlignedWeeks = { thisWeek: number | null; lastWeek: number | null }

/** This week and last week, to see which way things are going. `undefined` while loading. */
export const useTimeAlignedWeeks = (): TimeAlignedWeeks | undefined => {
  // HOOKS
  const { i18n } = useTranslation()
  const timeZone = useTimeZone()
  const todos = useTodos()
  const blocks = useAllTimeBlocks()

  if (!todos || !blocks) return undefined

  // VARS
  const work = [...todos, ...blocks]
  const day = today(timeZone)

  return {
    thisWeek: timeAligned(work, weekBounds(day, timeZone, i18n.language)),
    lastWeek: timeAligned(work, weekBounds(day.subtract({ weeks: 1 }), timeZone, i18n.language)),
  }
}

/** This week's share (0–1) of done work linked to a milestone, or `null` if nothing is done yet. */
export const useTimeAlignedThisWeek = (): number | null | undefined =>
  useTimeAlignedWeeks()?.thisWeek
