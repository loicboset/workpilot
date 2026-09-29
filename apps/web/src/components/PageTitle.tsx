import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { buttonStyles } from './ui/Button.styles'

export type PageTitleProps = {
  children: ReactNode
  /** Where the arrow goes back to, e.g. the space's homepage. */
  backHref: string
  /** A line under the title, e.g. "Todos without a date, kept for later". */
  subtitle?: ReactNode
  className?: string
}

/** A page's title, after a small arrow back to the homepage. */
export const PageTitle = ({ children, backHref, subtitle, className }: PageTitleProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <div className={twMerge('flex items-start gap-1', className)}>
      <Link
        href={backHref}
        aria-label={t('nav.backHome')}
        className={(state) =>
          buttonStyles({
            ...state,
            variant: 'quiet',
            size: 'sm',
            iconOnly: true,
            className: '-ml-2 shrink-0 text-grove-muted hovered:text-grove-ink',
          })
        }
      >
        <ArrowLeft className="size-5" aria-hidden />
      </Link>
      <div className="min-w-0">
        <h1 className="font-serif text-3xl text-grove-ink">{children}</h1>
        {subtitle && <div className="text-sm text-grove-muted">{subtitle}</div>}
      </div>
    </div>
  )
}
