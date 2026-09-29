import { today } from '@internationalized/date'
import { Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTimeZone } from '@/data/profile'
import { SEASON_FOCUS } from '../demoData'
import { HomeCard } from '../HomeCard'
import { seasonOf } from '../season'

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v']

/** This season's focus: the few directions the days should lean towards (placeholder data). */
export const DirectionCard = () => {
  // HOOKS
  const { t } = useTranslation()
  const timeZone = useTimeZone()

  return (
    <HomeCard
      title={t('nav.direction')}
      href="/direction"
      aside={t(`home.direction.seasons.${seasonOf(today(timeZone), timeZone)}`)}
      icon={<Compass />}
      tone="sky"
    >
      <ol className="space-y-2.5">
        {SEASON_FOCUS.slice(0, ROMAN.length).map((focus, index) => (
          <li
            key={focus.title}
            className="flex min-h-14.5 items-center gap-3.5 rounded-control bg-grove-field px-4 py-2.5"
          >
            <span aria-hidden className="font-serif text-xl leading-none text-grove-fern">
              {ROMAN[index]}.
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] leading-5 font-semibold text-grove-ink">
                {focus.title}
              </span>
              <span className="block text-[13px] leading-4 text-grove-muted">{focus.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </HomeCard>
  )
}
