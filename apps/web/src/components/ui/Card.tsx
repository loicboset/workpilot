import { useId, type ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface CardProps {
  title?: string
  /** A short line under the title, e.g. "Empty your mind". */
  subtitle?: string
  /** Shown in a soft circle before the title, e.g. `<Leaf />` from lucide-react. */
  icon?: ReactNode
  /** Buttons or links on the right of the title. */
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** The Grove surface every card and panel is built on. */
export function Card({ title, subtitle, icon, actions, children, className }: CardProps) {
  const titleId = useId()
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={twMerge('rounded-card bg-grove-card p-6 shadow-grove', className)}
    >
      {title && (
        <header className="mb-5 flex items-center gap-3">
          {icon && (
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-grove-moss-soft text-grove-moss [&>svg]:size-5"
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-serif text-xl text-grove-ink">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-grove-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
