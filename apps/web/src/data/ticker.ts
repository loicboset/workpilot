import { useLiveQuery } from 'dexie-react-hooks'
import { request } from '@/api/client'
import { db } from '@/db/db'
import type { TickerMessage } from '@/db/types'
import { requestSync } from '@/sync/scheduler'

/** Ticker messages (ADR 0016): written by the AI on the server, read here through sync. */

export function useTickerMessages(): TickerMessage[] | undefined {
  return useLiveQuery(async () => {
    const messages = await db.ticker_messages
      .filter((message) => message.deleted_at === null)
      .toArray()
    return messages.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5)
  })
}

/**
 * Ask the server for fresh messages (it only calls the AI when they are a few hours old).
 * Quietly does nothing without an AI provider or a connection: the ticker then shows tips.
 */
export async function refreshTicker(): Promise<void> {
  try {
    await request('POST', '/ticker-messages/refresh')
    requestSync()
  } catch {
    // No AI set up, offline, or the model failed: the static tips stay.
  }
}
