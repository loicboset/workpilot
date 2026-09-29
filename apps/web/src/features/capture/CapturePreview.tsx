import { today } from '@internationalized/date'
import { useTranslation } from 'react-i18next'
import { dayLabel, formatTimeOfDay } from '@/lib/format'
import { COMMAND_ICONS } from './commandIcons'
import type { ParseResult } from './parseCapture'

/** How to use the capture field: "/" for a command, plain text for an idea. */
export const CaptureHint = () => {
  // HOOKS
  const { t } = useTranslation()

  return <p className="text-sm text-grove-muted">{t('capture.hint')}</p>
}

/** What the capture field understood, before Enter (ADR 0010). */
export const CapturePreview = ({ result, timeZone }: { result: ParseResult; timeZone: string }) => {
  // HOOKS
  const { t, i18n } = useTranslation()

  if ('problem' in result) {
    if (result.problem === 'empty') return <CaptureHint />
    return <p className="text-sm text-grove-berry">{t(`capture.problems.${result.problem}`)}</p>
  }

  // VARS
  const locale = i18n.language
  const { capture } = result
  const Icon = COMMAND_ICONS[capture.kind]
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
  const title = 'text' in capture ? capture.text : capture.title
  const isToday = capture.kind === 'block' && capture.day.compare(today(timeZone)) === 0

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" aria-live="polite">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-grove-moss-soft px-2.5 py-0.5 font-semibold text-grove-moss">
        <Icon className="size-3.5" aria-hidden />
        {t(`capture.kinds.${capture.kind}`)}
      </span>
      <span className="line-clamp-2 font-medium text-grove-ink">{title}</span>
      {details && (
        <span className={isToday ? 'text-grove-moss' : 'text-grove-muted'}>· {details}</span>
      )}
    </p>
  )
}
