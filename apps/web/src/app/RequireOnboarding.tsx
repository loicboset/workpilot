import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useProfile } from '@/data/profile'
import { useHasHeardFromServer } from '@/sync/useHasHeardFromServer'

/**
 * Sends a user without a profile to onboarding, but only once this device has heard from the
 * server (or can't reach it): on a new phone, the profile made on the laptop arrives with the
 * first sync, and onboarding must not start again.
 */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const profile = useProfile()
  const hasHeardFromServer = useHasHeardFromServer()

  if (profile === null && hasHeardFromServer) return <Navigate to="/onboarding" replace />
  return children
}
