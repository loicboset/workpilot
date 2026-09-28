import { CalendarDays } from 'lucide-react'
import {
  Button as AriaButton,
  DateInput as AriaDateInput,
  DatePicker as AriaDatePicker,
  Group,
  type DatePickerProps as AriaDatePickerProps,
  type DateValue,
} from 'react-aria-components'
import { composeTailwindRenderProps } from '@/lib/styles'
import { Calendar } from './Calendar'
import { DateSegment, Description, FieldError, Label } from './Field'
import { fieldGroupStyles } from './Field.styles'
import { Dialog } from './Modal'
import { Popover } from './Popover'

export interface DatePickerProps<Date extends DateValue> extends AriaDatePickerProps<Date> {
  label?: string
  description?: string
  errorMessage?: string
}

/** A date: typed part by part in the locale's order, or picked in a calendar. */
export function DatePicker<Date extends DateValue>({
  label,
  description,
  errorMessage,
  ...props
}: DatePickerProps<Date>) {
  return (
    <AriaDatePicker
      {...props}
      className={composeTailwindRenderProps(props.className, 'flex flex-col gap-1.5')}
    >
      {label && <Label>{label}</Label>}
      <Group
        className={(state) =>
          fieldGroupStyles({ ...state, isFocusVisible: state.isFocusWithin, className: 'pr-1' })
        }
      >
        <AriaDateInput className="flex flex-1 items-center">
          {(segment) => <DateSegment segment={segment} />}
        </AriaDateInput>
        <AriaButton className="flex size-9 cursor-pointer items-center justify-center rounded-full text-grove-muted hovered:bg-grove-card focus-visible:outline-2 focus-visible:outline-grove-moss">
          <CalendarDays className="size-4" aria-hidden />
        </AriaButton>
      </Group>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="p-4">
        <Dialog>
          <Calendar />
        </Dialog>
      </Popover>
    </AriaDatePicker>
  )
}
