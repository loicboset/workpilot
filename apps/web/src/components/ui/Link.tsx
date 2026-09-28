import { Link as AriaLink, composeRenderProps, type LinkProps } from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { focusRing } from '@/lib/styles'

const linkStyles = tv({
  extend: focusRing,
  base: 'cursor-pointer rounded-sm font-medium text-grove-moss underline-offset-4 transition-colors hovered:text-grove-moss-dark hovered:underline',
})

/** A link. App paths (`href="/today"`) go through React Router, without a page reload. */
export function Link(props: LinkProps) {
  return (
    <AriaLink
      {...props}
      className={composeRenderProps(props.className, (className, state) =>
        linkStyles({ ...state, className }),
      )}
    />
  )
}
