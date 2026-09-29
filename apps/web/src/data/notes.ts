import type { Note } from '@/db/types'
import { newRowFields, saveLocally } from './localWrites'

/** Notes repository: things to keep, as written (References + notes, v0.4). */

export const addNote = (content: string): Promise<Note> =>
  saveLocally<Note>('notes', {
    ...newRowFields(),
    title: null,
    content: content.trim(),
    milestone_id: null,
  })
