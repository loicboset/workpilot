import { CircleAlert, CircleCheck, Info, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { tv } from 'tailwind-variants'

export type AlertTone = 'info' | 'success' | 'error'

const alertStyles = tv({
  base: 'flex items-start gap-3 rounded-control px-4 py-3 text-sm leading-5',
  variants: {
    tone: {
      info: 'bg-grove-sky text-grove-ink',
      success: 'bg-grove-moss-soft text-grove-ink',
      error: 'bg-grove-berry-soft text-grove-berry',
    },
  },
})

const ICONS: Record<AlertTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  error: CircleAlert,
}

interface AlertProps {
  tone?: AlertTone
  children: ReactNode
  className?: string
}

/** A short message in the page. Errors are announced to screen readers straight away. */
export function Alert({ tone = 'info', children, className }: AlertProps) {
  const Icon = ICONS[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={alertStyles({ tone, className })}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
