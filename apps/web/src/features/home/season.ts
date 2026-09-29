import type { CalendarDate } from '@internationalized/date'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

/** Meteorological seasons in the north, starting in March. */
const NORTH: Season[] = ['winter', 'spring', 'summer', 'autumn']

/** Timezones of the southern hemisphere's temperate places, where the seasons are swapped. */
const SOUTHERN_TIMEZONE =
  /^(Australia|Antarctica)\/|^Pacific\/(Auckland|Chatham)$|^America\/(Argentina\/.+|Santiago|Punta_Arenas|Montevideo|Asuncion|Sao_Paulo)$|^Africa\/(Johannesburg|Maseru|Mbabane|Maputo|Windhoek|Gaborone)$/

/** Whether the user lives in the southern hemisphere, as their timezone tells. */
export const isSouthern = (timeZone: string) => SOUTHERN_TIMEZONE.test(timeZone)

/** The season of a day where the user lives (their timezone tells the hemisphere). */
export const seasonOf = (day: CalendarDate, timeZone: string): Season => {
  const quarter = Math.floor((day.month % 12) / 3) // Dec–Feb 0, Mar–May 1, Jun–Aug 2, Sep–Nov 3
  const shift = isSouthern(timeZone) ? 2 : 0
  return NORTH[(quarter + shift) % 4]
}
