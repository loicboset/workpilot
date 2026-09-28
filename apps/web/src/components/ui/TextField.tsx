import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  type ValidationResult,
} from 'react-aria-components'
import { composeTailwindRenderProps } from '@/lib/styles'
import { Description, FieldError, Input, Label, TextArea } from './Field'

export interface TextFieldProps extends AriaTextFieldProps {
  label?: string
  /** Help text under the field. */
  description?: string
  errorMessage?: string | ((validation: ValidationResult) => string)
  placeholder?: string
  /** A text area for longer text, instead of a single line. */
  multiline?: boolean
}

/** A labelled text field: label, input (or text area), help text and error message. */
export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  multiline = false,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      {...props}
      className={composeTailwindRenderProps(props.className, 'flex flex-col gap-1.5')}
    >
      {label && <Label>{label}</Label>}
      {multiline ? <TextArea placeholder={placeholder} /> : <Input placeholder={placeholder} />}
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  )
}
