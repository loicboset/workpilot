import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Idea } from '@/db/types'
import { deleteLocally, newRowFields, saveLocally } from './localWrites'

/** Ideas repository: thoughts captured quickly, to look at later (Opportunities, v0.3). */

export async function listIdeas(): Promise<Idea[]> {
  const ideas = await db.ideas.filter((idea) => idea.deleted_at === null).toArray()
  return ideas.sort((a, b) => b.created_at.localeCompare(a.created_at)) // newest first
}

export function useIdeas(): Idea[] | undefined {
  return useLiveQuery(listIdeas)
}

export function addIdea(text: string): Promise<Idea> {
  return saveLocally<Idea>('ideas', { ...newRowFields(), text: text.trim() })
}

export const deleteIdea = (id: string) => deleteLocally('ideas', id)
