/** Text input looks, shared by Input, TextArea and the date and time fields to come. */
import { tv } from 'tailwind-variants'
import { focusRing } from '@/lib/styles'

export const inputStyles = tv({
  extend: focusRing,
  base: [
    'w-full rounded-control border border-transparent bg-grove-field px-4 text-[15px] text-grove-ink',
    'transition-colors placeholder:text-grove-muted/70 hovered:border-grove-line',
  ],
  variants: {
    isInvalid: { true: 'border-grove-berry hovered:border-grove-berry' },
    isDisabled: { true: 'opacity-50' },
  },
})

/** A field made of several parts (date segments, a button): the ring shows while any is focused. */
export const fieldGroupStyles = tv({
  extend: focusRing,
  base: [
    'flex h-11 w-full items-center rounded-control border border-transparent bg-grove-field px-4',
    'text-[15px] text-grove-ink transition-colors hovered:border-grove-line',
  ],
  variants: {
    isInvalid: { true: 'border-grove-berry hovered:border-grove-berry' },
    isDisabled: { true: 'opacity-50' },
  },
})

/** One part of a date or time ("28", "/", "09"). */
export const dateSegmentStyles = tv({
  base: 'rounded-sm px-0.5 tabular-nums outline-none type-literal:px-0',
  variants: {
    isPlaceholder: { true: 'text-grove-muted/70' },
    isFocused: { true: 'bg-grove-moss text-white' },
  },
})
