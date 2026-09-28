import { vi } from 'vitest'
import type { Change, PullResponse, PushResponse, SyncApi } from '@/sync/api'

/** A sync API double: records pushes, answers pulls from a list of pages. */
export function fakeSyncApi(
  options: {
    pages?: PullResponse[]
    pushResult?: (changes: Change[]) => PushResponse | Promise<PushResponse>
  } = {},
) {
  const pages = [...(options.pages ?? [])]
  const pushed: Change[][] = []

  const api: SyncApi = {
    pull: vi.fn(async () => pages.shift() ?? { changes: [], cursor: 0, has_more: false }),
    push: vi.fn(async (changes: Change[]) => {
      pushed.push(changes)
      return options.pushResult
        ? options.pushResult(changes)
        : { applied: changes.map((change) => change.row.id), skipped: [], rejected: [] }
    }),
  }
  return { api, pushed }
}
