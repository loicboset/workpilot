import { ApiError } from '@/api/client'
import { syncOnce } from './engine'
import { useSyncStatus } from './status'

/**
 * When to sync: at start, when back online, when the app is shown again, shortly after a
 * local edit, and every 30 seconds. One sync at a time, even with several tabs open.
 * Failures are retried with growing delays; a 401 stops sync until the next login.
 */

const PERIOD_MS = 30_000
const AFTER_EDIT_MS = 1_000
const MAX_RETRY_MS = 5 * 60_000
const LOCK_NAME = 'workpilot-sync'

let running = false
let nextRun: ReturnType<typeof setTimeout> | undefined
let failedAttempts = 0
let syncInProgress = false
let syncAgainAfter = false // an edit arrived during a sync: run once more right after

/** Start syncing. Returns a function that stops it. */
export function startSync(): () => void {
  running = true
  window.addEventListener('online', syncNow)
  document.addEventListener('visibilitychange', syncWhenVisible)
  syncNow()
  return stopSync
}

/** Ask for a sync soon, e.g. after a local edit. Several quick edits lead to one sync. */
export function requestSync(): void {
  scheduleNext(AFTER_EDIT_MS)
}

/** 1 s, 2 s, 4 s… up to 5 minutes. */
export function retryDelay(failedAttempts: number): number {
  return Math.min(1_000 * 2 ** failedAttempts, MAX_RETRY_MS)
}

function stopSync(): void {
  running = false
  clearTimeout(nextRun)
  window.removeEventListener('online', syncNow)
  document.removeEventListener('visibilitychange', syncWhenVisible)
}

function syncWhenVisible(): void {
  if (document.visibilityState === 'visible') syncNow()
}

function syncNow(): void {
  scheduleNext(0)
}

function scheduleNext(delayMs: number): void {
  if (!running) return
  clearTimeout(nextRun)
  nextRun = setTimeout(() => void runSync(), delayMs)
}

async function runSync(): Promise<void> {
  if (syncInProgress) {
    syncAgainAfter = true
    return
  }
  syncInProgress = true
  useSyncStatus.setState({ state: 'syncing' })
  try {
    await withSyncLock(syncOnce)
    failedAttempts = 0
    useSyncStatus.setState({ state: 'idle', lastSyncedAt: new Date().toISOString() })
    scheduleNext(PERIOD_MS)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      useSyncStatus.setState({ state: 'signed-out' }) // the outbox is kept for after login
      stopSync()
      return
    }
    useSyncStatus.setState({ state: navigator.onLine ? 'retrying' : 'offline' })
    scheduleNext(retryDelay(failedAttempts++))
  } finally {
    syncInProgress = false
    if (syncAgainAfter) {
      syncAgainAfter = false
      scheduleNext(0)
    }
  }
}

/** Run the task unless another tab is already syncing (they share the same database). */
async function withSyncLock(task: () => Promise<void>): Promise<void> {
  if (!('locks' in navigator)) return task()
  await navigator.locks.request(LOCK_NAME, { ifAvailable: true }, async (lock) => {
    if (lock) await task()
  })
}
