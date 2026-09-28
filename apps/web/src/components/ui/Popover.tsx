import { Popover as AriaPopover, type PopoverProps } from 'react-aria-components'
import { composeTailwindRenderProps } from '@/lib/styles'

/** A floating panel next to what opened it: select lists, calendars, info. */
export function Popover(props: PopoverProps) {
  return (
    <AriaPopover
      offset={8}
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'rounded-control border border-grove-line bg-grove-card text-grove-ink shadow-grove outline-none',
      )}
    />
  )
}
