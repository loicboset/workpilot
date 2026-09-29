import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Space } from '@/db/types'
import { PALETTES, type Palette } from '@/lib/theme'
import { newRowFields, nowIso, saveLocally, updateLocally } from './localWrites'

/**
 * Spaces repository (ADR 0031): separate worlds, like browser profiles. Archived, never deleted.
 * The start page (`/`) is the only place that creates, renames, archives and restores them.
 */

export type SpaceFields = Pick<Space, 'name' | 'palette'>

/** URL names the app already uses at the top level: a space can't take them (as on the server). */
const RESERVED_SLUGS = ['api', 'onboarding', 'sign-in']
const SLUG_MAX_LENGTH = 60
export const SPACE_NAME_MAX_LENGTH = 40

/**
 * The name in URLs: lowercase letters and digits, words joined by "-" ("Côté pro" → "cote-pro").
 * The server follows the same rule (apps/api/app/domain/spaces/slug.py). Empty when the name has
 * neither letters nor digits.
 */
export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, '')

export type SpaceNameProblem = 'noLetters' | 'reserved' | 'taken'

/**
 * Why a space can't have this name, or `null` when it can (an empty name too: the form waits for
 * one). Names are unique whatever their case and accents, archived spaces included; `renaming`
 * is the space being renamed.
 */
export const spaceNameProblem = (
  name: string,
  spaces: Space[],
  renaming?: Space,
): SpaceNameProblem | null => {
  if (!name.trim()) return null
  const slug = slugify(name)
  if (!slug) return 'noLetters'
  if (RESERVED_SLUGS.includes(slug)) return 'reserved'
  if (spaces.some((space) => space.slug === slug && space.id !== renaming?.id)) return 'taken'
  return null
}

/** Every space, oldest first: the order of the start page. */
export const listSpaces = async (): Promise<Space[]> => {
  const spaces = await db.spaces.filter((space) => space.deleted_at === null).toArray()
  return spaces.sort((a, b) => a.created_at.localeCompare(b.created_at))
}

/** Live version of `listSpaces` for React components. `undefined` while loading. */
export const useSpaces = () => useLiveQuery(listSpaces)

/** The space at this URL name: `null` when there is none, `undefined` while loading. */
export const useSpaceBySlug = (slug: string | undefined): Space | null | undefined =>
  useLiveQuery(async () => {
    const space = await db.spaces
      .where('slug')
      .equals(slug ?? '')
      .filter((row) => row.deleted_at === null)
      .first()
    return space ?? null
  }, [slug])

/** A new space's palette: the first one no active space has yet. */
export const nextPalette = (spaces: Space[]): Palette =>
  PALETTES.find(
    (palette) => !spaces.some((space) => space.archived_at === null && space.palette === palette),
  ) ?? PALETTES[0]

/** A new space. `copyAiFrom`: the space it is created from, whose AI settings it starts with. */
export const createSpace = (fields: SpaceFields, copyAiFrom: string | null = null) =>
  saveLocally<Space>('spaces', {
    ...newRowFields(),
    name: fields.name.trim(),
    slug: slugify(fields.name),
    palette: fields.palette,
    archived_at: null,
    ...(copyAiFrom ? { copy_ai_from: copyAiFrom } : {}),
  })

/** A new name, and so a new URL. */
export const renameSpace = (id: string, name: string) =>
  updateLocally<Space>('spaces', id, { name: name.trim(), slug: slugify(name) })

export const setSpacePalette = (id: string, palette: Palette) =>
  updateLocally<Space>('spaces', id, { palette })

/** Greyed out on the start page, and its reminders stop. Nothing is deleted. */
export const archiveSpace = (id: string) =>
  updateLocally<Space>('spaces', id, { archived_at: nowIso() })

export const restoreSpace = (id: string) =>
  updateLocally<Space>('spaces', id, { archived_at: null })

// --- The space opened last on this device -----------------------------------------------------

const LAST_SPACE_KEY = 'workpilot:last-space'

/** Kept on this device: a space created from the start page starts with its AI settings. */
export const rememberLastSpace = (id: string): void => {
  try {
    localStorage.setItem(LAST_SPACE_KEY, id)
  } catch {
    // Storage blocked (e.g. private browsing): a new space then starts without AI.
  }
}

export const lastSpaceId = (): string | null => {
  try {
    return localStorage.getItem(LAST_SPACE_KEY)
  } catch {
    return null
  }
}
