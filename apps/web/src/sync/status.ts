import { create } from 'zustand'

/** What the header can show about sync. Calm by design: no red alerts (ADR 0004). */
export type SyncState = 'idle' | 'syncing' | 'offline' | 'retrying' | 'signed-out'

interface SyncStatus {
  state: SyncState
  lastSyncedAt: string | null
}

export const useSyncStatus = create<SyncStatus>(() => ({ state: 'idle', lastSyncedAt: null }))
