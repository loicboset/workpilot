/**
 * Current weather for the profile's city, from Open-Meteo (free, no key, CC BY 4.0).
 * Called from the browser: only the city name and its coordinates leave the device.
 */
import { useQuery } from '@tanstack/react-query'
import type { SunTimes } from './daylight'

export type Sky =
  'clear' | 'partlyCloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'

export type Weather = {
  place: string
  temperature: number
  sky: Sky
  /** Today's and tomorrow's, so that the widget follows the sun by itself until the next fetch. */
  sunTimes: SunTimes[]
}

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

export const useWeather = (city: string | null | undefined, language: string) =>
  useQuery({
    queryKey: ['weather', city, language],
    queryFn: () => (city ? fetchWeather(city, language) : null),
    enabled: Boolean(city),
    staleTime: 30 * 60_000, // the sky doesn't change that fast
    retry: false,
  })

const fetchWeather = async (city: string, language: string): Promise<Weather | null> => {
  const places = await getJson<{
    results?: { name: string; latitude: number; longitude: number }[]
  }>(`${GEOCODING_URL}?${new URLSearchParams({ name: city, count: '1', language })}`)
  const place = places.results?.[0]
  if (!place) return null

  const forecast = await getJson<{
    current: { temperature_2m: number; weather_code: number }
    daily: SunDays
  }>(
    `${FORECAST_URL}?${new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: 'temperature_2m,weather_code',
      daily: 'sunrise,sunset',
      forecast_days: '2',
      timeformat: 'unixtime', // seconds since the epoch, whatever the city's timezone
      timezone: 'auto', // the city's days, from its midnight to the next
    })}`,
  )
  return {
    place: place.name,
    temperature: Math.round(forecast.current.temperature_2m),
    sky: skyFor(forecast.current.weather_code),
    sunTimes: sunTimesOf(forecast.daily),
  }
}

type SunDays = { sunrise: (number | null)[]; sunset: (number | null)[] }

/** The days that have a sunrise and a sunset (not the polar night or day), in ms. */
const sunTimesOf = ({ sunrise, sunset }: SunDays): SunTimes[] =>
  sunrise.flatMap((rise, index) => {
    const set = sunset[index]
    return typeof rise === 'number' && typeof set === 'number' && set > rise
      ? [{ rise: rise * 1000, set: set * 1000 }]
      : []
  })

/** WMO weather codes, grouped into the few skies the widget draws. */
export const skyFor = (code: number): Sky => {
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

/** Open-Meteo's answer, trusted to have the shape its documentation gives (not checked). */
const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} answered ${response.status}`)
  return response.json()
}
