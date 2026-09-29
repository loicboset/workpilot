import { Star } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { MethodInfo } from '@/components/MethodInfo'
import { useMilestones, useNorthStar } from '@/data/direction'
import { useTimeAlignedWeeks } from '@/features/direction/useTimeAligned'
import { MilestonePath } from './MilestonePath'
import { TimeAlignedRing } from './TimeAlignedRing'

/** The North Star, how aligned this week was, and the path of milestones: "you are here". */
export const NorthStarBar = () => {
  // HOOKS
  const { t } = useTranslation()
  const northStar = useNorthStar()
  const milestones = useMilestones() ?? []
  const weeks = useTimeAlignedWeeks()
  const labelId = useId()

  if (!northStar) return null

  return (
    <section
      aria-labelledby={labelId}
      className="rounded-4xl bg-grove-card px-8 pt-7 pb-7 shadow-grove"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          <div className="group mt-0.5 flex items-center gap-2">
            <Star className="size-4 shrink-0 text-grove-fern" aria-hidden />
            <h2
              id={labelId}
              className="text-[13px] leading-4 font-semibold tracking-widest text-grove-fern uppercase"
            >
              {t('northStar.label')}
            </h2>
            {/* Out of sight until hovered or focused, like the concept; always there on touch. */}
            <span className="-my-2.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
              <MethodInfo method="hoshinKanri" />
            </span>
          </div>
          <p className="mt-2 font-serif text-[26px] leading-8.5 text-grove-ink">
            {northStar.title}
          </p>
        </div>
        <TimeAlignedRing weeks={weeks} />
      </div>
      <MilestonePath milestones={milestones} />
    </section>
  )
}
