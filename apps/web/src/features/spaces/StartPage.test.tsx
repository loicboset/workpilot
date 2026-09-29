import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { db } from '@/db/db'
import type { Space } from '@/db/types'
import { startFakeServer } from '@/test/fakeServer'
import { renderApp, seedProfile, seedSpace } from '@/test/renderApp'

let personal: Space

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedProfile('Ada')
  personal = await seedSpace()
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

const openStartPage = async () => {
  startFakeServer({ signedIn: true })
  const app = renderApp('/')
  await screen.findByRole('list') // the spaces, read from this device
  return app
}

const openMenuOf = async (name: string) =>
  userEvent.click(await screen.findByRole('button', { name: `More for “${name}”` }))

it('shows each space with its North Star; archived ones come last, greyed out', async () => {
  await seedSpace({ name: 'Old', northStar: null, isArchived: true })
  await seedSpace({ name: 'Work', palette: 'lake', northStar: 'Ship WorkPilot 1.0' })
  await openStartPage()

  const tiles = within(screen.getByRole('list')).getAllByRole('listitem')
  expect(tiles.map((tile) => tile.textContent)).toEqual([
    'PPersonal' + 'Finish my first novel',
    'WWork' + 'Ship WorkPilot 1.0',
    'New space',
    'OOld' + 'No North Star yet' + 'Archived',
  ])
  expect(screen.getByRole('link', { name: 'Work' }).getAttribute('href')).toBe('/work')
  expect(screen.queryByRole('link', { name: 'Old' })).toBeNull() // restored first

  await openMenuOf('Old')
  expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Restore'])
  await userEvent.click(screen.getByRole('menuitem', { name: 'Restore' }))
  expect(await screen.findByRole('link', { name: 'Old' })).toBeTruthy()
})

it('opens a space from its tile', async () => {
  const { router } = await openStartPage()

  await userEvent.click(screen.getByRole('link', { name: 'Personal' }))

  expect(await screen.findByRole('heading', { name: 'Hi Ada,' })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/personal')
})

it('creates a space, sets up its North Star, then opens it', async () => {
  localStorage.setItem('workpilot:last-space', personal.id)
  const { router } = await openStartPage()

  await userEvent.click(screen.getByRole('button', { name: 'New space' }))
  const dialog = await screen.findByRole('dialog', { name: 'A new space' })
  expect(within(dialog).getByRole('radio', { name: 'Lake' })).toHaveProperty('checked', true)
  const name = within(dialog).getByLabelText(/^Name/)
  await userEvent.type(name, 'personal')
  expect(within(dialog).getByText('You already have a space with this name.')).toBeTruthy()
  expect(within(dialog).getByRole('button', { name: 'Create' })).toHaveProperty('disabled', true)
  await userEvent.clear(name)
  await userEvent.type(name, 'Work')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

  await waitFor(() => expect(router.state.location.pathname).toBe('/work'))
  expect(await screen.findByText('Work · Step 1 of 2')).toBeTruthy()
  await userEvent.type(screen.getByLabelText(/^North Star/), 'Ship WorkPilot 1.0')
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await userEvent.type(await screen.findByLabelText('Milestone 1'), 'Beta with ten users')
  await userEvent.click(screen.getByRole('button', { name: 'Plant my path' }))

  expect(await screen.findByRole('heading', { name: 'Hi Ada,' })).toBeTruthy()
  const work = (await db.spaces.toArray()).find((space) => space.slug === 'work')
  // It starts with the AI settings of the space last opened on this device.
  expect(work).toMatchObject({ palette: 'lake', copy_ai_from: personal.id })
  expect((await db.north_stars.toArray()).find((star) => star.space_id === work?.id)?.title).toBe(
    'Ship WorkPilot 1.0',
  )
})

it('renames a space, and its address with it', async () => {
  await openStartPage()

  await openMenuOf('Personal')
  await userEvent.click(screen.getByRole('menuitem', { name: 'Rename' }))
  const dialog = await screen.findByRole('dialog', { name: 'Rename “Personal”' })
  const name = within(dialog).getByLabelText(/^Name/)
  await userEvent.clear(name)
  await userEvent.type(name, 'Home & family')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  const link = await screen.findByRole('link', { name: 'Home & family' })
  expect(link.getAttribute('href')).toBe('/home-family')
})

it('archives a space after asking, and always keeps one active', async () => {
  await seedSpace({ name: 'Work' })
  await openStartPage()

  await openMenuOf('Work')
  await userEvent.click(screen.getByRole('menuitem', { name: 'Archive' }))
  const dialog = await screen.findByRole('dialog', { name: 'Archive “Work”?' })
  expect(within(dialog).getByText(/its reminders stop\. Nothing is deleted/)).toBeTruthy()
  await userEvent.click(within(dialog).getByRole('button', { name: 'Archive' }))

  await waitFor(() => expect(screen.queryByRole('link', { name: 'Work' })).toBeNull())
  await openMenuOf('Personal')
  const archive = screen.getByRole('menuitem', { name: /^Archive/ })
  expect(archive.getAttribute('aria-disabled')).toBe('true')
  expect(archive.textContent).toContain('Your only active space')
})

it('an unknown or archived space leads to the start page', async () => {
  await seedSpace({ name: 'Old', isArchived: true })
  startFakeServer({ signedIn: true })
  const { router } = renderApp('/nope/today')

  expect(await screen.findByRole('heading', { name: 'Choose a space' })).toBeTruthy()
  await router.navigate('/old')
  await waitFor(() => expect(router.state.location.pathname).toBe('/'))
})
