/**
 * The moving parts of the weather scene: clouds, rain, snow, mist, lightning and stars.
 * Each piece loops forever on a CSS animation from `weather.css`. Its duration, and a negative
 * delay, are set here per piece: the pieces don't move in step, and the scene opens midway
 * rather than with every cloud waiting beyond the left edge.
 */
import type { CSSProperties } from 'react'

export type Cloud = {
  shape: keyof typeof SHAPES
  /** In px; the height follows the shape. */
  width: number
  /** In px, from the top of the card. */
  top: number
  /** How long it takes to cross the card. */
  seconds: number
  /** Where it is when the page opens: 0 just beyond the left edge, 1 just beyond the right. */
  start: number
}

export type Rain = 'drizzle' | 'rain' | 'downpour'

/** The two cloud outlines of the Grove concept. */
const SHAPES = {
  puffy: {
    viewBox: '0 0 48 27',
    body: (
      <>
        <circle cx="10" cy="17" r="10" />
        <circle cx="27.25" cy="11.75" r="11.75" />
        <circle cx="38.5" cy="18" r="9" />
        <rect x="10" y="17" width="28.5" height="10" />
      </>
    ),
  },
  small: {
    viewBox: '0 0 38 21.5',
    body: (
      <>
        <circle cx="7.5" cy="13.5" r="7.5" />
        <circle cx="21.5" cy="9" r="9" />
        <circle cx="31" cy="14.5" r="7" />
        <rect x="6.5" y="13" width="26" height="8.5" rx="4" />
      </>
    ),
  },
}

const RAIN = {
  drizzle: { count: 14, seconds: 1.8, drop: 'h-1.5 bg-grove-sky-ink/25' },
  rain: { count: 26, seconds: 1.1, drop: 'h-2.5 bg-grove-sky-ink/35' },
  downpour: { count: 36, seconds: 0.75, drop: 'h-3 bg-grove-sky-ink/40' },
}

/** Fog, from a thin wisp up high to the thick ones lying on the hills. Widths are of the card. */
const MIST_WISPS = [
  { top: 18, height: 12, width: '55%', opacity: 0.5, seconds: 60, start: 0.3 },
  { top: 40, height: 16, width: '70%', opacity: 0.65, seconds: 75, start: 0.75 },
  { top: 62, height: 20, width: '65%', opacity: 0.8, seconds: 50, start: 0.1 },
  { top: 70, height: 22, width: '80%', opacity: 0.8, seconds: 90, start: 0.55 },
]

// Fractional parts of the golden ratio, √3 and √2, for `scatter`.
const ACROSS = 0.618034
const PHASE = 0.732051
const PACE = 0.414214

type CloudsProps = { clouds: readonly Cloud[]; stormy?: boolean }

/** Clouds crossing from left to right: once one is gone on the right, it comes back from the left. */
export const Clouds = ({ clouds, stormy = false }: CloudsProps) => (
  <div className={stormy ? 'fill-grove-storm-cloud' : 'fill-grove-cloud'}>
    {clouds.map((cloud, index) => (
      <div
        key={index}
        className="absolute left-0 animate-cross"
        // A storm blows its clouds along faster.
        style={{
          top: cloud.top,
          width: cloud.width,
          ...timing(cloud.seconds * (stormy ? 0.6 : 1), cloud.start),
        }}
      >
        {stormy && index === 0 && <Bolt />}
        {/* Positioned, so that it hides the top of the bolt. */}
        <svg viewBox={SHAPES[cloud.shape].viewBox} className="relative w-full">
          {SHAPES[cloud.shape].body}
        </svg>
      </div>
    ))}
  </div>
)

/** Lit together with the sky's `Flash`: both start with the page and share the `flash` rhythm. */
const Bolt = () => (
  <svg
    viewBox="0 0 10 16"
    className="absolute top-[80%] left-[40%] w-3 fill-grove-sun-ink opacity-0 animate-flash"
  >
    <path d="M6 0 1 9h3.5L3 16l6-9.5H5.5L7.5 0Z" />
  </svg>
)

/** The whole sky lighting up, softly. */
export const Flash = () => (
  <div className="absolute inset-0 bg-grove-flash/50 opacity-0 animate-flash" />
)

type RainFallProps = { rain: Rain }

/** Drops falling across the whole card, each at its own place and pace. */
export const RainFall = ({ rain }: RainFallProps) => {
  // VARS
  const { count, seconds, drop } = RAIN[rain]

  return (
    <div className="absolute inset-0">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={`absolute top-0 w-px rounded-full ${drop} animate-fall`}
          style={{
            left: `${scatter(index, ACROSS) * 100}%`,
            ...timing(seconds * (0.8 + 0.4 * scatter(index, PACE)), scatter(index, PHASE)),
          }}
        />
      ))}
    </div>
  )
}

/** Snowflakes drifting down, swaying a little from side to side. */
export const SnowFall = () => (
  <div className="absolute inset-0">
    {Array.from({ length: 22 }, (_, index) => (
      // Two motions, two elements: the outer one falls, the inner one sways.
      <span
        key={index}
        className="absolute top-0 animate-snowfall"
        style={{
          left: `${scatter(index, ACROSS) * 100}%`,
          ...timing(7 * (0.8 + 0.4 * scatter(index, PACE)), scatter(index, PHASE)),
        }}
      >
        <span
          className={`block rounded-full bg-grove-snow animate-sway ${index % 3 ? 'size-1' : 'size-1.5'}`}
          style={timing(2.5, scatter(index, PACE))}
        />
      </span>
    ))}
  </div>
)

/** Fog: a pale veil, and long wisps of mist crossing slowly, like the clouds. */
export const Mist = () => (
  <>
    <div className="absolute inset-0 bg-grove-cloud/20" />
    {MIST_WISPS.map((wisp, index) => (
      <div
        key={index}
        className="absolute left-0 rounded-full bg-grove-cloud blur-[6px] animate-cross"
        style={{
          top: wisp.top,
          height: wisp.height,
          width: wisp.width,
          opacity: wisp.opacity,
          ...timing(wisp.seconds, wisp.start),
        }}
      />
    ))}
  </>
)

type StarsProps = { opacity: number }

/** Stars in the upper sky, each twinkling at its own pace; a few are bigger. */
export const Stars = ({ opacity }: StarsProps) => (
  <div className="absolute inset-0" style={{ opacity }}>
    {Array.from({ length: 16 }, (_, index) => (
      <span
        key={index}
        className={`absolute rounded-full bg-grove-moon animate-twinkle ${index % 4 ? 'size-0.5' : 'size-0.75'}`}
        style={{
          left: `${scatter(index, ACROSS) * 100}%`,
          top: 6 + scatter(index, PACE) * 56,
          ...timing(2 + 2 * scatter(index, PHASE), scatter(index, PHASE)),
        }}
      />
    ))}
  </div>
)

/** A looping animation of `seconds`, as if it had started earlier: at `start` (0 to 1) of its way. */
const timing = (seconds: number, start: number): CSSProperties => ({
  animationDuration: `${seconds}s`,
  animationDelay: `${-start * seconds}s`,
})

/**
 * A value in [0, 1) that looks random but is the same on every render: multiples of an
 * irrational number, modulo 1, spread out evenly without ever lining up.
 */
const scatter = (index: number, irrational: number) => ((index + 1) * irrational) % 1
