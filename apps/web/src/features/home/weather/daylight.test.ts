import { describe, expect, it } from 'vitest'
import { guessSunTimes, moonPhase, skyLight } from './daylight'

// Lyon, 29 September 2026: sunrise 07:36, sunset 19:24 (Paris time, UTC+2).
const at = (time: string) => new Date(`2026-09-29T${time}:00+02:00`)
const LYON = [{ rise: at('07:36').getTime(), set: at('19:24').getTime() }]
const light = (time: string) => skyLight(at(time), LYON, 'Europe/Paris')

describe('skyLight', () => {
  it('is fully night an hour before sunrise and an hour after sunset', () => {
    expect(light('03:00').night).toBe(1)
    expect(light('06:36').night).toBe(1)
    expect(light('20:24').night).toBe(1)
    expect(light('23:30').night).toBe(1)
  })

  it('is fully day from 10 minutes after sunrise to 10 minutes before sunset', () => {
    expect(light('07:46').night).toBe(0)
    expect(light('13:00').night).toBe(0)
    expect(light('19:14').night).toBe(0)
  })

  it('darkens little by little at dusk, and lightens the same way at dawn', () => {
    const dusk = ['19:14', '19:24', '19:40', '19:55', '20:10', '20:24'].map((t) => light(t).night)
    dusk.slice(1).forEach((night, index) => expect(night).toBeGreaterThan(dusk[index]))
    expect(light('07:06').night).toBeCloseTo(light('19:54').night, 5)
  })

  it('glows warmest at sunrise and sunset, fading out an hour away', () => {
    expect(light('07:36').glow).toBe(1)
    expect(light('19:24').glow).toBe(1)
    expect(light('20:00').glow).toBeGreaterThan(0)
    expect(light('20:24').glow).toBe(0)
    expect(light('13:00').glow).toBe(0)
  })

  it('crosses the sun from sunrise on the left to sunset on the right', () => {
    expect(light('07:36').sun).toEqual({ across: 0, height: 0 })
    expect(light('13:30').sun).toEqual({ across: 0.5, height: 1 })
    expect(light('19:24').sun).toEqual({ across: 1, height: 0 })
  })

  it('takes the sun out of the card an hour and a quarter after sunrise, until as long before sunset', () => {
    const climb = ['07:36', '07:51', '08:06', '08:21', '08:36', '08:51'].map((t) => light(t).sun)
    climb.slice(1).forEach((sun, index) => expect(sun.height).toBeGreaterThan(climb[index].height))
    expect(light('08:51').sun.height).toBe(1)
    expect(light('18:09').sun.height).toBe(1)
    expect(light('18:30').sun.height).toBeLessThan(1)
  })

  it('keeps the sun below the horizon at night, where it set and where it will rise', () => {
    expect(light('20:00').sun.across).toBe(1)
    expect(light('20:00').sun.height).toBeLessThan(0)
    expect(light('23:00').sun).toEqual({ across: 1, height: -1 })
    expect(light('03:00').sun).toEqual({ across: 0, height: -1 })
    expect(light('07:00').sun.height).toBeLessThan(0)
  })

  it('crosses the moon from an hour after sunset to an hour before sunrise', () => {
    expect(light('20:24').moon).toEqual({ across: 0, height: 0 })
    expect(light('22:00').moon.height).toBe(1)
    // Halfway between the night's moonrise (20:24 the day before) and moonset (06:36).
    expect(light('01:30').moon).toEqual({ across: 0.5, height: 1 })
    expect(light('06:36').moon).toEqual({ across: 1, height: 0 })
  })

  it('keeps the moon below the horizon by day and at dusk', () => {
    expect(light('09:00').moon).toEqual({ across: 1, height: -1 })
    expect(light('13:00').moon.height).toBe(-1)
    expect(light('19:24').moon).toEqual({ across: 0, height: -0.8 })
  })

  it('keeps the moon up for the middle half of a short summer night, far north', () => {
    // Sunset at 23:30, sunrise at 02:30: moonrise at 00:15, moonset at 01:45.
    const day = [{ rise: at('02:30').getTime(), set: at('23:30').getTime() }]
    const moon = (hoursAfterSunset: number) =>
      skyLight(new Date(day[0].set + hoursAfterSunset * 3_600_000), day, 'Europe/Oslo').moon
    expect(moon(0.5).height).toBeLessThan(0)
    expect(moon(0.75)).toEqual({ across: 0, height: 0 })
    expect(moon(1.5).across).toBeCloseTo(0.5)
    expect(moon(1.5).height).toBeGreaterThan(0.5)
    expect(moon(2.25)).toEqual({ across: 1, height: 0 })
  })

  it('takes tomorrow’s sunrise after midnight, for a page left open overnight', () => {
    const tomorrow = { rise: LYON[0].rise + 86_400_000, set: LYON[0].set + 86_400_000 }
    const nextDawn = new Date(tomorrow.rise - 30 * 60_000)
    const { night } = skyLight(nextDawn, [...LYON, tomorrow], 'Europe/Paris')
    expect(night).toBeGreaterThan(0)
    expect(night).toBeLessThan(1)
  })

  it('guesses without sun times, and knows the hemisphere', () => {
    expect(skyLight(at('23:00'), [], 'Europe/Paris')).toMatchObject({ night: 1, southern: false })
    const sydneyNoon = new Date('2026-09-29T12:00:00+10:00')
    expect(skyLight(sydneyNoon, [], 'Australia/Sydney')).toMatchObject({ night: 0, southern: true })
  })
})

describe('guessSunTimes', () => {
  it('guesses from the season on the user’s clock', () => {
    const [autumn] = guessSunTimes(at('15:00'), 'Europe/Paris')
    expect(autumn).toEqual({ rise: at('07:30').getTime(), set: at('19:00').getTime() })
    const [winter] = guessSunTimes(new Date('2026-12-15T12:00:00+01:00'), 'Europe/Paris')
    expect(winter.set).toBe(Date.parse('2026-12-15T17:30:00+01:00'))
  })
})

describe('moonPhase', () => {
  // Distance to a phase, around the cycle (0.98 is 0.02 from a new moon).
  const off = (phase: number, expected: number) =>
    Math.min(Math.abs(phase - expected), 1 - Math.abs(phase - expected))

  it('is full at the 2026 lunar eclipses and new at the solar ones, within half a day', () => {
    expect(off(moonPhase(Date.UTC(2026, 2, 3, 11, 33)), 0.5)).toBeLessThan(0.02)
    expect(off(moonPhase(Date.UTC(2026, 7, 28, 4, 13)), 0.5)).toBeLessThan(0.02)
    expect(off(moonPhase(Date.UTC(2026, 1, 17, 12, 12)), 0)).toBeLessThan(0.02)
    expect(off(moonPhase(Date.UTC(2026, 7, 12, 17, 46)), 0)).toBeLessThan(0.02)
  })
})
