/**
 * The gentle wave the milestone path follows, as in the Grove concept. Points are (u, y):
 * u from 0 (first milestone) to 1 (the last), y in pixels from the top of the path area.
 * The line goes through them smoothly (a cubic Hermite spline), and the milestones sit on it,
 * so the path looks the same whatever the number of milestones or the width.
 */
const WAVE: [number, number][] = [
  [0, 63.75],
  [0.0375, 52.5],
  [0.0875, 42.83],
  [0.15, 38.5],
  [0.2125, 42.92],
  [0.275, 54.75],
  [0.325, 62],
  [0.4, 66],
  [0.45, 63.5],
  [0.5, 57.75],
  [0.5667, 48.5],
  [0.65, 41.5],
  [0.75, 39.75],
  [0.875, 42.08],
  [1, 45.25],
]

const STEP = 2 // pixels between two points of a drawn path

const round = (value: number) => Math.round(value * 100) / 100

/** The slope (dy/du) at each point: from its neighbours, one-sided at the ends. */
const SLOPES = WAVE.map((_, k) => {
  const [u0, y0] = WAVE[Math.max(k - 1, 0)]
  const [u1, y1] = WAVE[Math.min(k + 1, WAVE.length - 1)]
  return (y1 - y0) / (u1 - u0)
})

/** The height of the wave at u (0–1). */
export const waveY = (u: number): number => {
  const clamped = Math.min(Math.max(u, 0), 1)
  const k = WAVE.findIndex(([end]) => end >= clamped) // the stretch ending at or after u
  if (k <= 0) return WAVE[0][1]
  const [u0, y0] = WAVE[k - 1]
  const [u1, y1] = WAVE[k]
  const h = u1 - u0
  const t = (clamped - u0) / h
  const t2 = t * t
  const t3 = t2 * t
  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * h * SLOPES[k - 1] +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * h * SLOPES[k]
  )
}

/** Where the wave starts and ends, in pixels from the left of the path area. */
export type WaveSpan = { from: number; to: number }

/** The x of a point u (0–1) of the wave. */
export const waveX = (u: number, { from, to }: WaveSpan): number => from + u * (to - from)

/**
 * An SVG path along the wave from u = `from` to u = `to` (0–1), in short straight steps: the
 * walked part and the part ahead are drawn separately, so the dots start at "you are here".
 */
export const wavePath = (span: WaveSpan, from = 0, to = 1): string => {
  const length = (to - from) * (span.to - span.from)
  const steps = Math.max(1, Math.ceil(length / STEP))
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const u = from + ((to - from) * i) / steps
    return `${round(waveX(u, span))} ${round(waveY(u))}`
  })
  return length > 0 ? `M${points.join('L')}` : ''
}
