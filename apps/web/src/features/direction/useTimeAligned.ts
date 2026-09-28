import { today } from '@internationalized/date'
import { useTranslation } from 'react-i18next'
import { timeAligned } from '@/data/direction'
import { useTimeZone } from '@/data/profile'
import { useAllTimeBlocks } from '@/data/timeBlocks'
import { useTodos } from '@/data/todos'
import { weekBounds } from '@/lib/dates'

/** This week's share (0–1) of done work linked to a milestone, or `null` if nothing is done yet. */
export function useTimeAlignedThisWeek(): number | null | undefined {
  const { i18n } = useTranslation()
  const timeZone = useTimeZone()
  const todos = useTodos()
  const blocks = useAllTimeBlocks()
  if (!todos || !blocks) return undefined
  return timeAligned([...todos, ...blocks], weekBounds(today(timeZone), timeZone, i18n.language))
}
