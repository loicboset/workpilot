/**
 * The light of the sky, for the weather widget: how dark it is, how warm the glow of dawn or
 * dusk, where the sun and the moon stand, and the phase of the moon. All of it changes
 * gradually, minute by minute. From the city's sunrise and sunset when they are known, otherwise
 * a guess from the user's clock and the season.
 */
import { fromDate, toCalendarDate } from '@internationalized/date'
import { isSouthern, seasonOf } from '../season'
import type { Season } from '../season'

/** Sunrise and sunset of one day, in ms since the epoch. */
export type SunTimes = { rise: number; set: number }

/**
 * Where the sun or the moon stands on its way across the card, to show the time going by. It
 * rises from behind the hills on the left, climbs out of the card (its light still shows along
 * the top), crosses it, and comes back down on the right to set.
 */
export type Course = {
  /** 0 when it rises, on the left, to 1 when it sets, on the right. */
  across: number
  /** 0 on the horizon, 1 up above the card; below 0 once it has set, down to -1. */
  height: number
}

export type SkyLight = {
  /** 0 by day, 1 at night, in between at twilight. */
  night: number
  /** The warm light of dawn and dusk: 1 at sunrise and sunset, 0 an hour or more away. */
  glow: number
  /** From sunrise to sunset. */
  sun: Course
  /** From an hour after sunset to an hour before sunrise, like a sun of the night. */
  moon: Course
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

const HOUR = 3_600_000
const DAY = 24 * HOUR

/** In minutes: how long the sun or the moon takes to climb out of the card, or to come down. */
const CLIMB = 75

/** The sky at `now`, from the days' sun times (or a guess when there are none). */
export const skyLight = (now: Date, days: readonly SunTimes[], timeZone: string): SkyLight => {
  const known = days.length ? days : guessSunTimes(now, timeZone)
  const day = nearest(now.getTime(), known)
  const sinceRise = (now.getTime() - day.rise) / 60_000 // in minutes
  const sinceSet = (now.getTime() - day.set) / 60_000
  return {
    // Night falls from 10 minutes before sunset to an hour after it, and lifts the same way.
    night: Math.max(ease(10, -60, sinceRise), ease(-10, 60, sinceSet)),
    glow: Math.max(1 - ease(0, 60, Math.abs(sinceRise)), 1 - ease(0, 60, Math.abs(sinceSet))),
    sun: courseOf(now.getTime(), day),
    moon: courseOf(now.getTime(), nearest(now.getTime(), moonTimes(known))),
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

/**
 * The moon's rises and sets (shaped like the sun's), one for each night around the days: it
 * rises once night has fallen, an hour after sunset, and sets as dawn begins, an hour before
 * sunrise. Nights shorter than four hours keep it up for their middle half. Before the first day
 * and after the last, their sun is taken to rise and set a day away.
 */
const moonTimes = (days: readonly SunTimes[]): SunTimes[] =>
  [
    { dusk: days[0].set - DAY, dawn: days[0].rise },
    ...days.slice(1).map((day, index) => ({ dusk: days[index].set, dawn: day.rise })),
    { dusk: days[days.length - 1].set, dawn: days[days.length - 1].rise + DAY },
  ].map(({ dusk, dawn }) => {
    const wait = Math.min(HOUR, (dawn - dusk) / 4)
    return { rise: dusk + wait, set: dawn - wait }
  })

/** Where the sun (or the moon) stands at `now`, between its rise and its set. */
const courseOf = (now: number, { rise, set }: SunTimes): Course => {
  // In minutes from the nearer horizon: below 0 before it rises and after it sets.
  const up = Math.min(now - rise, set - now) / 60_000
  return {
    across: Math.min(Math.max((now - rise) / (set - rise), 0), 1),
    height:
      up < 0
        ? Math.max(up / CLIMB, -1)
        : // A quarter turn of a sine: it leaves the horizon fast and slows as it reaches the top.
          Math.sin((Math.PI / 2) * Math.min(up / CLIMB, 1)),
  }
}

/**
 * The day (or the night) whose middle is nearest: at 2 am the day whose sunrise is to come, at
 * 11 pm today.
 */
const nearest = (now: number, days: readonly SunTimes[]) =>
  days.reduce((best, day) =>
    Math.abs(middle(day) - now) < Math.abs(middle(best) - now) ? day : best,
  )

const middle = ({ rise, set }: SunTimes) => (rise + set) / 2
