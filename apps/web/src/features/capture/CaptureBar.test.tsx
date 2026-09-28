import { today } from '@internationalized/date'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { db } from '@/db/db'
import { startFakeServer } from '@/test/fakeServer'
import { renderApp, seedProfile } from '@/test/renderApp'
import { useCaptureBar } from './captureStore'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedProfile('Ada')
  useCaptureBar.setState({ isOpen: false }) // it's app-wide state
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('Ctrl+K opens the capture bar, which shows what it understood and saves it', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/')
  await screen.findByRole('heading', { name: /Ada/ })

  await userEvent.keyboard('{Control>}k{/Control}')
  const input = await screen.findByRole('textbox', { name: 'Capture' })
  await userEvent.type(input, '/todo Call the editor tomorrow')

  expect(screen.getByText('due Tomorrow', { exact: false })).toBeTruthy()
  await userEvent.keyboard('{Enter}')

  await waitFor(async () => expect(await db.todos.count()).toBe(1))
  const [todo] = await db.todos.toArray()
  expect(todo.title).toBe('Call the editor')
  expect(todo.due_date).toBe(today('Europe/Zurich').add({ days: 1 }).toString())
  expect(await screen.findByText(/Saved: Todo/)).toBeTruthy()
})

it('Tab completes a command', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/')
  await screen.findByRole('heading', { name: /Ada/ })

  await userEvent.keyboard('{Control>}k{/Control}')
  const input = await screen.findByRole('textbox', { name: 'Capture' })
  await userEvent.type(input, '/bl')
  await userEvent.keyboard('{Tab}')

  expect((input as HTMLInputElement).value).toBe('/block ')
})

it('Esc closes the capture bar, even while typing', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/')
  await screen.findByRole('heading', { name: /Ada/ })

  await userEvent.keyboard('{Control>}k{/Control}')
  await userEvent.type(await screen.findByRole('textbox', { name: 'Capture' }), '/todo half a th')
  await userEvent.keyboard('{Escape}')

  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
})
