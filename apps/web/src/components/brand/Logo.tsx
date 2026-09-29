import { twMerge } from 'tailwind-merge'

/** When the name shows next to the leaf. Screen readers always get it. */
type ShowName = 'always' | 'from-sm' | 'never'

const NAME_STYLES: Record<ShowName, string> = {
  always: '',
  'from-sm': 'sr-only sm:not-sr-only', // headers that are too narrow on phones
  never: 'sr-only',
}

interface LogoProps {
  showName?: ShowName
  className?: string
}

/** The WorkPilot mark (a leaf on its path) and name. */
export function Logo({ showName = 'always', className }: LogoProps) {
  return (
    <span className={twMerge('inline-flex items-center gap-2.5 text-grove-moss', className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
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
      <span className={twMerge('font-serif text-xl text-grove-ink', NAME_STYLES[showName])}>
        WorkPilot
      </span>
    </span>
  )
}
