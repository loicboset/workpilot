import { today } from '@internationalized/date'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Note } from '@/db/types'
import { dayBounds } from '@/lib/dates'
import { useSpace } from './currentSpace'
import { deleteLocally, newSpaceRowFields, saveLocally, updateLocally } from './localWrites'
import { activeRowsIn } from './spaceRows'

/** Notes repository: things to keep, as written (References + notes, v0.4). */

export type NoteFields = Pick<Note, 'title' | 'content'>

/** The space's notes, newest first. */
export const listNotes = async (spaceId: string): Promise<Note[]> => {
  const notes = await activeRowsIn(db.notes, spaceId)
  return notes.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

/** Live version of `listNotes` for the page's space. `undefined` while loading. */
export const useNotes = () => {
  const { id } = useSpace()
  return useLiveQuery(() => listNotes(id), [id])
}

/** How far back the review looks: today and the 6 days before. */
export const RECENT_DAYS = 7

/** The space's notes written in the last `RECENT_DAYS` days, in the timezone: newest first. */
export const listRecentNotes = async (spaceId: string, timeZone: string): Promise<Note[]> => {
  const [start] = dayBounds(today(timeZone).subtract({ days: RECENT_DAYS - 1 }), timeZone)
  const notes = await listNotes(spaceId)
  return notes.filter((note) => Date.parse(note.created_at) >= start)
}

/** Live version of `listRecentNotes` for the page's space. `undefined` while loading. */
export const useRecentNotes = (timeZone: string) => {
  const { id } = useSpace()
  return useLiveQuery(() => listRecentNotes(id, timeZone), [id, timeZone])
}

export const addNote = (
  spaceId: string,
  content: string,
  title: string | null = null,
): Promise<Note> =>
  saveLocally<Note>('notes', {
    ...newSpaceRowFields(spaceId),
    title: title?.trim() || null,
    content: content.trim(),
    milestone_id: null,
  })

export const updateNote = (id: string, changes: Partial<NoteFields>): Promise<Note> =>
  updateLocally<Note>('notes', id, changes)

export const deleteNote = (id: string) => deleteLocally('notes', id)
