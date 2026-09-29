import { today } from '@internationalized/date'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Note } from '@/db/types'
import { dayBounds } from '@/lib/dates'
import { deleteLocally, newRowFields, saveLocally, updateLocally } from './localWrites'

/** Notes repository: things to keep, as written (References + notes, v0.4). */

export type NoteFields = Pick<Note, 'title' | 'content'>

/** Notes, newest first. */
export const listNotes = async (): Promise<Note[]> => {
  const notes = await db.notes.filter((note) => note.deleted_at === null).toArray()
  return notes.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

/** Live version of `listNotes` for React components. `undefined` while loading. */
export const useNotes = () => useLiveQuery(listNotes)

/** How far back the review looks: today and the 6 days before. */
export const RECENT_DAYS = 7

/** The notes written in the last `RECENT_DAYS` days, in the timezone: newest first. */
export const listRecentNotes = async (timeZone: string): Promise<Note[]> => {
  const [start] = dayBounds(today(timeZone).subtract({ days: RECENT_DAYS - 1 }), timeZone)
  const notes = await listNotes()
  return notes.filter((note) => Date.parse(note.created_at) >= start)
}

/** Live version of `listRecentNotes` for React components. `undefined` while loading. */
export const useRecentNotes = (timeZone: string) =>
  useLiveQuery(() => listRecentNotes(timeZone), [timeZone])

export const addNote = (content: string, title: string | null = null): Promise<Note> =>
  saveLocally<Note>('notes', {
    ...newRowFields(),
    title: title?.trim() || null,
    content: content.trim(),
    milestone_id: null,
  })

export const updateNote = (id: string, changes: Partial<NoteFields>): Promise<Note> =>
  updateLocally<Note>('notes', id, changes)

export const deleteNote = (id: string) => deleteLocally('notes', id)
