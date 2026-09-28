import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { FocusLayout } from '@/app/layouts/FocusLayout'
import { Card } from '@/components/ui/Card'
import { useSession } from './session'
import { SignInForm } from './SignInForm'

export function SignInPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = safeNextPath(searchParams.get('next'))
  const session = useSession()

  if (session.isSuccess) return <Navigate to={next} replace /> // already signed in

  return (
    <FocusLayout>
      <Card title={t('auth.signIn.title')} subtitle={t('auth.signIn.subtitle')}>
        <SignInForm onSignedIn={() => navigate(next, { replace: true })} />
      </Card>
      <p className="mt-6 px-6 text-center text-sm text-grove-muted">{t('auth.signIn.forgot')}</p>
    </FocusLayout>
  )
}

/** Where to go after signing in. Only paths inside the app: never another site. */
function safeNextPath(next: string | null): string {
  return next?.startsWith('/') && !next.startsWith('//') ? next : '/'
}
