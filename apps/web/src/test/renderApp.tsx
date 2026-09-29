/** Render the real app (routes, guard, layouts) at a given path, for page-level tests. */
import '@/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { SpaceContext } from '@/data/currentSpace'
import { newRowFields, newSpaceRowFields, nowIso } from '@/data/localWrites'
import { slugify } from '@/data/spaces'
import { db } from '@/db/db'
import type { Space } from '@/db/types'
import type { Palette } from '@/lib/theme'

const newQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={newQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { router }
}

/** Render a part of a space's pages on its own, with the space its hooks read (ADR 0031). */
export const renderInSpace = (ui: ReactNode, space: Space) =>
  render(
    <QueryClientProvider client={newQueryClient()}>
      <SpaceContext.Provider value={space}>{ui}</SpaceContext.Provider>
    </QueryClientProvider>,
  )

/** A user who has done onboarding on this device: the profile, shared by every space. */
export async function seedProfile(firstName: string) {
  await db.profiles.put({
    ...newRowFields(),
    first_name: firstName,
    last_name: null,
    locale: 'en',
    timezone: 'Europe/Zurich',
    city: null,
  })
}

type SeedSpaceOptions = {
  name?: string
  palette?: Palette
  /** Its North Star's title; `null` for a space still to set up. */
  northStar?: string | null
  isArchived?: boolean
}

/** A space's row, not saved: for a part of a page rendered on its own. */
export const spaceRow = (name = 'Personal', palette: Palette = 'grove'): Space => ({
  ...newRowFields(),
  name,
  slug: slugify(name),
  palette,
  archived_at: null,
})

/** A space as after onboarding: "Personal" at /personal, with its North Star. */
export async function seedSpace({
  name = 'Personal',
  palette = 'grove',
  northStar = 'Finish my first novel',
  isArchived = false,
}: SeedSpaceOptions = {}): Promise<Space> {
  const space: Space = { ...spaceRow(name, palette), archived_at: isArchived ? nowIso() : null }
  await db.spaces.put(space)
  if (northStar) {
    await db.north_stars.put({
      ...newSpaceRowFields(space.id),
      title: northStar,
      description: null,
      target_date: null,
    })
  }
  return space
}
