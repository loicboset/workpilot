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
})

it('a new user goes through three short steps, then lands on the homepage', async () => {
  startFakeServer({ signedIn: true })
  const { router } = renderApp('/')

  expect(await screen.findByRole('heading', { name: 'Nice to meet you' })).toBeTruthy()
  await userEvent.type(screen.getByLabelText(/First name/), 'Ada')
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

  await userEvent.type(await screen.findByLabelText(/^North Star/), 'Finish my first novel')
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

  await userEvent.type(await screen.findByLabelText('Milestone 1'), 'First draft done')
  await userEvent.click(screen.getByRole('button', { name: 'Plant my path' }))

  await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  expect(await screen.findByRole('heading', { name: 'Hi Ada,' })).toBeTruthy()
  expect((await db.profiles.toArray()).map((profile) => profile.first_name)).toEqual(['Ada'])
  expect((await db.north_stars.toArray()).map((star) => star.title)).toEqual([
    'Finish my first novel',
  ])
  expect((await db.milestones.toArray()).map((milestone) => milestone.title)).toEqual([
    'First draft done',
  ])
})
