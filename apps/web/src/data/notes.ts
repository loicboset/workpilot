import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Note } from '@/db/types'
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
