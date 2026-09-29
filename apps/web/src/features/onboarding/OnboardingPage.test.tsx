import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { db } from '@/db/db'
import { startFakeServer } from '@/test/fakeServer'
import { renderApp } from '@/test/renderApp'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

it('a new user sets up a first space in four short steps, then lands in it', async () => {
  startFakeServer({ signedIn: true })
  const { router } = renderApp('/')

  expect(await screen.findByRole('heading', { name: 'Nice to meet you' })).toBeTruthy()
  await userEvent.type(screen.getByLabelText(/First name/), 'Ada')
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

  expect(await screen.findByRole('heading', { name: 'Your first space' })).toBeTruthy()
  expect(screen.getByText(/add other spaces later/)).toBeTruthy()
  await userEvent.type(screen.getByLabelText(/^Name/), 'Côté pro')
  await userEvent.click(screen.getByRole('radio', { name: 'Lake' }))
  expect(document.documentElement.dataset.palette).toBe('lake') // a preview, at once
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

  await userEvent.type(await screen.findByLabelText(/^North Star/), 'Ship WorkPilot 1.0')
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

  await userEvent.type(await screen.findByLabelText('Milestone 1'), 'Beta with ten users')
  await userEvent.click(screen.getByRole('button', { name: 'Plant my path' }))

  await waitFor(() => expect(router.state.location.pathname).toBe('/cote-pro'))
  expect(await screen.findByRole('heading', { name: 'Hi Ada,' })).toBeTruthy()
  expect((await db.profiles.toArray()).map((profile) => profile.first_name)).toEqual(['Ada'])
  const [space] = await db.spaces.toArray()
  expect(space).toMatchObject({ name: 'Côté pro', slug: 'cote-pro', palette: 'lake' })
  expect(await db.north_stars.toArray()).toMatchObject([
    { space_id: space?.id, title: 'Ship WorkPilot 1.0' },
  ])
  expect(await db.milestones.toArray()).toMatchObject([
    { space_id: space?.id, title: 'Beta with ten users' },
  ])
})

it('the space needs a name the app can use in its address', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/onboarding')

  await userEvent.type(await screen.findByLabelText(/First name/), 'Ada')
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
  const name = await screen.findByLabelText(/^Name/)

  await userEvent.type(name, 'Sign in')
  expect(screen.getByText('The app already uses this name. Pick another one.')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Continue' })).toHaveProperty('disabled', true)

  await userEvent.clear(name)
  await userEvent.type(name, '🚀')
  expect(screen.getByText('Use at least one letter or number.')).toBeTruthy()
})
