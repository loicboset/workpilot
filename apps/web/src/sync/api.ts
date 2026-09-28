import { request } from '@/api/client'
import type { SyncedRow } from '@/db/types'

/** The server's sync endpoints (ADR 0025, docs/api.md). */

export interface Change {
  table: string
  row: SyncedRow
}

export interface PullResponse {
  changes: Change[]
  cursor: number
  has_more: boolean
}

export interface PushResponse {
  applied: string[]
  skipped: string[] // the server had a more recent version
  rejected: { table: string; id: string | null; reason: string }[]
}

export const PUSH_BATCH_SIZE = 500 // the server's maximum per push

export const syncApi = {
  pull: (since: number) => request<PullResponse>('GET', `/sync/pull?since=${since}`),
  push: (changes: Change[]) => request<PushResponse>('POST', '/sync/push', { changes }),
}

export type SyncApi = typeof syncApi
