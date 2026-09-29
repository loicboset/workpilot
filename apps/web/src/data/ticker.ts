import { useLiveQuery } from 'dexie-react-hooks'
import { request } from '@/api/client'
import { db } from '@/db/db'
import type { TickerMessage } from '@/db/types'
import { requestSync } from '@/sync/scheduler'
import { useSpace } from './currentSpace'
import { activeRowsIn } from './spaceRows'

/**
 * Ticker messages (ADR 0016): written by the AI on the server, read here through sync. Each
 * space has its own, from its own direction (ADR 0031).
 */

export function useTickerMessages(): TickerMessage[] | undefined {
  const { id } = useSpace()
  return useLiveQuery(async () => {
    const messages = await activeRowsIn(db.ticker_messages, id)
    return messages.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5)
  }, [id])
}

/**
 * Ask the server for the space's fresh messages (it only calls the AI when they are a few hours
 * old). Quietly does nothing without an AI provider or a connection: the ticker then shows tips.
 */
export async function refreshTicker(spaceId: string): Promise<void> {
  try {
    await request('POST', `/spaces/${spaceId}/ticker-messages/refresh`)
    requestSync()
  } catch {
    // No AI set up, offline, or the model failed: the static tips stay.
  }
}
