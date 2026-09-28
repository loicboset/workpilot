import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatClock } from '@/lib/format'
import { useWeather, type Sky } from './weather'

const SKY_ICONS: Record<Sky, LucideIcon> = {
  clear: Sun,
  partlyCloudy: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
}

/** The time in the user's timezone and the sky over their city, drifting gently. */
export function WeatherClock({ city, timeZone }: { city: string | null; timeZone: string }) {
  const { t, i18n } = useTranslation()
  const now = useMinuteClock()
  const weather = useWeather(city, i18n.language).data

  const Icon = weather
    ? weather.sky === 'clear' && !weather.isDay
      ? Moon
      : SKY_ICONS[weather.sky]
    : null
  return (
    <div className="flex items-center gap-4 rounded-card bg-grove-sky/60 px-5 py-3">
      {Icon && (
        <Icon className="size-9 shrink-0 motion-safe:animate-drift text-grove-moss" aria-hidden />
      )}
      <div className="leading-tight">
        <p className="font-serif text-2xl text-grove-ink tabular-nums">
          {formatClock(now, i18n.language, timeZone)}
        </p>
        {weather ? (
          <p className="text-sm text-grove-muted">
            {weather.place} · {weather.temperature}° · {t(`weather.${weather.sky}`)}
          </p>
        ) : (
          <p className="text-sm text-grove-muted">{city ?? t('weather.noCity')}</p>
        )}
      </div>
      {weather && (
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="ml-auto self-end text-[10px] text-grove-muted/80 hover:underline"
        >
          Open-Meteo
        </a>
      )}
    </div>
  )
}

/** The current time, updated at the start of every minute. */
function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer = setTimeout(
      function tick() {
        setNow(new Date())
        timer = setTimeout(tick, 60_000 - (Date.now() % 60_000))
      },
      60_000 - (Date.now() % 60_000),
    )
    return () => clearTimeout(timer)
  }, [])
  return now
}
