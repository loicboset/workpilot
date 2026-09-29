import { Leaf, Pause, Play } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { IconButton } from '@/components/ui/IconButton'
import { useTickerMessages } from '@/data/ticker'
import type { TickerMessage } from '@/db/types'

type Line = Pick<TickerMessage, 'kind' | 'text'>

type TickerProps = {
  /** Where the bar sits in the page's grid. */
  className?: string
}

const SECONDS_PER_MESSAGE = 15

const KINDS: Line['kind'][] = ['insight', 'tip', 'guidance', 'nudge', 'quote']

/** The built-in tips come from the translations, as a list of `{ kind, text }`. */
const isLines = (value: unknown): value is Line[] =>
  Array.isArray(value) &&
  value.every(
    (line: unknown) =>
      typeof line === 'object' &&
      line !== null &&
      'text' in line &&
      typeof line.text === 'string' &&
      'kind' in line &&
      KINDS.some((kind) => kind === line.kind),
  )

/**
 * The AI ticker bar (ADR 0016): insights, tips, guidance, nudges and quotes, one at a time.
 * Before the AI has written any (or without an AI), it shows a few built-in tips.
 * A ring fills until the next one; it holds while the bar is hovered or focused. The ring is
 * also the pause button (WCAG 2.2.2), whose icon shows once the bar is hovered or reached with
 * the keyboard (always on touch).
 */
export const Ticker = ({ className }: TickerProps) => {
  // STATES
  const [index, setIndex] = useState(0)
  const [isPaused, setPaused] = useState(false)
  const [isHeld, setHeld] = useState(false) // hovered or focused

  // HOOKS
  const { t } = useTranslation()
  const aiMessages = useTickerMessages()

  // VARS
  const tips: unknown = t('ticker.tips', { returnObjects: true })
  const lines = aiMessages?.length ? aiMessages : isLines(tips) ? tips : []
  const line = lines[index % lines.length]
  const isStopped = isPaused || isHeld
  const PlayPause = isPaused ? Play : Pause

  if (!line) return null

  return (
    <div
      className={twMerge(
        'flex min-h-15 min-w-0 items-center gap-4 rounded-[30px] bg-grove-card py-2.5 pr-4 pl-6.5 shadow-grove',
        className,
      )}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <Leaf className="size-3.75 shrink-0 text-grove-fern" aria-hidden />
      <div
        key={index}
        className="flex min-w-0 flex-1 items-center gap-3 motion-safe:animate-fade-in"
      >
        <span className="shrink-0 rounded-full bg-grove-sand px-2.5 text-xs leading-5 font-bold text-grove-sand-ink">
          {t(`ticker.kinds.${line.kind}`)}
        </span>
        <p className="line-clamp-3 text-[15px] leading-5 text-grove-ink md:line-clamp-2">
          {line.text}
        </p>
      </div>
      <IconButton
        size="sm"
        aria-label={isPaused ? t('ticker.play') : t('ticker.pause')}
        onPress={() => setPaused(!isPaused)}
        className="-my-2 shrink-0"
      >
        <span className="relative flex size-5 items-center justify-center">
          <svg viewBox="0 0 20 20" className="absolute inset-0 -rotate-90">
            <circle
              cx="10"
              cy="10"
              r="8.5"
              strokeWidth="2"
              className="fill-none stroke-grove-leaf-soft"
            />
            {/* The clock: its animation ending brings the next message. */}
            <circle
              key={index}
              cx="10"
              cy="10"
              r="8.5"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              className="animate-countdown fill-none stroke-grove-leaf"
              style={{
                animationDuration: `${SECONDS_PER_MESSAGE}s`,
                animationPlayState: isStopped ? 'paused' : 'running',
              }}
              onAnimationEnd={() => setIndex((i) => i + 1)}
            />
          </svg>
          <PlayPause
            className={twMerge(
              'size-2.5 fill-current text-grove-fern transition-opacity',
              !isStopped && 'opacity-0 pointer-coarse:opacity-100',
            )}
          />
        </span>
      </IconButton>
    </div>
  )
}
