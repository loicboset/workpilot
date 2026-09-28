/**
 * Styling helpers for the building blocks in `components/ui` (React Aria + Tailwind).
 * Same approach as Adobe's React Aria Tailwind starter kit.
 */
import { composeRenderProps } from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { tv } from 'tailwind-variants'

/** The focus ring, shown to keyboard users only (React Aria's `isFocusVisible`). */
export const focusRing = tv({
  base: 'outline outline-offset-2 outline-grove-moss forced-colors:outline-[Highlight]',
  variants: {
    isFocusVisible: {
      false: 'outline-0',
      true: 'outline-2',
    },
  },
})

/**
 * Add a component's own classes to the caller's `className`, which React Aria allows to be a
 * string or a function of the component's state. On conflicts, the caller's classes win.
 */
export function composeTailwindRenderProps<State>(
  className: string | ((state: State) => string) | undefined,
  base: string,
): string | ((state: State) => string) {
  return composeRenderProps(className, (className) => twMerge(base, className))
}
