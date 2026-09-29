import { useEffect } from 'react'
import { refreshTicker } from '@/data/ticker'
import { useProfile, useTimeZone } from '@/data/profile'
import { Ticker } from '@/features/ticker/Ticker'
import { CaptureCard } from './cards/CaptureCard'
import { DirectionCard } from './cards/DirectionCard'
import { LearningCard } from './cards/LearningCard'
import { OpportunitiesCard } from './cards/OpportunitiesCard'
import { ReviewCard } from './cards/ReviewCard'
import { TodayCard } from './cards/TodayCard'
import { Greeting } from './Greeting'
import { NorthStarBar } from './NorthStarBar'
import { WeatherClock } from './weather/WeatherClock'

/** The Grove homepage: calm header, the North Star, then the cards of the day. */
export const HomePage = () => {
  // HOOKS
  const profile = useProfile()
  const timeZone = useTimeZone()

  // EFFECTS
  // Fresh AI messages when the app opens (the server only asks the AI every few hours).
  useEffect(() => void refreshTicker(), [])

  return (
    <div className="space-y-6">
      {/* Phone: one column. Tablet: the tip under greeting and weather. Wide: all three in a row. */}
      <header className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[320px_minmax(0,1fr)_300px] xl:gap-7">
        <Greeting firstName={profile?.first_name ?? ''} timeZone={timeZone} />
        <div className="flex min-h-15 items-center rounded-[30px] bg-grove-card py-2.5 pr-6 pl-6.5 shadow-grove md:col-span-2 md:row-start-2 xl:col-span-1 xl:row-start-auto">
          <Ticker />
        </div>
        <WeatherClock city={profile?.city ?? null} timeZone={timeZone} />
      </header>

      <NorthStarBar />

      <div className="grid gap-5.5 md:auto-rows-[minmax(351px,auto)] md:grid-cols-2">
        <CaptureCard />
        <TodayCard />
        <DirectionCard />
        <ReviewCard />
        <OpportunitiesCard />
        <LearningCard />
      </div>
    </div>
  )
}
