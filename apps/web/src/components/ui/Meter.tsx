import { Meter as AriaMeter, type MeterProps as AriaMeterProps } from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { Label } from './Field'

interface MeterProps extends AriaMeterProps {
  label: string
  /** Hide the label and value, e.g. when the page shows the number in big already. */
  hideText?: boolean
  className?: string
}

/** How full something is, e.g. "time aligned this week: 62%". */
export function Meter({ label, hideText = false, className, ...props }: MeterProps) {
  return (
    <AriaMeter
      {...props}
      aria-label={hideText ? label : undefined}
      className={twMerge('flex flex-col gap-2', className)}
    >
      {({ percentage, valueText }) => (
        <>
          {!hideText && (
            <div className="flex justify-between gap-3 text-sm">
              <Label>{label}</Label>
              <span className="text-grove-muted tabular-nums">{valueText}</span>
            </div>
          )}
          <div className="h-2 overflow-hidden rounded-full bg-grove-moss-soft">
            <div
              className="h-full rounded-full bg-grove-moss transition-[width] duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </>
      )}
    </AriaMeter>
  )
}
