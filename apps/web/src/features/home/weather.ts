/**
 * Current weather for the profile's city, from Open-Meteo (free, no key, CC BY 4.0).
 * Called from the browser: only the city name and its coordinates leave the device.
 */
import { useQuery } from '@tanstack/react-query'

export type Sky =
  'clear' | 'partlyCloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'

export interface Weather {
  place: string
  temperature: number
  sky: Sky
  isDay: boolean
}

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

export function useWeather(city: string | null | undefined, language: string) {
  return useQuery({
    queryKey: ['weather', city, language],
    queryFn: () => fetchWeather(city!, language),
    enabled: Boolean(city),
    staleTime: 30 * 60_000, // the sky doesn't change that fast
    retry: false,
  })
}

async function fetchWeather(city: string, language: string): Promise<Weather | null> {
  const places = await getJson<{
    results?: { name: string; latitude: number; longitude: number }[]
  }>(`${GEOCODING_URL}?${new URLSearchParams({ name: city, count: '1', language })}`)
  const place = places.results?.[0]
  if (!place) return null

  const forecast = await getJson<{
    current: { temperature_2m: number; weather_code: number; is_day: number }
  }>(
    `${FORECAST_URL}?${new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: 'temperature_2m,weather_code,is_day',
      timezone: 'auto',
    })}`,
  )
  return {
    place: place.name,
    temperature: Math.round(forecast.current.temperature_2m),
    sky: skyFor(forecast.current.weather_code),
    isDay: forecast.current.is_day === 1,
  }
}

/** WMO weather codes, grouped into the few skies the widget draws. */
export function skyFor(code: number): Sky {
  if (code === 0) return 'clear'
  if (code <= 2) return 'partlyCloudy'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'cloudy'
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} answered ${response.status}`)
  return (await response.json()) as T
}
