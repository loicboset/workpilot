import { useTranslation } from 'react-i18next'
import type { SkyLight } from './daylight'
import type { Weather } from './weather'
import { WeatherScene } from './WeatherScene'

type WeatherCardProps = {
  /** The time, as shown. */
  time: string
  place: string
  light: SkyLight
  /** Once known. */
  weather?: Pick<Weather, 'temperature' | 'sky'>
}

/**
 * The weather card: the time, the place and the weather, over the little landscape lit by
 * `light`. `WeatherClock` gives it the real ones; /dev/weather, any.
 */
export const WeatherCard = ({ time, place, light, weather }: WeatherCardProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <div
      // The landscape's colours, and the text's, follow these: see `.weather-sky` in weather.css.
      style={{
        '--sky-night': light.night,
        '--sky-glow': light.glow,
        '--sky-dark': light.night >= 0.6 ? 1 : 0,
      }}
      className="weather-sky group relative h-24 overflow-hidden rounded-4xl bg-linear-to-b from-grove-sky-top to-grove-sky-bottom"
    >
      <WeatherScene sky={weather?.sky} light={light} />
      <div className="absolute top-5.5 left-5.5 max-w-44">
        <p className="font-serif text-[34px] leading-none font-medium text-grove-ink tabular-nums">
          {time}
        </p>
        <p className="mt-0.5 text-[13px] leading-4 text-grove-ink-soft">{place}</p>
      </div>
      {weather && (
        <div className="absolute top-6.75 right-5.5 w-16.5">
          <p className="text-right text-2xl leading-6 font-bold text-grove-ink">
            {weather.temperature}°
          </p>
          <p className="mt-0.5 text-[13px] leading-4 text-grove-ink-soft">
            {t(`weather.${weather.sky}`)}
          </p>
        </div>
      )}
      {weather && (
        // Open-Meteo's data licence (CC BY 4.0) asks for credit: shown when the card is
        // hovered or the link focused, and always on touch screens.
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="absolute right-4 bottom-1 text-[10px] text-grove-ink-soft opacity-0 transition-opacity group-hover:opacity-100 hover:underline focus-visible:opacity-100 pointer-coarse:opacity-100"
        >
          Open-Meteo
        </a>
      )}
    </div>
  )
}
