import { twMerge } from 'tailwind-merge'

interface LogoProps {
  /** Only the leaf, e.g. in a narrow header. */
  markOnly?: boolean
  className?: string
}

/** The WorkPilot mark (a leaf on its path) and name. */
export function Logo({ markOnly = false, className }: LogoProps) {
  return (
    <span className={twMerge('inline-flex items-center gap-2.5 text-grove-moss', className)}>
      <svg
        viewBox="0 0 32 32"
        className="size-8 shrink-0"
        {...(markOnly ? { role: 'img', 'aria-label': 'WorkPilot' } : { 'aria-hidden': true })}
      >
        <circle cx="16" cy="16" r="16" className="fill-grove-moss-soft" />
        <path d="M9 23c0-8 5-13 14-14-1 9-6 14-14 14Z" className="fill-grove-moss" />
        <path
          d="M9 23c3-4 6-7 10-9"
          fill="none"
          stroke="var(--color-grove-moss-soft)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      {!markOnly && <span className="font-serif text-xl text-grove-ink">WorkPilot</span>}
    </span>
  )
}
