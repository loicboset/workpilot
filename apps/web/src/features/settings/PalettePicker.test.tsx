import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it } from 'vitest'
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
  localStorage.clear()
})

it('starts with Grove, then shows and saves the picked palette', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/settings')

  const group = await screen.findByRole('radiogroup', { name: 'Colours' })
  expect(group.getAttribute('aria-describedby')).toBeTruthy() // "Each works in light and dark."
  expect(screen.getByRole('radio', { name: 'Grove' })).toHaveProperty('checked', true)

  await userEvent.click(screen.getByRole('radio', { name: 'Heather' }))

  await waitFor(() => expect(document.documentElement.dataset.palette).toBe('heather'))
  expect(screen.getByRole('radio', { name: 'Heather' })).toHaveProperty('checked', true)
  expect((await getProfile())?.palette).toBe('heather')
})
