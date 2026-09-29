import { useEffect } from 'react'
import { useSpace } from '@/data/currentSpace'
import { refreshTicker } from '@/data/ticker'
import { useProfile, useTimeZone } from '@/data/profile'
import { Ticker } from '@/features/ticker/Ticker'
import { CaptureCard } from './cards/CaptureCard'
import { ConnectorsCard } from './cards/ConnectorsCard'
import { DirectionCard } from './cards/DirectionCard'
import { LearningCard } from './cards/LearningCard'
import { OpportunitiesCard } from './cards/OpportunitiesCard'
import { ReviewCard } from './cards/ReviewCard'
import { TodayCard } from './cards/TodayCard'
import { Greeting } from './Greeting'
import { NorthStarBar } from './NorthStarBar'
import { WeatherClock } from './weather/WeatherClock'

/** A space's Grove homepage: calm header, its North Star, then the cards of its day. */
export const HomePage = () => {
  // HOOKS
  const space = useSpace()
  const profile = useProfile()
  const timeZone = useTimeZone()

  // EFFECTS
  // Fresh AI messages when the space opens (the server only asks the AI every few hours).
  useEffect(() => void refreshTicker(space.id), [space.id])

  return (
    <div className="space-y-6">
      {/* Phone: one column. Tablet: the tip under greeting and weather. Wide: all three in a row. */}
      <header className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[320px_minmax(0,1fr)_300px] xl:gap-7">
        <Greeting firstName={profile?.first_name ?? ''} timeZone={timeZone} />
        <Ticker className="md:col-span-2 md:row-start-2 xl:col-span-1 xl:row-start-auto" />
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
        <ConnectorsCard />
      </div>
    </div>
  )
}
