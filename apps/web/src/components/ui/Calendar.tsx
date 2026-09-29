import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  CalendarCell,
  CalendarGrid,
  Heading,
  type CalendarProps,
  type DateValue,
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { focusRing } from '@/lib/styles'

const cellStyles = tv({
  extend: focusRing,
  base: 'flex size-9 cursor-pointer items-center justify-center rounded-full text-sm tabular-nums',
  variants: {
    isSelected: {
      false: 'text-grove-ink hovered:bg-grove-field',
      true: 'bg-grove-moss font-semibold text-grove-on-fill',
    },
    isOutsideMonth: { true: 'hidden' },
    isDisabled: { true: 'cursor-default opacity-40' },
    isUnavailable: { true: 'cursor-default line-through opacity-40' },
  },
})

const navButton =
  'flex size-9 cursor-pointer items-center justify-center rounded-full text-grove-muted hovered:bg-grove-field focus-visible:outline-2 focus-visible:outline-grove-moss'

/** A month to pick a day from. Month names, weekdays and first day of the week follow the locale. */
export function Calendar<Date extends DateValue>(props: CalendarProps<Date>) {
  return (
    <AriaCalendar {...props} className="w-fit">
      <header className="flex items-center justify-between gap-2 pb-3">
        <AriaButton slot="previous" className={navButton}>
          <ChevronLeft className="size-4" aria-hidden />
        </AriaButton>
        <Heading className="font-serif text-lg capitalize text-grove-ink" />
        <AriaButton slot="next" className={navButton}>
          <ChevronRight className="size-4" aria-hidden />
        </AriaButton>
      </header>
      <CalendarGrid className="[&_th]:pb-2 [&_th]:text-xs [&_th]:font-medium [&_th]:text-grove-muted">
        {(date) => <CalendarCell date={date} className={(state) => cellStyles(state)} />}
      </CalendarGrid>
    </AriaCalendar>
  )
}
