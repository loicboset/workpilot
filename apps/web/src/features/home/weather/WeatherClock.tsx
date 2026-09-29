import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatClock } from '@/lib/format'
import { skyLight } from './daylight'
import { useWeather } from './weather'
import { WeatherScene } from './WeatherScene'

type WeatherClockProps = { city: string | null; timeZone: string }

/**
 * The time in the user's timezone and the sky over their city, as a little landscape that
 * follows the sun and the moon, minute by minute.
 */
export const WeatherClock = ({ city, timeZone }: WeatherClockProps) => {
  // HOOKS
  const { t, i18n } = useTranslation()
  const now = useMinuteClock()

  // RQ
  // After the hooks: it asks in the user's language.
  const weather = useWeather(city, i18n.language).data

  // VARS
  // The city's sunrise and sunset once known; until then (or with no city), a guess.
  const light = skyLight(now, weather?.sunTimes ?? [], timeZone)

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
          {formatClock(now, i18n.language, timeZone)}
        </p>
        <p className="mt-0.5 text-[13px] leading-4 text-grove-ink-soft">
          {weather ? weather.place : (city ?? t('weather.noCity'))}
        </p>
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

/** The current time, updated at the start of every minute. */
const useMinuteClock = (): Date => {
  // STATES
  const [now, setNow] = useState(() => new Date())

  // EFFECTS
  useEffect(() => {
    const tick = () => {
      setNow(new Date())
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    }
    let timer = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    return () => clearTimeout(timer)
  }, [])

  return now
}
