import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { db } from '@/db/db'
import { useCaptureBar } from '@/features/capture/captureStore'
import { startFakeServer } from '@/test/fakeServer'
import { renderApp, seedProfile } from '@/test/renderApp'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedProfile('Ada')
  useCaptureBar.setState({ isOpen: false }) // it's app-wide state
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const findCard = async () => {
  startFakeServer({ signedIn: true })
  renderApp('/')
  await screen.findByRole('heading', { name: /Ada/ })
  return screen.getByRole('region', { name: 'Capture' })
}

it('has no dropdown nor button: a command files the thought', async () => {
  const card = await findCard()
  expect(within(card).queryByRole('button')).toBeNull()

  const field = within(card).getByRole('textbox', { name: 'Capture a thought' })
  await userEvent.type(field, '/no')
  await userEvent.keyboard('{Enter}') // picks /note in the menu
  await userEvent.type(field, 'The editor prefers mornings{Shift>}{Enter}{/Shift}Call before noon')
  await userEvent.keyboard('{Enter}')

  await waitFor(async () => expect(await db.notes.count()).toBe(1))
  const [note] = await db.notes.toArray()
  expect(note.content).toBe('The editor prefers mornings\nCall before noon')
  expect(await within(card).findByText(/Saved: Note/)).toBeTruthy()
  expect(field).toHaveProperty('value', '')
})

it('files plain text as an idea', async () => {
  const card = await findCard()

  const field = within(card).getByRole('textbox', { name: 'Capture a thought' })
  await userEvent.type(field, 'Automate the weekly report{Enter}')

  await waitFor(async () => expect(await db.ideas.count()).toBe(1))
  const [idea] = await db.ideas.toArray()
  expect(idea.text).toBe('Automate the weekly report')
})
