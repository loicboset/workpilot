import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Form } from '@/components/ui/Form'
import { TextField } from '@/components/ui/TextField'
import { useSignIn, type Credentials } from './session'

interface SignInFormProps {
  onSignedIn: () => void
}

export function SignInForm({ onSignedIn }: SignInFormProps) {
  const { t } = useTranslation()
  const signIn = useSignIn()
  const { control, handleSubmit } = useForm<Credentials>({
    defaultValues: { username: '', password: '' },
  })
  const required = { required: t('auth.signIn.required') }

  return (
    <Form
      onSubmit={handleSubmit((credentials) =>
        signIn.mutate(credentials, { onSuccess: onSignedIn }),
      )}
    >
      <Controller
        name="username"
        control={control}
        rules={required}
        render={({ field, fieldState }) => (
          <TextField
            label={t('auth.signIn.username')}
            autoComplete="username"
            autoFocus
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            isInvalid={fieldState.invalid}
            errorMessage={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="password"
        control={control}
        rules={required}
        render={({ field, fieldState }) => (
          <TextField
            label={t('auth.signIn.password')}
            type="password"
            autoComplete="current-password"
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            isInvalid={fieldState.invalid}
            errorMessage={fieldState.error?.message}
          />
        )}
      />
      {signIn.isError && <Alert tone="error">{t(signInErrorKey(signIn.error))}</Alert>}
      <Button type="submit" isPending={signIn.isPending} className="mt-1 w-full">
        {t('auth.signIn.submit')}
      </Button>
    </Form>
  )
}

/** The message for a failed sign-in: no server, wrong credentials, or too many tries. */
function signInErrorKey(error: Error) {
  if (error instanceof TypeError) return 'auth.signIn.errors.unreachable'
  const status = error instanceof ApiError ? error.status : undefined
  if (status === 401) return 'auth.signIn.errors.wrongCredentials'
  if (status === 429) return 'auth.signIn.errors.tooManyAttempts'
  return 'auth.signIn.errors.unexpected'
}
