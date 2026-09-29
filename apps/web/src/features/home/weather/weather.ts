/**
 * Current weather for the profile's city, from Open-Meteo (free, no key, CC BY 4.0).
 * Called from the browser: only the city name and its coordinates leave the device.
 */
import { useQuery } from '@tanstack/react-query'
import type { SunTimes } from './daylight'

export const SKIES = [
  'clear',
  'partlyCloudy',
  'cloudy',
  'fog',
  'drizzle',
  'rain',
  'snow',
  'storm',
] as const
export type Sky = (typeof SKIES)[number]

export type Weather = {
  place: string
  temperature: number
  sky: Sky
  /** Today's and tomorrow's, so that the widget follows the sun by itself until the next fetch. */
  sunTimes: SunTimes[]
}

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

/** The last weather this device got, for the next load. */
const STORAGE_KEY = 'workpilot:weather'
/** Older, its sky may be too far from the real one, and its sunrise and sunset from today's. */
const REMEMBERED_FOR = 3 * 3_600_000

type Remembered = { city: string; language: string; at: number; weather: Weather | null }

export const useWeather = (city: string | null | undefined, language: string) =>
  useQuery({
    queryKey: ['weather', city, language],
    queryFn: async () => {
      if (!city) return null
      const weather = await fetchWeather(city, language)
      remember({ city, language, at: Date.now(), weather })
      return weather
    },
    // After a refresh, the last weather at once (asked again once it is stale), rather than a
    // made-up sky until the answer comes: its moon, say, gone the moment the clouds arrive.
    initialData: () => recall(city, language)?.weather,
    initialDataUpdatedAt: () => recall(city, language)?.at,
    enabled: Boolean(city),
    staleTime: 30 * 60_000, // the sky doesn't change that fast
    retry: false,
  })

const remember = (remembered: Remembered) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remembered))
  } catch {
    // Storage blocked (e.g. private browsing): the next load waits for the weather.
  }
}

/** The weather remembered for this city and language, unless it is too old. */
const recall = (city: string | null | undefined, language: string): Remembered | undefined => {
  try {
    const remembered: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return isRemembered(remembered) &&
      remembered.city === city &&
      remembered.language === language &&
      Date.now() - remembered.at < REMEMBERED_FOR
      ? remembered
      : undefined
  } catch {
    return undefined // storage blocked, or not JSON
  }
}

/** Written by `remember`, maybe by an older version of it: the fields the card reads are checked. */
const isRemembered = (value: unknown): value is Remembered =>
  typeof value === 'object' &&
  value !== null &&
  'city' in value &&
  typeof value.city === 'string' &&
  'language' in value &&
  typeof value.language === 'string' &&
  'at' in value &&
  typeof value.at === 'number' &&
  'weather' in value &&
  (value.weather === null || isWeather(value.weather))

const isWeather = (value: unknown): value is Weather =>
  typeof value === 'object' &&
  value !== null &&
  'place' in value &&
  typeof value.place === 'string' &&
  'temperature' in value &&
  typeof value.temperature === 'number' &&
  'sky' in value &&
  SKIES.some((sky) => sky === value.sky) &&
  'sunTimes' in value &&
  Array.isArray(value.sunTimes) &&
  value.sunTimes.every(
    (day: unknown) =>
      typeof day === 'object' &&
      day !== null &&
      'rise' in day &&
      typeof day.rise === 'number' &&
      'set' in day &&
      typeof day.set === 'number',
  )

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
