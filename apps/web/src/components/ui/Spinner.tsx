import { twMerge } from 'tailwind-merge'

interface SpinnerProps {
  /** Announced to screen readers. Leave empty when the spinner sits inside a labelled control. */
  label?: string
  className?: string
}

/** A small turning circle, in the current text colour. */
export function Spinner({ label, className }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={twMerge('size-5 animate-spin', className)}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="30 70"
      />
    </svg>
  )
}
