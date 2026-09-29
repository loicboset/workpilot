import { tv } from 'tailwind-variants'
import type { Space } from '@/db/types'

const markStyles = tv({
  base: 'inline-flex shrink-0 items-center justify-center rounded-full bg-grove-moss font-semibold text-grove-on-fill',
  variants: {
    size: {
      xs: 'size-5 text-[11px]',
      sm: 'size-7 text-sm',
      lg: 'size-11 text-lg',
    },
  },
})

type SpaceMarkProps = { space: Pick<Space, 'name' | 'palette'>; size: 'xs' | 'sm' | 'lg' }

/**
 * The space's initial on a circle of its own colours, wherever it's shown: its `data-palette`
 * gives it that palette's tokens (styles/index.css). Decorative: the name is always next to it.
 */
export const SpaceMark = ({ space, size }: SpaceMarkProps) => (
  <span aria-hidden data-palette={space.palette} className={markStyles({ size })}>
    {Array.from(space.name.trim())[0]?.toUpperCase()}
  </span>
)
