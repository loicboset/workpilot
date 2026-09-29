import { DateFormatter, Time } from '@internationalized/date'
import { RotateCcw } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@/components/ui/Link'
import { RECENT_DAYS, useRecentNotes } from '@/data/notes'
import { useTimeZone } from '@/data/profile'
import type { Note } from '@/db/types'
import { dayOf } from '@/lib/dates'
import { formatClock, formatDay, formatTimeOfDay } from '@/lib/format'
import { WEEKLY_REVIEW } from '../demoData'
import { HomeCard } from '../HomeCard'

/** The weekly review: the notes of the last 7 days, to look back on (the schedule is v0.2). */
export const ReviewCard = () => {
  // HOOKS
  const { t, i18n } = useTranslation()
  const timeZone = useTimeZone()
  const notes = useRecentNotes(timeZone)
  const labelId = useId()

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
      title={t('review.title')}
      href="/review"
      aside={when}
      icon={<RotateCcw />}
      tone="rose"
      bodyClassName="flex flex-col"
      footer={
        <Link href="/review" className="text-[15px] leading-5 font-semibold">
          {t('home.review.open')}
          <span aria-hidden> →</span>
        </Link>
      }
    >
      {/* Phone: the list scrolls past a few notes. Wider: it fills the card, however tall. */}
      <p id={labelId} className="text-[15px] leading-4.5 text-grove-ink">
        {t('review.notes', { days: RECENT_DAYS })}
      </p>
      {notes?.length === 0 && (
        <p className="mt-2.5 text-sm text-grove-muted">
          {t('review.empty', { days: RECENT_DAYS })}
        </p>
      )}
      {notes && notes.length > 0 && (
        <div className="relative mt-2 md:min-h-0 md:flex-1">
          <ul
            aria-labelledby={labelId}
            tabIndex={0}
            className="max-h-72 divide-y divide-grove-line overflow-y-auto rounded-sm outline-offset-2 outline-grove-moss focus-visible:outline-2 md:absolute md:inset-0 md:max-h-none"
          >
            {notes.map((note) => (
              <RecentNoteRow key={note.id} note={note} locale={locale} timeZone={timeZone} />
            ))}
          </ul>
        </div>
      )}
    </HomeCard>
  )
}

type RecentNoteRowProps = { note: Note; locale: string; timeZone: string }

/** A note after the day and the time it was written. */
const RecentNoteRow = ({ note, locale, timeZone }: RecentNoteRowProps) => (
  <li className="flex gap-3 py-2.5">
    <time
      dateTime={note.created_at}
      className="w-24 shrink-0 text-[13px] leading-5 text-grove-muted tabular-nums"
    >
      <span className="block">
        {formatDay(dayOf(note.created_at, timeZone), locale, timeZone, true)}
      </span>
      <span className="block">{formatClock(note.created_at, locale, timeZone)}</span>
    </time>
    <p className="line-clamp-3 min-w-0 flex-1 text-sm leading-5 whitespace-pre-wrap text-grove-ink">
      {note.title && <span className="font-semibold">{note.title} · </span>}
      {note.content}
    </p>
  </li>
)
