import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { PRIORITIES, type Priority } from '@/lib/priority'

const COLOURS: Record<Priority, string> = {
  1: 'bg-grove-rose text-grove-rose-ink',
  2: 'bg-grove-sand text-grove-sand-ink',
  3: 'bg-grove-sky text-grove-sky-ink',
}

const ICON_COLOURS: Record<Priority, string> = {
  1: 'text-grove-rose-ink',
  2: 'text-grove-sand-ink',
  3: 'text-grove-sky-ink',
}

type PriorityBadgeProps = {
  priority: Priority
  className?: string
}

/** A todo's priority (ADR 0030): "P1" with its bars, read out as "High priority". */
export const PriorityBadge = ({ priority, className }: PriorityBadgeProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <span
      className={twMerge(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 text-xs leading-5 font-semibold',
        COLOURS[priority],
        className,
      )}
    >
      <PriorityBars priority={priority} className="size-3" />
      <span aria-hidden>{t('priority.short', { priority })}</span>
      <span className="sr-only">{t(`priority.levels.${priority}`)}</span>
    </span>
  )
}

/** The bars alone, in the priority's colour, e.g. in a menu next to its name. */
export const PriorityIcon = ({ priority, className }: PriorityBadgeProps) => (
  <PriorityBars
    priority={priority}
    className={twMerge('size-4', ICON_COLOURS[priority], className)}
  />
)

/**
 * Three bars of rising height, as in Linear: priority 1 fills all three, 3 fills one, none
 * fills none. Filled shapes, so they stay legible at 12px (a flag already means a milestone).
 */
export const PriorityBars = ({
  priority,
  className,
}: {
  priority: Priority | null
  className?: string
}) => {
  // VARS
  const filled = priority === null ? 0 : PRIORITIES.length + 1 - priority

  return (
    <svg viewBox="0 0 12 12" fill="currentColor" className={className} aria-hidden>
      {PRIORITIES.map((_, bar) => (
        <rect
          key={bar}
          x={1 + bar * 3.75}
          y={8 - bar * 3}
          width={2.5}
          height={3 + bar * 3}
          rx={0.75}
          opacity={bar < filled ? 1 : 0.3}
        />
      ))}
    </svg>
  )
}
