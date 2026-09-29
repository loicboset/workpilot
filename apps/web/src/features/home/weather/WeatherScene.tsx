import { Aloft, Light } from './Aloft'
import { ease } from './daylight'
import type { SkyLight } from './daylight'
import { Moon } from './Moon'
import type { Sky } from './weather'
import { Clouds, Flash, Mist, RainFall, SnowFall, Stars } from './SkyLayers'
import type { Cloud, Rain } from './SkyLayers'

type WeatherSceneProps = {
  /** `undefined` while the weather is unknown: a soft, partly cloudy day. */
  sky: Sky | undefined
  light: SkyLight
}

type Scene = {
  /** Clear enough to see the sun, or the moon and the stars. */
  sun?: boolean
  clouds?: readonly Cloud[]
  rain?: Rain
  snow?: boolean
  fog?: boolean
  /** Grey clouds in a stronger wind, and lightning. */
  storm?: boolean
}

/** A fine day: a big cloud up high, a small one further down. */
const FEW_CLOUDS: Cloud[] = [
  { shape: 'puffy', width: 48, top: 12, seconds: 50, start: 0.45 },
  { shape: 'small', width: 38, top: 54, seconds: 70, start: 0.2 },
]

/** A grey day: clouds at every height, the small ones further away and slower. */
const MANY_CLOUDS: Cloud[] = [
  { shape: 'puffy', width: 56, top: 6, seconds: 46, start: 0.55 },
  { shape: 'small', width: 30, top: 24, seconds: 78, start: 0.3 },
  { shape: 'puffy', width: 42, top: 36, seconds: 58, start: 0.85 },
  { shape: 'small', width: 38, top: 54, seconds: 66, start: 0.1 },
]

const SCENES: Record<Sky, Scene> = {
  clear: { sun: true },
  partlyCloudy: { sun: true, clouds: FEW_CLOUDS },
  cloudy: { clouds: MANY_CLOUDS },
  fog: { fog: true },
  drizzle: { clouds: MANY_CLOUDS, rain: 'drizzle' },
  rain: { clouds: MANY_CLOUDS, rain: 'rain' },
  snow: { clouds: MANY_CLOUDS, snow: true },
  storm: { clouds: MANY_CLOUDS, rain: 'downpour', storm: true },
}

/**
 * The little landscape behind the clock: a sun (or moon and stars), clouds, rain or snow, hills.
 * The sun crosses it from sunrise to sunset, and the moon through the night, so that it shows the
 * time going by (see `Course` in daylight.ts). Its colours follow the light of the sky, set on
 * the card: see `.weather-sky` in weather.css.
 */
export const WeatherScene = ({ sky = 'partlyCloudy', light }: WeatherSceneProps) => {
  // VARS
  const scene = SCENES[sky]
  // As the sky darkens the moon comes out, then the stars.
  const moonOpacity = ease(0.3, 0.9, light.night)
  const starsOpacity = ease(0.6, 1, light.night)

  return (
    // A container, so that clouds cross its whole width (see `cross` in weather.css), and the sun
    // and the moon too. With reduced motion, every animation is paused: a still picture of the
    // same sky.
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 @container motion-reduce:**:[animation-play-state:paused]"
    >
      {scene.sun && starsOpacity > 0 && <Stars opacity={starsOpacity} />}
      {/* Behind the clouds, the sun's light still shows its way, faintly: a grey day goes by too. */}
      {light.sun.height > -1 && (
        <Aloft course={light.sun}>
          <Light className="from-grove-sun" opacity={scene.sun ? 1 : 0.6} />
          {scene.sun && (
            <svg
              viewBox="-30 -30 60 60"
              className="absolute -top-7.5 -left-7.5 size-15 fill-grove-sun"
            >
              <circle r="26" opacity="0.25" className="origin-center animate-glow transform-fill" />
              <circle r="16.5" />
            </svg>
          )}
        </Aloft>
      )}
      {light.moon.height > -1 && moonOpacity > 0 && (
        <Aloft course={light.moon}>
          <Light className="from-grove-moon" opacity={moonOpacity * (scene.sun ? 0.35 : 0.3)} />
          {scene.sun && (
            <svg viewBox="-30 -30 60 60" className="absolute -top-7.5 -left-7.5 size-15">
              <Moon phase={light.moonPhase} southern={light.southern} opacity={moonOpacity} />
            </svg>
          )}
        </Aloft>
      )}
      <svg
        viewBox="0 0 300 96"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-24 w-full fill-grove-hill"
      >
        <path d="M0 96V94C20 91 40 86 70 85C100 84.5 130 90 165 92.2C190 93.5 205 91 225 87.5C245 84 262 79 282 78.5C290 78.3 296 79 300 80V96Z" />
      </svg>
      {/* Rain and snow fall in front of the hills and come out from behind the clouds. */}
      {scene.rain && <RainFall rain={scene.rain} />}
      {scene.snow && <SnowFall />}
      {/* Behind the clouds: they stand dark against the flash, and so does the bolt. */}
      {scene.storm && <Flash />}
      {scene.clouds && <Clouds clouds={scene.clouds} stormy={scene.storm} />}
      {scene.fog && <Mist />}
    </div>
  )
}
