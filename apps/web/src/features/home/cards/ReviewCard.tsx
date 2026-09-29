import { DateFormatter, Time } from '@internationalized/date'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Label, Radio, RadioGroup } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { tv } from 'tailwind-variants'
import { formatTimeOfDay } from '@/lib/format'
import { focusRing } from '@/lib/styles'
import { MOODS, WEEKLY_REVIEW, type Mood } from '../demoData'
import { HomeCard } from '../HomeCard'
import { FutureLink } from './FutureLink'

const moodStyles = tv({
  extend: focusRing,
  base: 'flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm transition-colors',
  variants: {
    isSelected: {
      false: 'border-grove-line bg-grove-card text-grove-ink hovered:bg-grove-field',
      true: 'border-0 bg-grove-moss font-semibold text-white',
    },
  },
})

/** The weekly review: how you arrive at the end of the week, and three questions (v0.2). */
export const ReviewCard = () => {
  // STATES
  const [mood, setMood] = useState<Mood>(WEEKLY_REVIEW.mood)

  // HOOKS
  const { t, i18n } = useTranslation()

  // VARS
  const locale = i18n.language
  // 1 January 2024 was a Monday, so day n of that month has ISO weekday n.
  const weekday = new DateFormatter(locale, { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, 0, WEEKLY_REVIEW.weekday)),
  )
  const when = t('home.review.when', {
    day: weekday.charAt(0).toLocaleUpperCase(locale) + weekday.slice(1),
    time: formatTimeOfDay(new Time(WEEKLY_REVIEW.hour, WEEKLY_REVIEW.minute), locale),
    minutes: WEEKLY_REVIEW.minutes,
  })

  return (
    <HomeCard
      title={t('home.review.title')}
      aside={when}
      icon={<RotateCcw />}
      tone="rose"
      footer={<FutureLink>{t('home.review.open')}</FutureLink>}
    >
      <RadioGroup
        value={mood}
        onChange={(value) => setMood(MOODS.find((option) => option === value) ?? mood)}
        orientation="horizontal"
      >
        <Label className="block text-[15px] leading-4.5 text-grove-ink">
          {t('home.review.question')}
        </Label>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {MOODS.map((option) => (
            <Radio key={option} value={option} className={moodStyles}>
              {t(`home.review.moods.${option}`)}
            </Radio>
          ))}
        </div>
      </RadioGroup>
      <ul className="mt-2.75 text-sm leading-5.75 text-grove-ink-soft">
        {WEEKLY_REVIEW.questions.map((question) => (
          <li key={question}>
            <span aria-hidden>· </span>
            {question}
          </li>
        ))}
      </ul>
    </HomeCard>
  )
}
