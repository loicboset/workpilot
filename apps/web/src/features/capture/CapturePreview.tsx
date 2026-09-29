import { today } from '@internationalized/date'
import { Button } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { PriorityBadge, PriorityBars } from '@/components/PriorityBadge'
import { focusRing } from '@/lib/styles'
import { dayLabel, formatTimeOfDay } from '@/lib/format'
import { nextPriority, type Priority } from '@/lib/priority'
import { COMMAND_ICONS } from './commandIcons'
import type { ParseResult } from './parseCapture'

type CapturePreviewProps = {
  result: ParseResult
  timeZone: string
  /** Pressing a todo's priority: the text changes to the next one. */
  onPriorityChange: (priority: Priority | null) => void
}

/** How to use the capture field: "/" for a command, plain text for an idea. */
export const CaptureHint = () => {
  // HOOKS
  const { t } = useTranslation()

  return <p className="text-sm text-grove-muted">{t('capture.hint')}</p>
}

/** What the capture field understood, before Enter (ADR 0010). */
export const CapturePreview = ({ result, timeZone, onPriorityChange }: CapturePreviewProps) => {
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
    details = t('capture.preview.due', {
      day: dayLabel(capture.dueDate, t, locale, timeZone, { inSentence: true }),
    })
  } else if (capture.kind === 'icebox') {
    details = t('capture.preview.icebox')
  } else if (capture.kind === 'block') {
    details = `${dayLabel(capture.day, t, locale, timeZone)} · ${formatTimeOfDay(capture.start, locale)}–${formatTimeOfDay(capture.end, locale)}`
  }
  const title = 'text' in capture ? capture.text : capture.title
  const day =
    capture.kind === 'block' ? capture.day : capture.kind === 'todo' ? capture.dueDate : null
  const isToday = day !== null && day.compare(today(timeZone)) === 0

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1" aria-live="polite">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-grove-moss-soft px-2.5 py-0.5 font-semibold text-grove-moss">
          <Icon className="size-3.5" aria-hidden />
          {t(`capture.kinds.${capture.kind}`)}
        </span>
        <span className="line-clamp-2 font-medium text-grove-ink">{title}</span>
        {details && (
          <span className={isToday ? 'text-grove-moss' : 'text-grove-muted'}>· {details}</span>
        )}
      </p>
      {'priority' in capture && (
        <PriorityButton
          priority={capture.priority}
          onPress={() => onPriorityChange(nextPriority(capture.priority))}
        />
      )}
    </div>
  )
}

/**
 * A todo's priority, pressed to change it: none, 1, 2, 3, none… Typing "!" is quicker on a
 * keyboard; on a phone, "!" hides behind the symbols. The focus stays in the capture field.
 */
const PriorityButton = ({
  priority,
  onPress,
}: {
  priority: Priority | null
  onPress: () => void
}) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <Button
      preventFocusOnPress
      onPress={onPress}
      aria-label={
        priority
          ? t('capture.changePriority', { level: t(`priority.levels.${priority}`) })
          : t('capture.addPriority')
      }
      className={(state) => focusRing({ ...state, className: 'cursor-pointer rounded-full' })}
    >
      {priority ? (
        <PriorityBadge priority={priority} />
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-grove-stone px-1.5 text-xs leading-4.5 font-semibold text-grove-muted">
          <PriorityBars priority={null} className="size-3" />
          {t('priority.menu')}
        </span>
      )}
    </Button>
  )
}
