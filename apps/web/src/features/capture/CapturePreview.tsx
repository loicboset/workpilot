import { today } from '@internationalized/date'
import { Clock3, Lightbulb, ListTodo } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { dayLabel, formatTimeOfDay } from '@/lib/format'
import type { ParseResult } from './parseCapture'

const ICONS = { todo: ListTodo, block: Clock3, idea: Lightbulb }

/** What the capture bar understood, before Enter (ADR 0010). */
export function CapturePreview({ result, timeZone }: { result: ParseResult; timeZone: string }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  if ('problem' in result) {
    if (result.problem === 'empty')
      return <p className="text-sm text-grove-muted">{t('capture.hint')}</p>
    return <p className="text-sm text-grove-berry">{t(`capture.problems.${result.problem}`)}</p>
  }

  const { capture } = result
  const Icon = ICONS[capture.kind]
  let details = ''
  if (capture.kind === 'todo') {
    details = capture.dueDate
      ? t('capture.preview.due', {
          day: dayLabel(capture.dueDate, t, locale, timeZone, { inSentence: true }),
        })
      : t('capture.preview.noDate')
  } else if (capture.kind === 'block') {
    details = `${dayLabel(capture.day, t, locale, timeZone)} · ${formatTimeOfDay(capture.start, locale)}–${formatTimeOfDay(capture.end, locale)}`
  }
  const title = capture.kind === 'idea' ? capture.text : capture.title
  const isToday = capture.kind === 'block' && capture.day.compare(today(timeZone)) === 0

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" aria-live="polite">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-grove-moss-soft px-2.5 py-0.5 font-semibold text-grove-moss">
        <Icon className="size-3.5" aria-hidden />
        {t(`capture.kinds.${capture.kind}`)}
      </span>
      <span className="font-medium text-grove-ink">{title}</span>
      {details && (
        <span className={isToday ? 'text-grove-moss' : 'text-grove-muted'}>· {details}</span>
      )}
    </p>
  )
}
