import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Profile } from '@/db/types'
import { newRowFields, saveLocally, updateLocally } from './localWrites'

/** Profile repository: one profile per install (the first one, if two devices made one). */

export type ProfileFields = Pick<
  Profile,
  'first_name' | 'last_name' | 'locale' | 'timezone' | 'city'
>

export async function getProfile(): Promise<Profile | null> {
  const profiles = await db.profiles
    .filter((profile) => profile.deleted_at === null)
    .sortBy('created_at')
  return profiles[0] ?? null
}

/** The profile, `null` before onboarding, `undefined` while loading. */
export function useProfile(): Profile | null | undefined {
  return useLiveQuery(getProfile)
}

export async function saveProfile(fields: ProfileFields): Promise<Profile> {
  const current = await getProfile()
  if (current) return updateLocally<Profile>('profiles', current.id, fields)
  return saveLocally<Profile>('profiles', { ...newRowFields(), ...fields })
}

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/** The user's timezone: the profile's, or this device's until onboarding is done. */
export function useTimeZone(): string {
  return useProfile()?.timezone ?? deviceTimeZone()
}
