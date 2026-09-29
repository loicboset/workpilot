import type { ReactNode } from 'react'
import type { Course } from './daylight'

type AloftProps = { course: Course; children: ReactNode }

// In px of the card. Where the sun and the moon rise and set, in from the left and right edges
// (clear of the rounded corners); their centre on the horizon, the bottom of the card; and up
// above the card, where only their lower edge and their light show.
const INSET = 44
const HORIZON = 96
const ALOFT = -8

/**
 * Carries the sun or the moon, drawn around (0, 0), along its course across the card. Each
 * minute's step glides.
 */
export const Aloft = ({ course, children }: AloftProps) => {
  // VARS
  // `cqw` is the width of the card (the scene's `@container`), whatever it is.
  const x = `calc(${INSET}px + ${course.across} * (100cqw - ${2 * INSET}px))`
  const y = `${HORIZON + (ALOFT - HORIZON) * course.height}px`

  return (
    <div
      className="absolute top-0 left-0 transition-transform duration-3000"
      style={{ transform: `translate(${x}, ${y})` }}
    >
      {children}
    </div>
  )
}

type LightProps = {
  /** The colour it fades from, at its centre: a `from-*` gradient class. */
  className: string
  opacity: number
}

/**
 * The soft light around the sun or the moon, placed by `Aloft`. While they are above the card,
 * it lights the top of the card where they are, even through the clouds.
 */
export const Light = ({ className, opacity }: LightProps) => (
  <div
    className={`absolute -top-14 -left-24 h-28 w-48 bg-radial-[closest-side] to-transparent ${className}`}
    style={{ opacity }}
  />
)
