import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useWeather } from './weather'
import type { Weather } from './weather'

// Open-Meteo's answers for Geneva, and the weather the card makes of them.
const PLACES = { results: [{ name: 'Geneva', latitude: 46.2, longitude: 6.14 }] }
const FORECAST = {
  current: { temperature_2m: 18.6, weather_code: 3 },
  daily: { sunrise: [1_790_000_000], sunset: [1_790_040_000] },
}
const GENEVA: Weather = {
  place: 'Geneva',
  temperature: 19,
  sky: 'cloudy',
  sunTimes: [{ rise: 1_790_000_000_000, set: 1_790_040_000_000 }],
}

const MINUTE = 60_000
const fetchMock = vi.fn(async (url: string) => ({
  ok: true,
  json: async () => (url.includes('geocoding') ? PLACES : FORECAST),
}))

/** The page loading afresh, as after a refresh: nothing in the query cache. */
const load = (city: string) => {
  const client = new QueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useWeather(city, 'en'), { wrapper }).result
}

const rememberGeneva = (minutesAgo: number) =>
  localStorage.setItem(
    'workpilot:weather',
    JSON.stringify({
      city: 'Geneva',
      language: 'en',
      at: Date.now() - minutesAgo * MINUTE,
      weather: GENEVA,
    }),
  )

beforeEach(() => vi.stubGlobal('fetch', fetchMock))

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockClear()
  localStorage.clear()
})

it('remembers the weather it gets, and shows it at once on the next load', async () => {
  const first = load('Geneva')
  await waitFor(() => expect(first.current.data).toEqual(GENEVA))

  const next = load('Geneva')
  expect(next.current.data).toEqual(GENEVA)
  // Still fresh: Open-Meteo is not asked again (two calls: the place, then its forecast).
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('asks again once the remembered weather is half an hour old, showing it meanwhile', async () => {
  rememberGeneva(40)
  const weather = load('Geneva')
  expect(weather.current.data).toEqual(GENEVA)
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
})

it('forgets weather over three hours old, or of another city', () => {
  rememberGeneva(4 * 60)
  expect(load('Geneva').current.data).toBeUndefined()

  rememberGeneva(10)
  expect(load('Lyon').current.data).toBeUndefined()
})

it('ignores what it does not recognise', () => {
  localStorage.setItem('workpilot:weather', '{"city":"Geneva","weather":{"sky":"sunny"}}')
  expect(load('Geneva').current.data).toBeUndefined()
  localStorage.setItem('workpilot:weather', 'not JSON')
  expect(load('Geneva').current.data).toBeUndefined()
})
