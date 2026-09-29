/** Dates and times shown to the user, in their language and timezone. */
import {
  DateFormatter,
  today as todayIn,
  type CalendarDate,
  type Time,
} from '@internationalized/date'
import type { TFunction } from 'i18next'

/** "Friday 2 October", or "Fri 2 Oct" when `short`. */
export function formatDay(day: CalendarDate, locale: string, timeZone: string, short = false) {
  const style = short
    ? ({ weekday: 'short', day: 'numeric', month: 'short' } as const)
    : ({ weekday: 'long', day: 'numeric', month: 'long' } as const)
  return new DateFormatter(locale, { ...style, timeZone }).format(day.toDate(timeZone))
}

/**
 * "Today", "Tomorrow", "Yesterday", or the short date. `inSentence` writes the relative words
 * in lower case, for "due tomorrow" / "pour demain".
 */
export function dayLabel(
  day: CalendarDate,
  t: TFunction,
  locale: string,
  timeZone: string,
  { inSentence = false } = {},
): string {
  const key = RELATIVE_DAYS[day.compare(todayIn(timeZone))] // days from today
  if (!key) return formatDay(day, locale, timeZone, true)
  const word = t(key)
  return inSentence ? word.toLocaleLowerCase(locale) : word
}

const RELATIVE_DAYS: Record<number, string> = {
  [-1]: 'common.yesterday',
  0: 'common.today',
  1: 'common.tomorrow',
}

/**
 * "9:30" or "9:30 AM", as the locale writes it. `twoDigitHour` lines times up in a column:
 * "08:30", "14:00".
 */
export function formatClock(
  isoOrDate: string | Date,
  locale: string,
  timeZone: string,
  { twoDigitHour = false } = {},
) {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  const hour = twoDigitHour ? '2-digit' : 'numeric'
  return new DateFormatter(locale, { hour, minute: '2-digit', timeZone }).format(date)
}

/** A time of day on its own (no timezone involved). */
export function formatTimeOfDay(time: Time, locale: string) {
  const date = new Date(Date.UTC(2000, 0, 1, time.hour, time.minute))
  return new DateFormatter(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(
    date,
  )
}

/** "5 minutes ago", "2 hours ago", "yesterday", as the locale says it. A moment ahead is "now". */
export const formatAgo = (iso: string, locale: string, now = Date.now()) => {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const minutes = Math.min(0, Math.round((Date.parse(iso) - now) / 60_000))
  if (minutes > -60) return format.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours > -24) return format.format(hours, 'hour')
  return format.format(Math.round(hours / 24), 'day')
}
