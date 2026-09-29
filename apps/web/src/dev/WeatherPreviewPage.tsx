/**
 * The weather card at any time of the day, to see the sun and the moon cross it without waiting
 * for them (`pnpm dev`, /dev/weather). Development only: not part of the built app, so its text
 * is not translated.
 */
import { useEffect, useState } from 'react'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { ListBoxItem } from '@/components/ui/ListBoxItem'
import { Select } from '@/components/ui/Select'
import { skyLight } from '@/features/home/weather/daylight'
import { SKIES } from '@/features/home/weather/weather'
import type { Sky } from '@/features/home/weather/weather'
import { WeatherCard } from '@/features/home/weather/WeatherCard'

/** Minutes since midnight, from "HH:MM". */
const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** "HH:MM", from minutes since midnight. */
const clockOf = (minutes: number) =>
  [Math.floor(minutes / 60) % 24, minutes % 60].map((n) => String(n).padStart(2, '0')).join(':')

// Lyon on 29 September 2026, and the same times the day before and the day after: sunrise
// 07:36 and sunset 19:24 (Paris time), so moonrise 20:24 and moonset 06:36.
const MIDNIGHT = Date.parse('2026-09-29T00:00:00+02:00')
const DAY = 86_400_000
const SUN_TIMES = [-1, 0, 1].map((day) => ({
  rise: MIDNIGHT + day * DAY + minutesOf('07:36') * 60_000,
  set: MIDNIGHT + day * DAY + minutesOf('19:24') * 60_000,
}))

type Moment = { time: string; note?: string; sky?: Sky; phase?: number }

/** Through the day and the night, a clear sky and a full moon unless said otherwise. */
const MOMENTS: Moment[] = [
  { time: '06:30', note: 'The moon sets' },
  { time: '07:36', note: 'Sunrise' },
  { time: '07:50' },
  { time: '08:05' },
  { time: '08:20' },
  { time: '08:51', note: 'The sun is above the card' },
  { time: '10:30' },
  { time: '13:30', note: 'Halfway through the day' },
  { time: '16:30' },
  { time: '18:09', note: 'The sun comes down' },
  { time: '18:40' },
  { time: '19:15' },
  { time: '19:24', note: 'Sunset' },
  { time: '19:50', note: 'Dusk: neither sun nor moon' },
  { time: '20:24', note: 'Moonrise' },
  { time: '20:35' },
  { time: '20:50', note: 'The moon behind the time' },
  { time: '21:10' },
  { time: '01:30', note: 'Halfway through the night' },
  { time: '06:00' },
  { time: '07:55', sky: 'cloudy', note: 'Cloudy: only the light' },
  { time: '11:00', sky: 'cloudy' },
  { time: '15:00', sky: 'rain' },
  { time: '23:00', sky: 'cloudy' },
  { time: '20:40', phase: 0.12, note: 'Waxing crescent' },
  { time: '20:40', phase: 0.25, note: 'First quarter' },
  { time: '06:20', phase: 0.75, note: 'Last quarter' },
  { time: '06:20', phase: 0.88, note: 'Waning crescent' },
]

export const WeatherPreviewPage = () => {
  // STATES
  const [minutes, setMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })
  const [sky, setSky] = useState<Sky>('clear')
  const [phase, setPhase] = useState(0.5)
  const [isPlaying, setPlaying] = useState(false)

  // EFFECTS
  // The whole day in a minute and a half: 4 minutes every tenth of a second.
  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => setMinutes((current) => (current + 4) % 1440), 100)
    return () => clearInterval(timer)
  }, [isPlaying])

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-8">
      <header className="flex items-center justify-between">
        <Logo />
        <p className="text-sm text-grove-muted">The weather card · features/home/weather</p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end gap-6 text-sm text-grove-ink">
          <label className="flex flex-col gap-1.5">
            Time: {clockOf(minutes)}
            <input
              type="range"
              min={0}
              max={1439}
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
              className="w-72 accent-grove-moss"
            />
          </label>
          <Button variant="secondary" onPress={() => setPlaying(!isPlaying)}>
            {isPlaying ? 'Pause' : 'Play the day'}
          </Button>
          <Select
            label="Sky"
            selectedKey={sky}
            onSelectionChange={(key) => setSky(SKIES.find((each) => each === key) ?? 'clear')}
            className="w-44"
          >
            {SKIES.map((each) => (
              <ListBoxItem key={each} id={each}>
                {each}
              </ListBoxItem>
            ))}
          </Select>
          <label className="flex flex-col gap-1.5">
            Moon phase: {phase.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={phase}
              onChange={(event) => setPhase(Number(event.target.value))}
              className="w-48 accent-grove-moss"
            />
          </label>
        </div>
        {/* As wide as on a computer, and as on a phone. */}
        <div className="flex flex-wrap gap-6">
          <div className="w-75">
            <PreviewCard minutes={minutes} sky={sky} phase={phase} />
          </div>
          <div className="w-95">
            <PreviewCard minutes={minutes} sky={sky} phase={phase} note="Lyon, on a phone" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm text-grove-muted">
          Sunrise 07:36 · sunset 19:24 · moonrise 20:24 · moonset 06:36
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,300px)] gap-4">
          {MOMENTS.map((moment, index) => (
            <PreviewCard
              key={index}
              minutes={minutesOf(moment.time)}
              sky={moment.sky ?? 'clear'}
              phase={moment.phase ?? 0.5}
              note={moment.note}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

type PreviewCardProps = {
  minutes: number
  sky: Sky
  phase: number
  /** In place of the city's name. */
  note?: string
}

/** The card in Lyon at `minutes` past midnight, under `sky`, with the moon in `phase`. */
const PreviewCard = ({ minutes, sky, phase, note = 'Lyon' }: PreviewCardProps) => (
  <WeatherCard
    time={clockOf(minutes)}
    place={note}
    light={{
      ...skyLight(new Date(MIDNIGHT + minutes * 60_000), SUN_TIMES, 'Europe/Paris'),
      moonPhase: phase,
    }}
    weather={{ temperature: 14, sky }}
  />
)
