import { ChevronDown } from 'lucide-react'
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  ListBox,
  type ComboBoxProps as AriaComboBoxProps,
} from 'react-aria-components'
import type { ReactNode } from 'react'
import { composeTailwindRenderProps } from '@/lib/styles'
import { Description, FieldError, Input, Label } from './Field'
import { Popover } from './Popover'

export interface ComboBoxProps<Item extends object> extends Omit<
  AriaComboBoxProps<Item>,
  'children'
> {
  label?: string
  description?: string
  errorMessage?: string
  placeholder?: string
  children: ReactNode | ((item: Item) => ReactNode)
}

/** Type to filter a long list, then pick one option, e.g. the timezone. */
export function ComboBox<Item extends object>({
  label,
  description,
  errorMessage,
  placeholder,
  children,
  ...props
}: ComboBoxProps<Item>) {
  return (
    <AriaComboBox
      {...props}
      className={composeTailwindRenderProps(props.className, 'flex flex-col gap-1.5')}
    >
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Input placeholder={placeholder} className="pr-11" />
        <AriaButton className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-grove-muted">
          <ChevronDown className="size-4" aria-hidden />
        </AriaButton>
      </div>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="w-(--trigger-width)">
        <ListBox className="max-h-72 overflow-auto p-1 outline-none">{children}</ListBox>
      </Popover>
    </AriaComboBox>
  )
}
