import { useTranslation } from 'react-i18next'
import { formatClock } from '@/lib/format'
import { useMinuteClock } from '@/lib/useMinuteClock'
import { skyLight } from './daylight'
import { useWeather } from './weather'
import { WeatherCard } from './WeatherCard'

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
    <WeatherCard
      time={formatClock(now, i18n.language, timeZone)}
      place={weather ? weather.place : (city ?? t('weather.noCity'))}
      light={light}
      weather={weather ?? undefined}
    />
  )
}
