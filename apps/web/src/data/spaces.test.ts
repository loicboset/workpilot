import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import type { Space } from '@/db/types'
import { spaceRow } from '@/test/renderApp'
import {
  archiveSpace,
  createSpace,
  listSpaces,
  nextPalette,
  renameSpace,
  restoreSpace,
  slugify,
  spaceNameProblem,
} from './spaces'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('slugify', () => {
  // The same cases as the server's (apps/api/tests/test_spaces.py): both make the same URL.
  it.each([
    ['Work', 'work'],
    ['Côté pro', 'cote-pro'],
    ['  Kaizen   Way ', 'kaizen-way'],
    ['Café & Co.', 'cafe-co'],
    ['İstanbul', 'istanbul'],
    ['🚀 Side projects', 'side-projects'],
    ['🚀', ''],
    ['a'.repeat(70), 'a'.repeat(60)],
  ])('makes %j into %j', (name, slug) => {
    expect(slugify(name)).toBe(slug)
  })
})

describe('spaceNameProblem', () => {
  const work: Space = spaceRow('Côté pro')

  it('accepts a new name, and waits while there is none', () => {
    expect(spaceNameProblem('Personal', [work])).toBeNull()
    expect(spaceNameProblem('  ', [work])).toBeNull()
  })

  it("refuses a name that's taken, whatever its case and accents, archived spaces included", () => {
    expect(spaceNameProblem('cote PRO', [work])).toBe('taken')
    expect(spaceNameProblem('cote PRO', [{ ...work, archived_at: '2026-09-30T10:00:00Z' }])).toBe(
      'taken',
    )
    expect(spaceNameProblem('Côté Pro', [work], work)).toBeNull() // renaming it
  })

  it('refuses a name without letters or digits, or one the app uses', () => {
    expect(spaceNameProblem('🚀', [])).toBe('noLetters')
    expect(spaceNameProblem('Sign in', [])).toBe('reserved')
    expect(spaceNameProblem('API', [])).toBe('reserved')
  })
})

it('gives a new space a palette no active space has yet', () => {
  expect(nextPalette([])).toBe('grove')
  expect(nextPalette([spaceRow('Personal', 'grove'), spaceRow('Work', 'lake')])).toBe('heather')
  const archived = { ...spaceRow('Old', 'grove'), archived_at: '2026-09-30T10:00:00Z' }
  expect(nextPalette([archived])).toBe('grove')
})

it('creates, renames, archives and restores a space, queued for sync', async () => {
  const space = await createSpace({ name: ' Côté pro ', palette: 'lake' }, 'space-personal')

  expect(space).toMatchObject({
    name: 'Côté pro',
    slug: 'cote-pro',
    copy_ai_from: 'space-personal',
  })
  expect(await db.outbox.get(['spaces', space.id])).toBeDefined()

  expect((await renameSpace(space.id, 'Client work')).slug).toBe('client-work')
  expect((await archiveSpace(space.id)).archived_at).not.toBeNull()
  expect((await restoreSpace(space.id)).archived_at).toBeNull()
  expect((await listSpaces()).map((each) => each.name)).toEqual(['Client work'])
})
