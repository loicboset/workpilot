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

/** "Today", "Tomorrow", "Yesterday", or the short date. */
export function dayLabel(
  day: CalendarDate,
  t: TFunction,
  locale: string,
  timeZone: string,
): string {
  const offset = day.compare(todayIn(timeZone))
  if (offset === 0) return t('common.today')
  if (offset === 1) return t('common.tomorrow')
  if (offset === -1) return t('common.yesterday')
  return formatDay(day, locale, timeZone, true)
}

/** "09:30" or "9:30 AM", as the locale writes it. */
export function formatClock(isoOrDate: string | Date, locale: string, timeZone: string) {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return new DateFormatter(locale, { hour: 'numeric', minute: '2-digit', timeZone }).format(date)
}

/** A time of day on its own (no timezone involved). */
export function formatTimeOfDay(time: Time, locale: string) {
  const date = new Date(Date.UTC(2000, 0, 1, time.hour, time.minute))
  return new DateFormatter(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(
    date,
  )
}
