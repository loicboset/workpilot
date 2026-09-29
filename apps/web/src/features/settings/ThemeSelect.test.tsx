import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getProfile } from '@/data/profile'
import { db } from '@/db/db'
import { startFakeServer } from '@/test/fakeServer'
import { renderApp, seedProfile } from '@/test/renderApp'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedProfile('Ada')
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

it("starts with the device's setting, then shows and saves the picked theme", async () => {
  startFakeServer({ signedIn: true })
  renderApp('/settings')

  const select = await screen.findByRole('button', { name: /Theme/ })
  await waitFor(() => expect(select.textContent).toContain('Same as the device'))
  expect(document.documentElement.dataset.theme).toBe('light') // the test device is light

  await userEvent.click(select)
  await userEvent.click(screen.getByRole('option', { name: 'Dark' }))

  await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'))
  expect((await getProfile())?.theme).toBe('dark')
})
