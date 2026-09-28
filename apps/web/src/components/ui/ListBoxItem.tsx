import { Check } from 'lucide-react'
import {
  composeRenderProps,
  ListBoxItem as AriaListBoxItem,
  type ListBoxItemProps,
} from 'react-aria-components'
import { listBoxItemStyles } from './ListBox.styles'

/** One option of a Select or ComboBox. The selected one shows a check. */
export function ListBoxItem(props: ListBoxItemProps) {
  const textValue =
    props.textValue ?? (typeof props.children === 'string' ? props.children : undefined)
  return (
    <AriaListBoxItem
      {...props}
      textValue={textValue}
      className={composeRenderProps(props.className, (className, state) =>
        listBoxItemStyles({ ...state, className }),
      )}
    >
      {composeRenderProps(props.children, (children, { isSelected }) => (
        <>
          <span className="truncate">{children}</span>
          {isSelected && <Check className="size-4 shrink-0" aria-hidden />}
        </>
      ))}
    </AriaListBoxItem>
  )
}
