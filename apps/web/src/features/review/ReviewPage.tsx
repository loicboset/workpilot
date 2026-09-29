import type { CalendarDate } from '@internationalized/date'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '@/components/PageTitle'
import { Card } from '@/components/ui/Card'
import { Link } from '@/components/ui/Link'
import { Spinner } from '@/components/ui/Spinner'
import { RECENT_DAYS, useRecentNotes } from '@/data/notes'
import { useTimeZone } from '@/data/profile'
import type { Note } from '@/db/types'
import { dayOf } from '@/lib/dates'
import { formatClock, formatDay } from '@/lib/format'

type NotesOfDay = { day: CalendarDate; notes: Note[] }

/** The notes, newest first, in one group per day they were written on. */
const byDay = (notes: Note[], timeZone: string): NotesOfDay[] =>
  notes.reduce<NotesOfDay[]>((days, note) => {
    const day = dayOf(note.created_at, timeZone)
    const last = days.at(-1)
    if (last && last.day.compare(day) === 0) last.notes.push(note)
    else days.push({ day, notes: [note] })
    return days
  }, [])

/** The weekly review: the notes of the last 7 days, day by day, to look back on the week. */
export const ReviewPage = () => {
  // HOOKS
  const { t } = useTranslation()
  const timeZone = useTimeZone()
  const notes = useRecentNotes(timeZone)

  return (
    <div className="space-y-6 pt-2">
      <header>
        <PageTitle subtitle={t('review.notes', { days: RECENT_DAYS })}>
          {t('review.title')}
        </PageTitle>
      </header>

      <Card className="max-w-3xl">
        {!notes ? (
          <Spinner label={t('common.loading')} className="text-grove-moss" />
        ) : notes.length === 0 ? (
          <p className="text-sm text-grove-muted">{t('review.empty', { days: RECENT_DAYS })}</p>
        ) : (
          <div className="space-y-6">
            {byDay(notes, timeZone).map(({ day, notes: ofDay }) => (
              <DayNotes key={day.toString()} day={day} notes={ofDay} timeZone={timeZone} />
            ))}
          </div>
        )}
        <p className="mt-6">
          <Link href="/notes" className="text-sm">
            {t('review.allNotes')}
            <span aria-hidden> →</span>
          </Link>
        </p>
      </Card>
    </div>
  )
}

type DayNotesProps = { day: CalendarDate; notes: Note[]; timeZone: string }

/** A day's notes, in full, each after the time it was written. */
const DayNotes = ({ day, notes, timeZone }: DayNotesProps) => {
  // HOOKS
  const { i18n } = useTranslation()
  const headingId = useId()

  // VARS
  const locale = i18n.language

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="font-serif text-xl text-grove-ink first-letter:uppercase">
        {formatDay(day, locale, timeZone)}
      </h2>
      <ul className="mt-1 divide-y divide-grove-line">
        {notes.map((note) => (
          <li key={note.id} className="flex gap-4 py-3">
            <time
              dateTime={note.created_at}
              className="w-16 shrink-0 text-sm leading-5 whitespace-nowrap text-grove-muted tabular-nums"
            >
              {formatClock(note.created_at, locale, timeZone, { twoDigitHour: true })}
            </time>
            <div className="min-w-0 flex-1 text-sm leading-5">
              {note.title && <p className="font-semibold text-grove-ink">{note.title}</p>}
              <p className="whitespace-pre-wrap text-grove-ink">{note.content}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
