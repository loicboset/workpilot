import { useId, type ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv } from 'tailwind-variants'

export type HomeCardTone = 'moss' | 'sand' | 'sky' | 'rose'

type HomeCardProps = {
  title: string
  /** A few words at the top right, e.g. "Empty your mind". */
  aside?: string
  /** A lucide icon, shown in a tile tinted with `tone`. */
  icon: ReactNode
  tone: HomeCardTone
  /** Links or notes kept at the bottom of the card, however tall the row is. */
  footer?: ReactNode
  children: ReactNode
  className?: string
}

const tileStyles = tv({
  base: 'flex size-10 shrink-0 items-center justify-center rounded-control [&>svg]:size-[18px]',
  variants: {
    tone: {
      moss: 'bg-grove-moss-soft text-grove-moss',
      sand: 'bg-grove-sand text-grove-sand-ink',
      sky: 'bg-grove-sky text-grove-sky-ink',
      rose: 'bg-grove-rose text-grove-rose-ink',
    },
  },
})

/** A homepage card of the Grove concept: a tinted icon tile, a serif title, a quiet aside. */
export const HomeCard = ({
  title,
  aside,
  icon,
  tone,
  footer,
  children,
  className,
}: HomeCardProps) => {
  // HOOKS
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className={twMerge(
        'flex flex-col rounded-card bg-grove-card px-7 pt-6 pb-5.5 shadow-grove',
        className,
      )}
    >
      <header className="mb-3.5 flex items-center gap-3">
        <span aria-hidden className={tileStyles({ tone })}>
          {icon}
        </span>
        <h2 id={titleId} className="font-serif text-[22px] leading-7 font-medium text-grove-ink">
          {title}
        </h2>
        {aside && (
          <p className="ml-auto pl-3 text-right text-[13px] leading-4 text-grove-muted">{aside}</p>
        )}
      </header>
      <div className="flex-1">{children}</div>
      {footer && <div className="flex pt-4">{footer}</div>}
    </section>
  )
}
