import { parseDate } from '@internationalized/date'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { MethodInfo } from '@/components/MethodInfo'
import { Card } from '@/components/ui/Card'
import { Link } from '@/components/ui/Link'
import { Meter } from '@/components/ui/Meter'
import { currentMilestone, useMilestones, useNorthStar } from '@/data/direction'
import { useTimeZone } from '@/data/profile'
import type { Milestone } from '@/db/types'
import { useTimeAlignedThisWeek } from '@/features/direction/useTimeAligned'
import { formatDay } from '@/lib/format'

/** The North Star, how aligned this week was, and the path of milestones: "you are here". */
export function NorthStarBar() {
  const { t } = useTranslation()
  const northStar = useNorthStar()
  const milestones = useMilestones() ?? []
  const aligned = useTimeAlignedThisWeek()

  if (!northStar) return null
  const percent = aligned === null || aligned === undefined ? null : Math.round(aligned * 100)

  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-xs font-semibold tracking-wider text-grove-moss uppercase">
              {t('northStar.label')}
            </p>
            <MethodInfo method="hoshinKanri" />
          </div>
          <p className="font-serif text-2xl leading-snug text-grove-ink">{northStar.title}</p>
        </div>
        <div className="flex items-center gap-4 lg:w-72">
          <p className="font-serif text-4xl text-grove-moss tabular-nums">
            {percent === null ? '–' : `${percent}%`}
          </p>
          <div className="flex-1 space-y-1.5">
            <Meter label={t('northStar.timeAligned')} value={percent ?? 0} hideText />
            <p className="text-sm text-grove-muted">
              {percent === null ? t('northStar.timeAlignedNone') : t('northStar.timeAligned')}
            </p>
          </div>
        </div>
      </div>
      <MilestonePath milestones={milestones} />
    </Card>
  )
}

function MilestonePath({ milestones }: { milestones: Milestone[] }) {
  const { t, i18n } = useTranslation()
  const timeZone = useTimeZone()
  const here = currentMilestone(milestones)

  if (milestones.length === 0) {
    return (
      <p className="text-sm text-grove-muted">
        {t('northStar.noMilestones')} <Link href="/direction">{t('northStar.addMilestones')}</Link>
      </p>
    )
  }
  return (
    <ol className="flex gap-2 overflow-x-auto pb-1">
      {milestones.map((milestone) => {
        const isReached = milestone.completed_at !== null
        const isHere = milestone.id === here?.id
        let note = t('northStar.ahead')
        if (isReached) note = t('northStar.reached')
        else if (isHere) note = t('northStar.youAreHere')
        else if (milestone.target_date)
          note = formatDay(parseDate(milestone.target_date), i18n.language, timeZone, true)
        return (
          <li
            key={milestone.id}
            aria-current={isHere ? 'step' : undefined}
            className={twMerge(
              'flex min-w-40 flex-1 items-start gap-2.5 rounded-control px-3 py-2.5',
              isHere ? 'bg-grove-moss-soft' : 'bg-grove-field/60',
            )}
          >
            <span
              aria-hidden
              className={twMerge(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                isReached && 'border-grove-moss bg-grove-moss text-white',
                isHere && 'border-grove-moss bg-grove-card',
                !isReached && !isHere && 'border-grove-line',
              )}
            >
              {isReached && <Check className="size-3" strokeWidth={3} />}
              {isHere && (
                <span className="size-2 rounded-full bg-grove-moss motion-safe:animate-breathe" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-grove-ink">
                {milestone.title}
              </span>
              <span
                className={twMerge(
                  'text-xs',
                  isHere ? 'font-semibold text-grove-moss' : 'text-grove-muted',
                )}
              >
                {note}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
