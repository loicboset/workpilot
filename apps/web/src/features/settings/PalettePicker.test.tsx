import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { db } from '@/db/db'
import type { Space } from '@/db/types'
import { startFakeServer } from '@/test/fakeServer'
import { renderApp, seedProfile, seedSpace } from '@/test/renderApp'

let space: Space

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedProfile('Ada')
  space = await seedSpace()
})

afterEach(() => {
  localStorage.clear()
})

it("starts with the space's palette, then shows and saves the picked one", async () => {
  startFakeServer({ signedIn: true })
  renderApp('/personal/settings')

  const group = await screen.findByRole('radiogroup', { name: 'Colours' })
  expect(group.getAttribute('aria-describedby')).toBeTruthy() // "The colours of Personal…"
  expect(screen.getByRole('radio', { name: 'Grove' })).toHaveProperty('checked', true)

  await userEvent.click(screen.getByRole('radio', { name: 'Heather' }))

  await waitFor(() => expect(document.documentElement.dataset.palette).toBe('heather'))
  expect(screen.getByRole('radio', { name: 'Heather' })).toHaveProperty('checked', true)
  expect((await db.spaces.get(space.id))?.palette).toBe('heather')
  // The next load of a page of this space starts in its colours (index.html).
  expect(JSON.parse(localStorage.getItem('workpilot:palettes') ?? '{}')).toEqual({
    personal: 'heather',
  })
})

it('shows each space in its own colours', async () => {
  await seedSpace({ name: 'Work', palette: 'lake' })
  startFakeServer({ signedIn: true })
  const { router } = renderApp('/personal')

  await waitFor(() => expect(document.documentElement.dataset.palette).toBe('grove'))
  await router.navigate('/work')
  await waitFor(() => expect(document.documentElement.dataset.palette).toBe('lake'))
})
