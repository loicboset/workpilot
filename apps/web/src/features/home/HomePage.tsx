import { useEffect } from 'react'
import { refreshTicker } from '@/data/ticker'
import { useProfile, useTimeZone } from '@/data/profile'
import { Ticker } from '@/features/ticker/Ticker'
import { CaptureCard } from './cards/CaptureCard'
import { DirectionCard } from './cards/DirectionCard'
import { IdeasCard } from './cards/IdeasCard'
import { TodayCard } from './cards/TodayCard'
import { Greeting } from './Greeting'
import { NorthStarBar } from './NorthStarBar'
import { WeatherClock } from './WeatherClock'

/** The Grove homepage: calm header, the North Star, then the cards of the day. */
export function HomePage() {
  const profile = useProfile()
  const timeZone = useTimeZone()

  // Fresh AI messages when the app opens (the server only asks the AI every few hours).
  useEffect(() => void refreshTicker(), [])

  return (
    <div className="space-y-6">
      <header className="grid items-center gap-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-8">
        <Greeting firstName={profile?.first_name ?? ''} timeZone={timeZone} />
        <div className="rounded-card bg-grove-card/70 px-5 py-3">
          <Ticker />
        </div>
        <WeatherClock city={profile?.city ?? null} timeZone={timeZone} />
      </header>

      <NorthStarBar />

      <div className="grid items-start gap-6 md:grid-cols-2">
        <CaptureCard />
        <TodayCard />
        <DirectionCard />
        <IdeasCard />
      </div>
    </div>
  )
}
