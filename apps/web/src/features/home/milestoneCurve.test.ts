import { describe, expect, it } from 'vitest'
import { wavePath, waveX, waveY } from './milestoneCurve'

const SPAN = { from: 40, to: 1240 }

/** The points of an SVG path made of "M x y L x y L …". */
const pointsOf = (path: string) =>
  path
    .slice(1)
    .split('L')
    .map((point) => point.split(' ').map(Number))

describe('the milestone wave', () => {
  it('goes through the points of the concept, where the five milestones sit', () => {
    expect(waveY(0)).toBeCloseTo(63.75)
    expect(waveY(0.5)).toBeCloseTo(57.75)
    expect(waveY(0.75)).toBeCloseTo(39.75)
    expect(waveY(1)).toBeCloseTo(45.25)
    // Smooth where two stretches meet (at u = 0.2125): no jump, the same slope on both sides.
    const [knot, step] = [0.2125, 1e-4]
    const before = (waveY(knot) - waveY(knot - step)) / step
    const after = (waveY(knot + step) - waveY(knot)) / step
    expect(Math.abs(waveY(knot + step) - waveY(knot - step))).toBeLessThan(0.1)
    expect(after).toBeCloseTo(before, 0)
  })

  it('stays at its ends outside 0–1', () => {
    expect(waveY(-1)).toBe(waveY(0))
    expect(waveY(2)).toBe(waveY(1))
  })

  it('places points evenly between the ends', () => {
    expect(waveX(0, SPAN)).toBe(40)
    expect(waveX(0.25, SPAN)).toBe(340)
    expect(waveX(1, SPAN)).toBe(1240)
  })

  it('draws the walked part and the part ahead so that they meet at "you are here"', () => {
    const walked = pointsOf(wavePath(SPAN, 0, 0.5))
    const ahead = pointsOf(wavePath(SPAN, 0.5, 1))

    expect(walked[0]).toEqual([40, 63.75])
    expect(walked.at(-1)).toEqual(ahead[0])
    expect(ahead[0][0]).toBe(640)
    expect(ahead.at(-1)).toEqual([1240, 45.25])
  })

  it('draws nothing without width, or with nothing left ahead', () => {
    expect(wavePath({ from: 40, to: -40 })).toBe('')
    expect(wavePath(SPAN, 1, 1)).toBe('')
  })
})
