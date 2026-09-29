import { today } from '@internationalized/date'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { Link } from '@/components/ui/Link'
import { currentMilestone } from '@/data/direction'
import { useTimeZone } from '@/data/profile'
import type { Milestone } from '@/db/types'
import { useElementWidth } from '@/lib/useElementWidth'
import { wavePath, waveX, waveY } from './milestoneCurve'
import {
  milestoneState,
  milestoneWhen,
  type MilestoneState,
  type MilestoneWhen,
} from './milestoneNote'

type MilestonePathProps = { milestones: Milestone[] }

/** How far in from the edges the first and last milestones sit. */
const INSET = 40

/**
 * The path to the North Star: milestones on a gentle wave, walked (solid) up to "you are here",
 * dotted after it, and a star at the end.
 */
export const MilestonePath = ({ milestones }: MilestonePathProps) => {
  // HOOKS
  const { t } = useTranslation()
  const timeZone = useTimeZone()
  const [ref, width] = useElementWidth<HTMLDivElement>()

  if (milestones.length === 0) {
    return (
      <p className="mt-6 text-sm text-grove-muted">
        {t('northStar.noMilestones')} <Link href="/direction">{t('northStar.addMilestones')}</Link>
      </p>
    )
  }

  // METHODS
  const note = (state: MilestoneState, when: MilestoneWhen) => {
    if (state === 'here') return t('northStar.youAreHere')
    let period: string | null = null
    if (when && 'quarter' in when) period = t('northStar.quarter', { number: when.quarter })
    else if (when) period = String(when.year)
    if (state === 'reached')
      return period ? t('northStar.done', { when: period }) : t('northStar.reached')
    return period ?? t('northStar.ahead')
  }

  // VARS
  const here = currentMilestone(milestones)
  const last = milestones.length - 1
  const span = { from: INSET, to: width - INSET }
  const stops = milestones.map((milestone, index) => {
    const u = last === 0 ? 0 : index / last
    return { milestone, u, x: waveX(u, span), y: waveY(u), state: milestoneState(milestone, here) }
  })
  const hereU = stops.find((stop) => stop.state === 'here')?.u ?? 1
  const day = today(timeZone)
  // Labels as wide as the room between two milestones allows, so titles rarely wrap.
  const spacing = (span.to - span.from) / Math.max(last, 1)
  const labelWidth = Math.max(120, Math.min(spacing - 32, 260))

  return (
    <div className="-mx-2 mt-3 overflow-x-auto px-2 pb-1 lg:overflow-visible lg:pb-0">
      {/* The wave (see milestoneCurve), then the labels under it. */}
      <div ref={ref} className="relative h-28.5 min-w-160">
        {width > 0 && (
          <svg aria-hidden className="absolute inset-0 size-full overflow-visible">
            <path
              d={wavePath(span, 0, hereU)}
              className="fill-none stroke-grove-leaf"
              strokeWidth={4}
              strokeLinecap="round"
            />
            <path
              d={wavePath(span, hereU, 1)}
              className="fill-none stroke-grove-sage-soft"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="2.5 9.5"
            />
            {stops.map(({ milestone, x, y, state }, index) => (
              <MilestoneNode
                key={milestone.id}
                x={x}
                y={y}
                state={state}
                isDestination={index === last && last > 0}
              />
            ))}
          </svg>
        )}
        <ol>
          {stops.map(({ milestone, x, y, state }, index) => (
            <li
              key={milestone.id}
              aria-current={state === 'here' ? 'step' : undefined}
              className={twMerge(
                'absolute w-max leading-tight',
                index === 0 && 'text-left',
                index === last && last > 0 && 'text-right',
                index > 0 && index < last && '-translate-x-1/2 text-center',
              )}
              style={{
                maxWidth: labelWidth,
                top: y + 20,
                left: index === last && last > 0 ? undefined : index === 0 ? 0 : x,
                right: index === last && last > 0 ? 0 : undefined,
              }}
            >
              <span
                className={twMerge(
                  'block text-sm font-semibold text-grove-ink',
                  state === 'here' && 'font-bold text-grove-clay-ink',
                  state === 'ahead' && index !== last && 'text-grove-muted',
                )}
              >
                {milestone.title}
              </span>
              <span
                className={twMerge(
                  'block text-xs text-grove-muted',
                  state === 'here' && 'text-grove-clay-ink',
                )}
              >
                {note(state, milestoneWhen(milestone, day, timeZone))}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

type MilestoneNodeProps = { x: number; y: number; state: MilestoneState; isDestination: boolean }

/** One milestone on the wave: ticked when reached, a warm ring for "you are here". */
const MilestoneNode = ({ x, y, state, isDestination }: MilestoneNodeProps) => {
  if (isDestination) {
    return (
      <Star
        x={x - 16}
        y={y - 15.7}
        size={32}
        strokeWidth={1.5}
        className="fill-grove-sun stroke-grove-sun-ink"
      />
    )
  }
  if (state === 'reached') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={10} className="fill-grove-leaf" />
        <path
          d="M-5.75 -0.25L-1.7 3.55L5.2 -3.65"
          className="fill-none stroke-white"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    )
  }
  if (state === 'here') {
    return (
      <circle
        cx={x}
        cy={y}
        r={11}
        strokeWidth={3.5}
        className="fill-grove-card stroke-grove-clay"
      />
    )
  }
  return (
    <circle cx={x} cy={y} r={9.5} strokeWidth={2.5} className="fill-grove-card stroke-grove-sage" />
  )
}
