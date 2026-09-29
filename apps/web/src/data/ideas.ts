import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Idea } from '@/db/types'
import { useSpace } from './currentSpace'
import { deleteLocally, newSpaceRowFields, saveLocally } from './localWrites'
import { activeRowsIn } from './spaceRows'

/** Ideas repository: thoughts captured quickly, to look at later (Opportunities, v0.3). */

export async function listIdeas(spaceId: string): Promise<Idea[]> {
  const ideas = await activeRowsIn(db.ideas, spaceId)
  return ideas.sort((a, b) => b.created_at.localeCompare(a.created_at)) // newest first
}

/** Live version of `listIdeas` for the page's space. `undefined` while loading. */
export function useIdeas(): Idea[] | undefined {
  const { id } = useSpace()
  return useLiveQuery(() => listIdeas(id), [id])
}

export function addIdea(spaceId: string, text: string): Promise<Idea> {
  return saveLocally<Idea>('ideas', { ...newSpaceRowFields(spaceId), text: text.trim() })
}

export const deleteIdea = (id: string) => deleteLocally('ideas', id)
