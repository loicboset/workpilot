/**
 * Days and times in the user's timezone (from the profile), whatever the device's clock says.
 * Days are `CalendarDate`s ("2026-09-28"); moments are stored as ISO UTC strings.
 */
import {
  parseAbsolute,
  startOfWeek,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
  type CalendarDate,
  type Time,
  type ZonedDateTime,
} from '@internationalized/date'

/** The start and end of a day in the timezone, as UTC timestamps (ms): [start, end). */
export function dayBounds(day: CalendarDate, timeZone: string): [number, number] {
  return [day.toDate(timeZone).getTime(), day.add({ days: 1 }).toDate(timeZone).getTime()]
}

/** A day and a time of day in the timezone, as an ISO UTC string. */
export function momentOf(day: CalendarDate, time: Time, timeZone: string): string {
  return toZoned(toCalendarDateTime(day, time), timeZone).toAbsoluteString()
}

export function zoned(iso: string, timeZone: string): ZonedDateTime {
  return parseAbsolute(iso, timeZone)
}

/** The day a moment falls on, in the timezone. */
export function dayOf(iso: string, timeZone: string): CalendarDate {
  return toCalendarDate(parseAbsolute(iso, timeZone))
}

export function isBetween(iso: string, [start, end]: [number, number]): boolean {
  const moment = Date.parse(iso)
  return moment >= start && moment < end
}

/** The week holding the day, in the timezone: [start, end). The first weekday follows the locale. */
export function weekBounds(day: CalendarDate, timeZone: string, locale: string): [number, number] {
  const first = startOfWeek(day, locale)
  return [first.toDate(timeZone).getTime(), first.add({ weeks: 1 }).toDate(timeZone).getTime()]
}
