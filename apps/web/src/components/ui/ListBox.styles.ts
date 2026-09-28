/** Options in a list (Select, ComboBox). */
import { tv } from 'tailwind-variants'

export const listBoxItemStyles = tv({
  base: 'flex cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-[15px] outline-none',
  variants: {
    isFocused: { true: 'bg-grove-field' },
    isSelected: { true: 'font-semibold text-grove-moss' },
    isDisabled: { true: 'cursor-default opacity-50' },
  },
})
