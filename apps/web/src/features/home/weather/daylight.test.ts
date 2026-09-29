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

  it('raises the sun from the horizon to its highest halfway, and sinks it below after', () => {
    expect(light('07:36').sunHeight).toBeCloseTo(0)
    expect(light('13:30').sunHeight).toBeCloseTo(1)
    expect(light('19:24').sunHeight).toBeCloseTo(0)
    expect(light('20:24').sunHeight).toBeCloseTo(-0.5)
    expect(light('23:00').sunHeight).toBe(-1)
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
