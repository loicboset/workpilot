/** Render the real app (routes, guard, layouts) at a given path, for page-level tests. */
import '@/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { newRowFields } from '@/data/localWrites'
import { db } from '@/db/db'

export function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { router }
}

/** A user who has done onboarding on this device. */
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
