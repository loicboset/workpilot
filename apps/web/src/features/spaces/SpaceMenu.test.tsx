import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { addTodo } from '@/data/todos'
import { db } from '@/db/db'
import type { Space } from '@/db/types'
import { useCaptureBar } from '@/features/capture/captureStore'
import { startFakeServer } from '@/test/fakeServer'
import { renderApp, seedProfile, seedSpace } from '@/test/renderApp'

let personal: Space
let work: Space

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedProfile('Ada')
  personal = await seedSpace()
  work = await seedSpace({ name: 'Work', palette: 'lake', northStar: 'Ship WorkPilot 1.0' })
  await seedSpace({ name: 'Old', isArchived: true })
  useCaptureBar.setState({ isOpen: false }) // it's app-wide state
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

it('switches to another space on the same page, or goes to all spaces', async () => {
  startFakeServer({ signedIn: true })
  const { router } = renderApp('/personal/today')

  await userEvent.click(await screen.findByRole('button', { name: 'Space: Personal' }))
  const menu = screen.getByRole('menu')
  expect(
    within(menu)
      .getAllByRole('menuitem')
      .map((item) => item.textContent),
  ).toEqual([
    'PPersonal(this one)',
    'WWork',
    'All spaces', // no archived space
  ])
  await userEvent.click(within(menu).getByRole('menuitem', { name: /Work/ }))

  await waitFor(() => expect(router.state.location.pathname).toBe('/work/today'))
  await waitFor(() => expect(document.documentElement.dataset.palette).toBe('lake'))
  expect(await screen.findByRole('button', { name: 'Space: Work' })).toBeTruthy()

  await userEvent.click(screen.getByRole('button', { name: 'Space: Work' }))
  await userEvent.click(screen.getByRole('menuitem', { name: 'All spaces' }))
  expect(await screen.findByRole('heading', { name: 'Choose a space' })).toBeTruthy()
})

it('shows each space only its own things', async () => {
  await addTodo(personal.id, { title: 'Call mum', due_date: null })
  await addTodo(work.id, { title: 'Plan the release', due_date: null })
  startFakeServer({ signedIn: true })
  const { router } = renderApp('/work/icebox')

  expect(await screen.findByText('Plan the release')).toBeTruthy()
  expect(screen.queryByText('Call mum')).toBeNull()

  await router.navigate('/personal/icebox')
  expect(await screen.findByText('Call mum')).toBeTruthy()
  expect(screen.queryByText('Plan the release')).toBeNull()
})

it("captures into the page's space", async () => {
  startFakeServer({ signedIn: true })
  renderApp('/work')

  const card = await screen.findByRole('region', { name: 'Capture' })
  await userEvent.type(
    within(card).getByRole('textbox', { name: 'Capture a thought' }),
    'Automate the weekly report{Enter}',
  )

  await waitFor(async () => expect(await db.ideas.count()).toBe(1))
  expect((await db.ideas.toArray())[0]).toMatchObject({ space_id: work.id })
})

it("the logo and a page's arrow lead back to the space's homepage", async () => {
  startFakeServer({ signedIn: true })
  const { router } = renderApp('/work/icebox')

  await userEvent.click(await screen.findByRole('link', { name: 'Back to home' }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/work'))

  await router.navigate('/work/settings')
  await userEvent.click(await screen.findByRole('link', { name: /WorkPilot/ }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/work'))
})
