/** Button looks, shared by Button and IconButton. */
import { tv } from 'tailwind-variants'
import { focusRing } from '@/lib/styles'

export const buttonStyles = tv({
  extend: focusRing,
  base: [
    'relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-control',
    'font-semibold whitespace-nowrap transition-colors [-webkit-tap-highlight-color:transparent]',
  ],
  variants: {
    variant: {
      primary:
        'bg-grove-moss text-grove-on-fill hovered:bg-grove-moss-dark pressed:bg-grove-moss-dark',
      secondary:
        'border border-grove-line bg-grove-card text-grove-ink hovered:bg-grove-field pressed:bg-grove-moss-soft',
      quiet: 'bg-transparent text-grove-ink hovered:bg-grove-field pressed:bg-grove-moss-soft',
      danger: 'bg-grove-berry text-grove-on-fill hovered:brightness-95 pressed:brightness-90',
    },
    size: {
      md: 'h-11 px-5 text-[15px]',
      sm: 'h-9 px-4 text-sm',
    },
    iconOnly: {
      true: 'px-0',
    },
    isDisabled: {
      true: 'cursor-default opacity-50',
    },
    isPending: {
      true: 'cursor-wait text-transparent', // the label stays for its width; a spinner covers it
    },
  },
  compoundVariants: [
    { iconOnly: true, size: 'md', class: 'w-11' },
    { iconOnly: true, size: 'sm', class: 'w-9' },
  ],
  defaultVariants: { variant: 'primary', size: 'md' },
})
