import { Check } from 'lucide-react'
import {
  Checkbox as AriaCheckbox,
  composeRenderProps,
  type CheckboxProps,
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { composeTailwindRenderProps, focusRing } from '@/lib/styles'

const boxStyles = tv({
  extend: focusRing,
  base: 'flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
  variants: {
    isSelected: {
      false: 'border-grove-line bg-grove-card group-hovered:border-grove-moss',
      true: 'border-grove-moss bg-grove-moss text-white',
    },
    isDisabled: { true: 'opacity-50' },
  },
})

/** A checkbox with its label, e.g. marking a todo done. */
export function Checkbox({ children, ...props }: CheckboxProps) {
  return (
    <AriaCheckbox
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'group flex cursor-pointer items-center gap-3 text-[15px] text-grove-ink',
      )}
    >
      {composeRenderProps(children, (children, state) => (
        <>
          <span className={boxStyles(state)}>
            {state.isSelected && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
          </span>
          {children}
        </>
      ))}
    </AriaCheckbox>
  )
}
