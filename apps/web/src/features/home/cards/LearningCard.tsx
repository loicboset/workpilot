import { ProgressBar } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { LEARNING } from '../demoData'
import { HomeCard } from '../HomeCard'
import { FutureLink } from './FutureLink'

/** An open book: two pages side by side, drawn like the lucide icons. */
const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
    <rect x="3" y="3" width="8.5" height="18" rx="2" />
    <rect x="12.5" y="3" width="8.5" height="18" rx="2" />
  </svg>
)

/** A little learning every day: the course in progress, a short read, a book (v0.4). */
export const LearningCard = () => {
  // HOOKS
  const { t } = useTranslation()

  // VARS
  const { course, lessonsDone, lessonsTotal, nextLessonMinutes, read, nightstand } = LEARNING

  return (
    <HomeCard
      title={t('home.learning.title')}
      aside={t('home.learning.subtitle')}
      icon={<BookIcon />}
      tone="sky"
      footer={
        <p className="text-sm leading-5 text-grove-muted">
          {t('home.learning.nightstand')}{' '}
          <cite className="font-serif text-grove-ink italic">{nightstand}</cite>
        </p>
      }
    >
      <ProgressBar value={lessonsDone} maxValue={lessonsTotal} aria-label={course}>
        <p className="text-base leading-4.5 font-semibold text-grove-ink">{course}</p>
        <div aria-hidden className="mt-2.5 flex gap-1.25">
          {Array.from({ length: lessonsTotal }, (_, lesson) => (
            <span
              key={lesson}
              className={twMerge(
                'h-2.5 flex-1 rounded-full bg-grove-leaf-soft',
                lesson < lessonsDone && 'bg-grove-leaf',
              )}
            />
          ))}
        </div>
        <p className="mt-1.5 text-[13px] leading-4.5 text-grove-muted">
          {t('home.learning.lessons', {
            done: lessonsDone,
            count: lessonsTotal,
            minutes: nextLessonMinutes,
          })}
        </p>
      </ProgressBar>
      <div className="mt-3.5 flex items-center gap-4 rounded-[22px] bg-grove-field px-4 py-3.25">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-4 text-grove-muted">{t('home.learning.gentleRead')}</p>
          <p className="text-[15px] leading-5 font-semibold text-grove-ink">{read.title}</p>
        </div>
        <FutureLink className="text-sm">
          {t('home.learning.readTime', { minutes: read.minutes })}
        </FutureLink>
      </div>
    </HomeCard>
  )
}
