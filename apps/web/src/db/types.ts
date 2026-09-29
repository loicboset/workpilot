/**
 * Rows of the synced tables, in the same shape (snake_case) as the API returns them.
 * See docs/data-model.md. Dates are ISO strings: "2026-10-01" or "2026-10-01T09:00:00Z".
 */

import type { Locale } from '@/i18n'
import type { Priority } from '@/lib/priority'
import type { Palette, Theme } from '@/lib/theme'

/** Fields every synced row has. */
export interface SyncedRow {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null // soft delete, so the deletion reaches every device
}

/** A separate world: its own North Star, days, notes, palette and AI (ADR 0031). */
export interface Space extends SyncedRow {
  name: string
  /** The name in URLs: "Côté pro" → `/cote-pro`. */
  slug: string
  palette: Palette
  /** Archived spaces are greyed out on the start page, never deleted. */
  archived_at: string | null
  /**
   * Sent with a new space only: the space whose AI settings and prompts it starts with. The
   * server copies them when the space reaches it; its rows never have it.
   */
  copy_ai_from?: string | null
}

/** A row of a space. It never moves to another space. */
export interface SpaceRow extends SyncedRow {
  space_id: string
}

/** Shared by every space. */
export interface Profile extends SyncedRow {
  first_name: string
  last_name: string | null
  locale: Locale
  timezone: string
  city: string | null
  /** Light or dark in every space. Absent on rows saved before it existed: `system`. */
  theme?: Theme
}

export interface NorthStar extends SpaceRow {
  title: string
  description: string | null
  target_date: string | null
}

export interface Milestone extends SpaceRow {
  north_star_id: string
  title: string
  description: string | null
  target_date: string | null
  position: number
  completed_at: string | null
}

export interface Todo extends SpaceRow {
  title: string
  notes: string | null
  due_date: string | null
  /** 1 (most important) to 3, or none. Absent on rows saved before priorities existed: none. */
  priority?: Priority | null
  completed_at: string | null
  milestone_id: string | null
}

export interface TimeBlock extends SpaceRow {
  title: string
  start_at: string
  end_at: string
  completed_at: string | null
  milestone_id: string | null
}

export interface Reminder extends SpaceRow {
  text: string
  remind_at: string
  recurrence: string | null
  sent_at: string | null // set by the server
  todo_id: string | null
  time_block_id: string | null
}

export interface Idea extends SpaceRow {
  text: string
}

export interface Note extends SpaceRow {
  title: string | null
  content: string
  milestone_id: string | null
}

export type ReviewKind = 'daily' | 'weekly' | 'monthly'

export interface ReviewTemplate extends SpaceRow {
  name: string
  kind: ReviewKind
  questions: string[]
}

export interface JournalEntry extends SpaceRow {
  entry_date: string
  kind: 'free' | ReviewKind
  content: string
  review_template_id: string | null
}

export interface TickerMessage extends SpaceRow {
  kind: 'insight' | 'tip' | 'guidance' | 'nudge' | 'quote'
  text: string
}
