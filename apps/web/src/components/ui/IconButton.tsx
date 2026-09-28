import type { ReactNode } from 'react'
import { Button as AriaButton, composeRenderProps } from 'react-aria-components'
import type { ButtonProps } from './Button'
import { buttonStyles } from './Button.styles'

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  /** Required: an icon alone says nothing to a screen reader. */
  'aria-label': string
  /** The icon, e.g. `<LogOut />` from lucide-react. */
  children: ReactNode
}

/** A square button that shows only an icon. Quiet by default. */
export function IconButton({
  variant = 'quiet',
  size = 'md',
  children,
  ...props
}: IconButtonProps) {
  return (
    <AriaButton
      {...props}
      className={composeRenderProps(props.className, (className, state) =>
        buttonStyles({ ...state, variant, size, iconOnly: true, className }),
      )}
    >
      <span className="[&>svg]:size-5" aria-hidden>
        {children}
      </span>
    </AriaButton>
  )
}
