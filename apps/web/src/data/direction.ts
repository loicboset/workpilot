import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Milestone, NorthStar, TimeBlock, Todo } from '@/db/types'
import { useSpace } from './currentSpace'
import { deleteLocally, newSpaceRowFields, nowIso, saveLocally, updateLocally } from './localWrites'
import { activeRowsIn } from './spaceRows'

/**
 * Direction repository (ADR 0013): one North Star per space (ADR 0031) and the milestones on its
 * path. Progress = milestones reached. "Time aligned" = share of this week's done work linked to
 * one.
 */

export type NorthStarFields = Pick<NorthStar, 'title' | 'description' | 'target_date'>
export type MilestoneFields = Pick<Milestone, 'title' | 'description' | 'target_date'>

/** The space's North Star (the first one, if two devices made one offline). */
export async function getNorthStar(spaceId: string): Promise<NorthStar | null> {
  const northStars = await activeRowsIn(db.north_stars, spaceId)
  northStars.sort((a, b) => a.created_at.localeCompare(b.created_at))
  return northStars[0] ?? null
}

/** The page's space's North Star, `null` when there is none yet, `undefined` while loading. */
export function useNorthStar(): NorthStar | null | undefined {
  const { id } = useSpace()
  return useLiveQuery(() => getNorthStar(id), [id])
}

export async function saveNorthStar(spaceId: string, fields: NorthStarFields): Promise<NorthStar> {
  const current = await getNorthStar(spaceId)
  if (current) return updateLocally<NorthStar>('north_stars', current.id, fields)
  return saveLocally<NorthStar>('north_stars', { ...newSpaceRowFields(spaceId), ...fields })
}

/** The space's milestones in path order. */
export async function listMilestones(spaceId: string): Promise<Milestone[]> {
  const milestones = await activeRowsIn(db.milestones, spaceId)
  return milestones.sort(
    (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at),
  )
}

export function useMilestones(): Milestone[] | undefined {
  const { id } = useSpace()
  return useLiveQuery(() => listMilestones(id), [id])
}

/** Add a milestone at the end of the North Star's path, in its space. */
export async function addMilestone(
  northStar: NorthStar,
  fields: Pick<MilestoneFields, 'title'> & Partial<MilestoneFields>,
): Promise<Milestone> {
  const milestones = await listMilestones(northStar.space_id)
  const lastPosition = milestones.at(-1)?.position ?? -1
  return saveLocally<Milestone>('milestones', {
    ...newSpaceRowFields(northStar.space_id),
    north_star_id: northStar.id,
    description: null,
    target_date: null,
    completed_at: null,
    ...fields,
    title: fields.title.trim(),
    position: lastPosition + 1,
  })
}

/** A space's first direction: its North Star, then the milestones that have a title. */
export async function plantDirection(
  spaceId: string,
  northStar: NorthStarFields,
  milestoneTitles: string[],
): Promise<NorthStar> {
  const star = await saveNorthStar(spaceId, northStar)
  for (const title of milestoneTitles.filter((milestone) => milestone.trim())) {
    await addMilestone(star, { title })
  }
  return star
}

/** Every space's North Star title, by space id: the start page shows each one under its space. */
export function useNorthStarTitles(): Map<string, string> | undefined {
  return useLiveQuery(async () => {
    const northStars = await db.north_stars.filter((star) => star.deleted_at === null).toArray()
    northStars.sort((a, b) => b.created_at.localeCompare(a.created_at)) // the oldest one wins
    return new Map(northStars.map((star) => [star.space_id, star.title]))
  })
}

export function updateMilestone(id: string, changes: Partial<MilestoneFields>): Promise<Milestone> {
  return updateLocally<Milestone>('milestones', id, changes)
}

export const completeMilestone = (id: string) =>
  updateLocally<Milestone>('milestones', id, { completed_at: nowIso() })
export const reopenMilestone = (id: string) =>
  updateLocally<Milestone>('milestones', id, { completed_at: null })
export const deleteMilestone = (id: string) => deleteLocally('milestones', id)

/** The first milestone not reached yet: "you are here". */
export function currentMilestone(milestones: Milestone[]): Milestone | undefined {
  return milestones.find((milestone) => milestone.completed_at === null)
}

/**
 * Share (0–1) of the todos and time blocks done in [start, end) that are linked to a
 * milestone. `null` when nothing was done yet, so the app can say so kindly.
 */
export function timeAligned(
  work: (
    Pick<Todo, 'completed_at' | 'milestone_id'> | Pick<TimeBlock, 'completed_at' | 'milestone_id'>
  )[],
  [start, end]: [number, number],
): number | null {
  const done = work.filter((item) => {
    if (item.completed_at === null) return false
    const moment = Date.parse(item.completed_at)
    return moment >= start && moment < end
  })
  if (done.length === 0) return null
  return done.filter((item) => item.milestone_id !== null).length / done.length
}
