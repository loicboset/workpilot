import { Form as AriaForm, type FormProps } from 'react-aria-components'
import { twMerge } from 'tailwind-merge'

/**
 * A form with even spacing between fields.
 *
 * Errors are shown by the fields themselves (`isInvalid` + `errorMessage`), never as browser
 * pop-ups, so they can be translated and styled like the rest of the app.
 */
export function Form(props: FormProps) {
  return (
    <AriaForm
      validationBehavior="aria"
      {...props}
      className={twMerge('flex flex-col gap-5', props.className)}
    />
  )
}
