/**
 * The light of the sky, for the weather widget: how dark it is, how warm the glow of dawn or
 * dusk, how high the sun stands, and the phase of the moon. All of it changes gradually, minute
 * by minute. From the city's sunrise and sunset when they are known, otherwise a guess from the
 * user's clock and the season.
 */
import { fromDate, toCalendarDate } from '@internationalized/date'
import { isSouthern, seasonOf } from '../season'
import type { Season } from '../season'

/** Sunrise and sunset of one day, in ms since the epoch. */
export type SunTimes = { rise: number; set: number }

export type SkyLight = {
  /** 0 by day, 1 at night, in between at twilight. */
  night: number
  /** The warm light of dawn and dusk: 1 at sunrise and sunset, 0 an hour or more away. */
  glow: number
  /** 1 at noon, 0 on the horizon, down to -1 two hours before sunrise or after sunset. */
  sunHeight: number
  /** 0 new moon, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
  moonPhase: number
  /** The moon is lit from the other side in the southern hemisphere. */
  southern: boolean
}

/** Rough sunrise and sunset on the clock, in hours, for places like most of Europe. */
const GUESSED_HOURS: Record<Season, { rise: number; set: number }> = {
  winter: { rise: 8, set: 17.5 },
  spring: { rise: 6.75, set: 20 },
  summer: { rise: 6.25, set: 21.5 },
  autumn: { rise: 7.5, set: 19 },
}

/** A new moon (6 January 2000, 18:14 UTC), and the average time from one to the next. */
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)
const LUNAR_MONTH = 29.530588853 * 86_400_000

/** The sky at `now`, from the days' sun times (or a guess when there are none). */
export const skyLight = (now: Date, days: readonly SunTimes[], timeZone: string): SkyLight => {
  const { rise, set } = nearestDay(now.getTime(), days.length ? days : guessSunTimes(now, timeZone))
  const sinceRise = (now.getTime() - rise) / 60_000 // in minutes
  const sinceSet = (now.getTime() - set) / 60_000
  return {
    // Night falls from 10 minutes before sunset to an hour after it, and lifts the same way.
    night: Math.max(ease(10, -60, sinceRise), ease(-10, 60, sinceSet)),
    glow: Math.max(1 - ease(0, 60, Math.abs(sinceRise)), 1 - ease(0, 60, Math.abs(sinceSet))),
    sunHeight:
      sinceRise < 0
        ? Math.max(sinceRise / 120, -1)
        : sinceSet > 0
          ? Math.max(-sinceSet / 120, -1)
          : // Half a turn of a sine from sunrise to sunset: it rises fast and lingers at noon.
            Math.sin((Math.PI * (now.getTime() - rise)) / (set - rise)),
    moonPhase: moonPhase(now.getTime()),
    southern: isSouthern(timeZone),
  }
}

/** Today's sunrise and sunset as a guess, when the city's aren't known. */
export const guessSunTimes = (now: Date, timeZone: string): SunTimes[] => {
  const zoned = fromDate(now, timeZone)
  const { rise, set } = GUESSED_HOURS[seasonOf(toCalendarDate(zoned), timeZone)]
  const midnight = now.getTime() - (zoned.hour * 60 + zoned.minute) * 60_000
  return [{ rise: midnight + rise * 3_600_000, set: midnight + set * 3_600_000 }]
}

/** From the average lunar month: within half a day of the real phases. */
export const moonPhase = (now: number) => ((((now - NEW_MOON) / LUNAR_MONTH) % 1) + 1) % 1

/** 0 at `from`, 1 at `to` (either way round), easing in and out between. */
export const ease = (from: number, to: number, x: number) => {
  const t = Math.min(Math.max((x - from) / (to - from), 0), 1)
  return t * t * (3 - 2 * t)
}

/** The day whose noon is nearest: at 2 am the one whose sunrise is to come, at 11 pm today. */
const nearestDay = (now: number, days: readonly SunTimes[]) =>
  days.reduce((best, day) => (Math.abs(noon(day) - now) < Math.abs(noon(best) - now) ? day : best))

const noon = ({ rise, set }: SunTimes) => (rise + set) / 2
