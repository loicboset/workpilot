import { useLiveQuery } from 'dexie-react-hooks'
import { CURSOR_KEY, db } from '@/db/db'
import { useSyncStatus } from './status'

/**
 * Whether this device has heard from the server once, or can't reach it. Until then, a row that
 * seems missing may simply not have arrived: on a new phone, the profile, the spaces and their
 * North Stars made on the laptop come with the first sync.
 */
export const useHasHeardFromServer = (): boolean => {
  const hasSynced = useLiveQuery(async () => (await db.meta.get(CURSOR_KEY)) !== undefined)
  const syncState = useSyncStatus((status) => status.state)
  return hasSynced === true || syncState === 'offline' || syncState === 'retrying'
}
