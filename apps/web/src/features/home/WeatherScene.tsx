import type { Sky } from './weather'

type WeatherSceneProps = {
  /** `undefined` while the weather is unknown: a soft, partly cloudy day. */
  sky: Sky | undefined
  isDay: boolean
}

/** The little landscape behind the clock: a sun (or moon), clouds when there are some, hills. */
export const WeatherScene = ({ sky = 'partlyCloudy', isDay }: WeatherSceneProps) => {
  // VARS
  const hasSun = sky === 'clear' || sky === 'partlyCloudy'
  const hasClouds = sky !== 'clear'

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Drawn for a 300 × 96 card, kept at the right when the card is wider. */}
      <svg viewBox="0 0 300 96" className="absolute top-0 right-0 h-24 w-75">
        {hasSun && (
          <g className={isDay ? 'fill-grove-sun' : 'fill-grove-cloud'}>
            <circle cx="240" cy="30" r="26" opacity="0.25" />
            <circle cx="240" cy="29.75" r="16.5" />
          </g>
        )}
        {hasClouds && (
          <g className="fill-grove-cloud motion-safe:animate-drift">
            <circle cx="140.5" cy="29.5" r="10" />
            <circle cx="157.75" cy="24.25" r="11.75" />
            <circle cx="169" cy="30.5" r="9" />
            <rect x="140.5" y="29.5" width="28.5" height="10" />
            <circle cx="34" cy="67.5" r="7.5" />
            <circle cx="48" cy="63" r="9" />
            <circle cx="57.5" cy="68.5" r="7" />
            <rect x="33" y="67" width="26" height="8.5" rx="4" />
          </g>
        )}
      </svg>
      <svg
        viewBox="0 0 300 96"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-24 w-full fill-grove-hill"
      >
        <path d="M0 96V94C20 91 40 86 70 85C100 84.5 130 90 165 92.2C190 93.5 205 91 225 87.5C245 84 262 79 282 78.5C290 78.3 296 79 300 80V96Z" />
      </svg>
    </div>
  )
}
