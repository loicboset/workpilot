import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { useProfile } from '@/data/profile'
import { SESSION_QUERY_KEY } from '@/features/auth/session'
import { changeLocale, currentLocale } from '@/i18n'
import { startSync } from '@/sync/scheduler'
import { useSyncStatus } from '@/sync/status'
import { RequireOnboarding } from '../RequireOnboarding'

/** Every signed-in page but onboarding: the start page and the spaces. Sync runs while shown. */
export const SignedInLayout = () => {
  // HOOKS
  useSignedOutBySync()
  useProfileLanguage()

  // EFFECTS
  useEffect(() => startSync(), []) // returns the function that stops it

  return (
    <RequireOnboarding>
      <Outlet />
    </RequireOnboarding>
  )
}

/** When sync learns the session has expired, check again: the guard then shows sign-in. */
const useSignedOutBySync = () => {
  // HOOKS
  const queryClient = useQueryClient()
  const syncState = useSyncStatus((status) => status.state)

  // EFFECTS
  useEffect(() => {
    if (syncState === 'signed-out') {
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    }
  }, [syncState, queryClient])
}

/** Speak the profile's language, e.g. on a new device once the profile has synced. */
const useProfileLanguage = () => {
  // HOOKS
  const locale = useProfile()?.locale

  // EFFECTS
  useEffect(() => {
    if (locale && locale !== currentLocale()) void changeLocale(locale)
  }, [locale])
}
