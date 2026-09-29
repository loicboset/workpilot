import { Meter } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import type { TimeAlignedWeeks } from '@/features/direction/useTimeAligned'

type TimeAlignedRingProps = { weeks: TimeAlignedWeeks | undefined }

const RADIUS = 28
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Rounded percentages; `null` for a week with nothing done. */
const toPercent = (share: number | null | undefined) =>
  share === null || share === undefined ? null : Math.round(share * 100)

/** "Time aligned this week" as a ring, and how it compares with last week. */
export const TimeAlignedRing = ({ weeks }: TimeAlignedRingProps) => {
  // HOOKS
  const { t } = useTranslation()

  // VARS
  const percent = toPercent(weeks?.thisWeek)
  const previous = toPercent(weeks?.lastWeek)
  let comparison = t('northStar.firstWeek')
  if (percent === null) comparison = t('northStar.timeAlignedNone')
  else if (previous !== null && percent > previous)
    comparison = t('northStar.up', { percent: previous })
  else if (previous !== null && percent < previous)
    comparison = t('northStar.down', { percent: previous })
  else if (previous !== null) comparison = t('northStar.same')

  return (
    <div className="flex h-24 shrink-0 items-center gap-4 rounded-[22px] bg-grove-field px-4 lg:w-75">
      <Meter
        value={percent ?? 0}
        aria-label={t('northStar.timeAligned')}
        className="relative size-17 shrink-0"
      >
        {({ percentage }) => (
          <>
            <svg viewBox="0 0 68 68" aria-hidden className="size-17 -rotate-90">
              <circle
                cx="34"
                cy="34"
                r={RADIUS}
                strokeWidth={8}
                className="fill-none stroke-grove-leaf-soft"
              />
              {percentage > 0 && (
                <circle
                  cx="34"
                  cy="34"
                  r={RADIUS}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - percentage / 100)}
                  className="fill-none stroke-grove-leaf transition-[stroke-dashoffset] duration-700"
                />
              )}
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-grove-ink">
              {percent === null ? '–' : `${percent}%`}
            </span>
          </>
        )}
      </Meter>
      <div className="min-w-0">
        <p className="text-sm leading-4.5 font-bold text-grove-ink">{t('northStar.timeAligned')}</p>
        <p className="text-[13px] leading-4.5 text-grove-muted">{comparison}</p>
      </div>
    </div>
  )
}
