import { ChevronDown } from 'lucide-react'
import {
  Button as AriaButton,
  ListBox,
  Select as AriaSelect,
  SelectValue,
  type SelectProps as AriaSelectProps,
} from 'react-aria-components'
import type { ReactNode } from 'react'
import { composeTailwindRenderProps } from '@/lib/styles'
import { Description, FieldError, Label } from './Field'
import { inputStyles } from './Field.styles'
import { Popover } from './Popover'

export interface SelectProps<Item extends object> extends Omit<AriaSelectProps<Item>, 'children'> {
  label?: string
  description?: string
  errorMessage?: string
  items?: Iterable<Item>
  /** `<ListBoxItem>`s, or a function of each item when `items` is given. */
  children: ReactNode | ((item: Item) => ReactNode)
}

/** Pick one option from a short list, e.g. the language. */
export function Select<Item extends object>({
  label,
  description,
  errorMessage,
  items,
  children,
  ...props
}: SelectProps<Item>) {
  return (
    <AriaSelect
      {...props}
      className={composeTailwindRenderProps(props.className, 'flex flex-col gap-1.5')}
    >
      {label && <Label>{label}</Label>}
      <AriaButton
        className={(state) =>
          inputStyles({
            ...state,
            className: 'flex h-11 cursor-pointer items-center justify-between gap-2 text-left',
          })
        }
      >
        <SelectValue className="truncate placeholder-shown:text-grove-muted/70" />
        <ChevronDown className="size-4 shrink-0 text-grove-muted" aria-hidden />
      </AriaButton>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="min-w-(--trigger-width)">
        <ListBox items={items} className="max-h-72 overflow-auto p-1 outline-none">
          {children}
        </ListBox>
      </Popover>
    </AriaSelect>
  )
}
