import {
  Button as AriaButton,
  composeRenderProps,
  type ButtonProps as AriaButtonProps,
} from 'react-aria-components'
import { buttonStyles } from './Button.styles'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'
export type ButtonSize = 'md' | 'sm'

export interface ButtonProps extends AriaButtonProps {
  /** @default 'primary' */
  variant?: ButtonVariant
  /** @default 'md' */
  size?: ButtonSize
}

/** A button. Set `isPending` while its action runs: it shows a spinner and ignores presses. */
export function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps) {
  const spinnerColor =
    variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-grove-moss'
  return (
    <AriaButton
      {...props}
      className={composeRenderProps(props.className, (className, state) =>
        buttonStyles({ ...state, variant, size, className }),
      )}
    >
      {composeRenderProps(props.children, (children, { isPending }) => (
        <>
          {children}
          {isPending && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Spinner className={spinnerColor} />
            </span>
          )}
        </>
      ))}
    </AriaButton>
  )
}
