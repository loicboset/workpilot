import { Pause, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/ui/IconButton'
import { useTickerMessages } from '@/data/ticker'
import type { TickerMessage } from '@/db/types'

type Line = Pick<TickerMessage, 'kind' | 'text'>

const SECONDS_PER_MESSAGE = 8

/**
 * The AI ticker (ADR 0016): insights, tips, guidance, nudges and quotes, one at a time.
 * Before the AI has written any (or without an AI), it shows a few built-in tips.
 * It pauses while hovered or focused, and has a pause button (WCAG 2.2.2).
 */
export function Ticker() {
  const { t } = useTranslation()
  const aiMessages = useTickerMessages()
  const lines: Line[] = aiMessages?.length
    ? aiMessages
    : (t('ticker.tips', { returnObjects: true }) as Line[])
  const [index, setIndex] = useState(0)
  const [isPaused, setPaused] = useState(false)
  const [isHeld, setHeld] = useState(false) // hovered or focused

  useEffect(() => {
    if (isPaused || isHeld) return
    const timer = setInterval(() => setIndex((i) => i + 1), SECONDS_PER_MESSAGE * 1000)
    return () => clearInterval(timer)
  }, [isPaused, isHeld])

  const line = lines[index % lines.length]
  if (!line) return null
  return (
    <div
      className="flex min-w-0 items-center gap-3"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <div key={index} className="min-w-0 flex-1 motion-safe:animate-fade-in">
        <p className="text-xs font-semibold tracking-wider text-grove-moss uppercase">
          {t(`ticker.kinds.${line.kind}`)}
        </p>
        <p className="line-clamp-2 text-[15px] text-grove-ink">{line.text}</p>
      </div>
      <IconButton
        size="sm"
        aria-label={isPaused ? t('ticker.play') : t('ticker.pause')}
        onPress={() => setPaused(!isPaused)}
      >
        {isPaused ? <Play /> : <Pause />}
      </IconButton>
    </div>
  )
}
