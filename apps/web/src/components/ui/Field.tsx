/** The parts every form field shares: label, input, help text and error message. */
import {
  composeRenderProps,
  DateInput as AriaDateInput,
  DateSegment as AriaDateSegment,
  FieldError as AriaFieldError,
  Input as AriaInput,
  Label as AriaLabel,
  Text,
  TextArea as AriaTextArea,
  type DateInputProps,
  type DateSegmentProps,
  type FieldErrorProps,
  type InputProps,
  type LabelProps,
  type TextAreaProps,
  type TextProps,
} from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { composeTailwindRenderProps } from '@/lib/styles'
import { dateSegmentStyles, fieldGroupStyles, inputStyles } from './Field.styles'

export function Label(props: LabelProps) {
  return (
    <AriaLabel
      {...props}
      className={twMerge('text-sm font-medium text-grove-ink', props.className)}
    />
  )
}

/** Help text under a field. */
export function Description(props: TextProps) {
  return (
    <Text
      {...props}
      slot="description"
      className={twMerge('text-sm text-grove-muted', props.className)}
    />
  )
}

/** The field's error message, shown only while the field is invalid. */
export function FieldError(props: FieldErrorProps) {
  return (
    <AriaFieldError
      {...props}
      className={composeTailwindRenderProps(props.className, 'text-sm text-grove-berry')}
    />
  )
}

export function Input(props: InputProps) {
  return (
    <AriaInput
      {...props}
      className={composeRenderProps(props.className, (className, state) =>
        inputStyles({ ...state, className: twMerge('h-11', className) }),
      )}
    />
  )
}

export function TextArea(props: TextAreaProps) {
  return (
    <AriaTextArea
      {...props}
      className={composeRenderProps(props.className, (className, state) =>
        inputStyles({
          ...state,
          className: twMerge('min-h-24 resize-none py-3 leading-6', className),
        }),
      )}
    />
  )
}

/** A date or time typed part by part (day, month, year, hours…), in the user's locale order. */
export function DateInput(props: Omit<DateInputProps, 'children'>) {
  return (
    <AriaDateInput
      {...props}
      className={composeRenderProps(props.className, (className, state) =>
        fieldGroupStyles({ ...state, isFocusVisible: state.isFocusWithin, className }),
      )}
    >
      {(segment) => <DateSegment segment={segment} />}
    </AriaDateInput>
  )
}

export function DateSegment(props: DateSegmentProps) {
  return (
    <AriaDateSegment
      {...props}
      className={composeRenderProps(props.className, (className, state) =>
        dateSegmentStyles({ ...state, className }),
      )}
    />
  )
}
