import type { FormEvent } from 'react'

/** Handle a form's submit in the app, instead of the browser sending it. */
export const onSubmit = (action: () => void) => (event: FormEvent) => {
  event.preventDefault()
  action()
}
