/**
 * Rows of the synced tables, in the same shape (snake_case) as the API returns them.
 * See docs/data-model.md. Dates are ISO strings: "2026-10-01" or "2026-10-01T09:00:00Z".
 */

import type { Locale } from '@/i18n'

/** Fields every synced row has. */
export interface SyncedRow {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null // soft delete, so the deletion reaches every device
}

export interface Profile extends SyncedRow {
  first_name: string
  last_name: string | null
  locale: Locale
  timezone: string
  city: string | null
}

export interface NorthStar extends SyncedRow {
  title: string
  description: string | null
  target_date: string | null
}

export interface Milestone extends SyncedRow {
  north_star_id: string
  title: string
  description: string | null
  target_date: string | null
  position: number
  completed_at: string | null
}

export interface Todo extends SyncedRow {
  title: string
  notes: string | null
  due_date: string | null
  completed_at: string | null
  milestone_id: string | null
}

export interface TimeBlock extends SyncedRow {
  title: string
  start_at: string
  end_at: string
  completed_at: string | null
  milestone_id: string | null
}

export interface Reminder extends SyncedRow {
  text: string
  remind_at: string
  recurrence: string | null
  sent_at: string | null // set by the server
  todo_id: string | null
  time_block_id: string | null
}

export interface Idea extends SyncedRow {
  text: string
}

export interface Note extends SyncedRow {
  title: string | null
  content: string
  milestone_id: string | null
}

export type ReviewKind = 'daily' | 'weekly' | 'monthly'

export interface ReviewTemplate extends SyncedRow {
  name: string
  kind: ReviewKind
  questions: string[]
}

export interface JournalEntry extends SyncedRow {
  entry_date: string
  kind: 'free' | ReviewKind
  content: string
  review_template_id: string | null
}

export interface TickerMessage extends SyncedRow {
  kind: 'insight' | 'tip' | 'guidance' | 'nudge' | 'quote'
  text: string
}
