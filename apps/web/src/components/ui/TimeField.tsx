import {
  TimeField as AriaTimeField,
  type TimeFieldProps as AriaTimeFieldProps,
  type TimeValue,
} from 'react-aria-components'
import { composeTailwindRenderProps } from '@/lib/styles'
import { DateInput, Description, FieldError, Label } from './Field'

export interface TimeFieldProps<Time extends TimeValue> extends AriaTimeFieldProps<Time> {
  label?: string
  description?: string
  errorMessage?: string
}

/** A time of day, typed in the locale's format (14:00, or 2:00 PM). */
export function TimeField<Time extends TimeValue>({
  label,
  description,
  errorMessage,
  ...props
}: TimeFieldProps<Time>) {
  return (
    <AriaTimeField
      {...props}
      className={composeTailwindRenderProps(props.className, 'flex flex-col gap-1.5')}
    >
      {label && <Label>{label}</Label>}
      <DateInput />
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTimeField>
  )
}
