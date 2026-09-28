import { Check, ChevronRight } from 'lucide-react'
import {
  composeRenderProps,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  type MenuItemProps,
  type MenuProps,
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { Popover } from './Popover'

const menuItemStyles = tv({
  base: 'flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] text-grove-ink outline-none',
  variants: {
    isFocused: { true: 'bg-grove-field' },
    isDisabled: { true: 'cursor-default opacity-50' },
    isDanger: { true: 'text-grove-berry' },
  },
})

/**
 * A list of actions in a popover. Put it in a `MenuTrigger` after the button that opens it,
 * or in a `SubmenuTrigger` after the item that opens it.
 */
export function Menu<Item extends object>(props: MenuProps<Item>) {
  return (
    <Popover placement="bottom end" className="min-w-52">
      <AriaMenu {...props} className="max-h-80 overflow-auto p-1 outline-none" />
    </Popover>
  )
}

interface ItemProps extends MenuItemProps {
  /** Shown in the warm error colour, e.g. "Delete". */
  isDanger?: boolean
}

export function MenuItem({ isDanger = false, ...props }: ItemProps) {
  const textValue =
    props.textValue ?? (typeof props.children === 'string' ? props.children : undefined)
  return (
    <AriaMenuItem
      {...props}
      textValue={textValue}
      className={composeRenderProps(props.className, (className, state) =>
        menuItemStyles({ ...state, isDanger, className }),
      )}
    >
      {composeRenderProps(props.children, (children, { hasSubmenu, isSelected }) => (
        <>
          <span className="flex flex-1 items-center gap-3 [&>svg]:size-4">{children}</span>
          {isSelected && <Check className="size-4" aria-hidden />}
          {hasSubmenu && <ChevronRight className="size-4 text-grove-muted" aria-hidden />}
        </>
      ))}
    </AriaMenuItem>
  )
}
