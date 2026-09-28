import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Milestone, NorthStar, TimeBlock, Todo } from '@/db/types'
import { deleteLocally, newRowFields, nowIso, saveLocally, updateLocally } from './localWrites'

/**
 * Direction repository (ADR 0013): one North Star and the milestones on its path.
 * Progress = milestones reached. "Time aligned" = share of this week's done work linked to one.
 */

export type NorthStarFields = Pick<NorthStar, 'title' | 'description' | 'target_date'>
export type MilestoneFields = Pick<Milestone, 'title' | 'description' | 'target_date'>

export async function getNorthStar(): Promise<NorthStar | null> {
  const northStars = await db.north_stars
    .filter((star) => star.deleted_at === null)
    .sortBy('created_at')
  return northStars[0] ?? null
}

/** The North Star, `null` when there is none yet, `undefined` while loading. */
export function useNorthStar(): NorthStar | null | undefined {
  return useLiveQuery(getNorthStar)
}

export async function saveNorthStar(fields: NorthStarFields): Promise<NorthStar> {
  const current = await getNorthStar()
  if (current) return updateLocally<NorthStar>('north_stars', current.id, fields)
  return saveLocally<NorthStar>('north_stars', { ...newRowFields(), ...fields })
}

/** Milestones in path order. */
export async function listMilestones(): Promise<Milestone[]> {
  const milestones = await db.milestones
    .filter((milestone) => milestone.deleted_at === null)
    .toArray()
  return milestones.sort(
    (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at),
  )
}

export function useMilestones(): Milestone[] | undefined {
  return useLiveQuery(listMilestones)
}

/** Add a milestone at the end of the path. */
export async function addMilestone(
  northStarId: string,
  fields: Pick<MilestoneFields, 'title'> & Partial<MilestoneFields>,
): Promise<Milestone> {
  const milestones = await listMilestones()
  const lastPosition = milestones.at(-1)?.position ?? -1
  return saveLocally<Milestone>('milestones', {
    ...newRowFields(),
    north_star_id: northStarId,
    description: null,
    target_date: null,
    completed_at: null,
    ...fields,
    title: fields.title.trim(),
    position: lastPosition + 1,
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
