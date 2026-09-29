import type { ReactNode } from 'react'
import { Link } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { tv } from 'tailwind-variants'

type FutureLinkProps = {
  children: ReactNode
  /** "strong" for the main action, "quiet" for the one next to it. */
  tone?: 'strong' | 'quiet'
  /** Show a "→" after the text. */
  arrow?: boolean
  className?: string
}

const futureLinkStyles = tv({
  base: 'cursor-default text-[15px] leading-5 underline underline-offset-3',
  variants: {
    tone: {
      strong: 'font-semibold text-grove-moss',
      quiet: 'text-grove-muted',
    },
  },
})

/**
 * A link to a screen that doesn't exist yet (review, opportunities, learning): it looks like
 * the concept's link, says it's coming, and is marked unavailable for assistive technologies.
 */
export const FutureLink = ({
  children,
  tone = 'strong',
  arrow = true,
  className,
}: FutureLinkProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <span title={t('home.comingSoon')} className="inline-flex">
      <Link isDisabled className={futureLinkStyles({ tone, className })}>
        {children}
        {arrow && <span aria-hidden> →</span>}
      </Link>
    </span>
  )
}
