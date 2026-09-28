import { useLiveQuery } from 'dexie-react-hooks'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useProfile } from '@/data/profile'
import { db } from '@/db/db'
import { CURSOR_KEY } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'

/**
 * Sends a user without a profile to onboarding, but only once this device has heard from the
 * server (or can't reach it): on a new phone, the profile made on the laptop arrives with the
 * first sync, and onboarding must not start again.
 */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const profile = useProfile()
  const hasSynced = useLiveQuery(async () => (await db.meta.get(CURSOR_KEY)) !== undefined)
  const syncState = useSyncStatus((status) => status.state)
  const serverUnreachable = syncState === 'offline' || syncState === 'retrying'

  if (profile === null && (hasSynced || serverUnreachable)) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}
