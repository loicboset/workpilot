import { Leaf, Pause, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/ui/IconButton'
import { useTickerMessages } from '@/data/ticker'
import type { TickerMessage } from '@/db/types'

type Line = Pick<TickerMessage, 'kind' | 'text'>

const SECONDS_PER_MESSAGE = 8

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
 * The AI ticker (ADR 0016): insights, tips, guidance, nudges and quotes, one at a time.
 * Before the AI has written any (or without an AI), it shows a few built-in tips.
 * It pauses while hovered or focused, and has a pause button (WCAG 2.2.2) that stays out of
 * sight until the ticker is hovered or reached with the keyboard (always shown on touch).
 */
export const Ticker = () => {
  // STATES
  const [index, setIndex] = useState(0)
  const [isPaused, setPaused] = useState(false)
  const [isHeld, setHeld] = useState(false) // hovered or focused

  // HOOKS
  const { t } = useTranslation()
  const aiMessages = useTickerMessages()

  // EFFECTS
  useEffect(() => {
    if (isPaused || isHeld) return
    const timer = setInterval(() => setIndex((i) => i + 1), SECONDS_PER_MESSAGE * 1000)
    return () => clearInterval(timer)
  }, [isPaused, isHeld])

  // VARS
  const tips: unknown = t('ticker.tips', { returnObjects: true })
  const lines = aiMessages?.length ? aiMessages : isLines(tips) ? tips : []
  const line = lines[index % lines.length]

  if (!line) return null

  return (
    <div
      className="group flex min-w-0 items-center gap-4"
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
        className="-my-2 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
      >
        {isPaused ? <Play /> : <Pause />}
      </IconButton>
    </div>
  )
}
