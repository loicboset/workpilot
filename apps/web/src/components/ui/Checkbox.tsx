import {
  Checkbox as AriaCheckbox,
  composeRenderProps,
  type CheckboxProps,
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { composeTailwindRenderProps, focusRing } from '@/lib/styles'

const boxStyles = tv({
  extend: focusRing,
  base: 'flex size-4.25 shrink-0 items-center justify-center rounded-[3px] border transition-colors',
  variants: {
    isSelected: {
      false: 'border-grove-stone bg-white group-hovered:border-grove-moss',
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
            {state.isSelected && (
              <svg viewBox="0 0 17 17" className="size-4.25" aria-hidden>
                <path
                  d="M3.4 8.7 7 12.1l6.4-7.6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                />
              </svg>
            )}
          </span>
          {children}
        </>
      ))}
    </AriaCheckbox>
  )
}
