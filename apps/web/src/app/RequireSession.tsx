import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router'
import { Spinner } from '@/components/ui/Spinner'
import { isSignedOut, useSession } from '@/features/auth/session'

/**
 * Shows its content to a signed-in user only; others go to the sign-in page.
 *
 * Offline-first: when the server can't be reached, the content is still shown, because the
 * data lives on this device. Only a clear "not signed in" answer (401) leads to sign-in.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const session = useSession()
  const location = useLocation()

  if (session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-grove-moss">
        <Spinner label={t('common.loading')} className="size-7" />
      </div>
    )
  }
  if (isSignedOut(session.error)) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/sign-in?next=${next}`} replace />
  }
  return children
}
