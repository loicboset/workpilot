import { today } from '@internationalized/date'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { db } from '@/db/db'
import { startFakeServer } from '@/test/fakeServer'
import { renderApp, seedProfile, seedSpace } from '@/test/renderApp'
import { useCaptureBar } from './captureStore'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedProfile('Ada')
  await seedSpace()
  useCaptureBar.setState({ isOpen: false }) // it's app-wide state
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('Ctrl+K opens the capture bar, which shows what it understood and saves it', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/personal')
  await screen.findByRole('heading', { name: /Ada/ })

  await userEvent.keyboard('{Control>}k{/Control}')
  const input = await screen.findByRole('textbox', { name: 'Capture' })
  await userEvent.type(input, '/todo Call the editor tomorrow')

  expect(screen.getByText('due tomorrow', { exact: false })).toBeTruthy()
  await userEvent.keyboard('{Enter}')

  await waitFor(async () => expect(await db.todos.count()).toBe(1))
  const [todo] = await db.todos.toArray()
  expect(todo.title).toBe('Call the editor')
  expect(todo.due_date).toBe(today('Europe/Zurich').add({ days: 1 }).toString())
  expect(await screen.findByText(/Saved: Todo/)).toBeTruthy()
})

it('/ opens the command menu: arrows choose, Enter picks, and the menu closes', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/personal')
  await screen.findByRole('heading', { name: /Ada/ })

  await userEvent.keyboard('{Control>}k{/Control}')
  const input = await screen.findByRole('textbox', { name: 'Capture' })
  await userEvent.type(input, '/')

  const menu = screen.getByRole('listbox', { name: 'Commands' })
  const options = within(menu).getAllByRole('option')
  expect(options.map((option) => option.textContent)).toEqual([
    expect.stringMatching(/^\/todo/),
    expect.stringMatching(/^\/block/),
    expect.stringMatching(/^\/idea/),
    expect.stringMatching(/^\/note/),
    expect.stringMatching(/^\/icebox/),
  ])
  expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id)

  await userEvent.keyboard('{ArrowDown}{ArrowDown}')
  expect(input.getAttribute('aria-activedescendant')).toBe(options[2].id)
  await userEvent.keyboard('{Enter}')

  expect(input).toHaveProperty('value', '/idea ')
  expect(screen.queryByRole('listbox')).toBeNull()
  expect(await db.ideas.count()).toBe(0) // Enter picked the command, it saved nothing
})

it('the menu narrows as you type; Tab or a click picks a command', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/personal')
  await screen.findByRole('heading', { name: /Ada/ })

  await userEvent.keyboard('{Control>}k{/Control}')
  const input = await screen.findByRole('textbox', { name: 'Capture' })
  await userEvent.type(input, '/bl')
  expect(screen.getAllByRole('option')).toHaveLength(1)
  await userEvent.keyboard('{Tab}')
  expect(input).toHaveProperty('value', '/block ')

  await userEvent.clear(input)
  await userEvent.type(input, '/')
  await userEvent.click(screen.getAllByRole('option')[3])
  expect(input).toHaveProperty('value', '/note ')
  expect(document.activeElement).toBe(input)
})

it('Esc closes the command menu first, then the capture bar', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/personal')
  await screen.findByRole('heading', { name: /Ada/ })

  await userEvent.keyboard('{Control>}k{/Control}')
  await userEvent.type(await screen.findByRole('textbox', { name: 'Capture' }), '/to')
  await userEvent.keyboard('{Escape}')

  expect(screen.queryByRole('listbox')).toBeNull()
  expect(screen.getByRole('dialog')).toBeTruthy()
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
})

it('Esc closes the capture bar, even while typing', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/personal')
  await screen.findByRole('heading', { name: /Ada/ })

  await userEvent.keyboard('{Control>}k{/Control}')
  await userEvent.type(await screen.findByRole('textbox', { name: 'Capture' }), '/todo half a th')
  await userEvent.keyboard('{Escape}')

  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
})

it('in a todo, ! opens the priorities, and the preview’s priority can be pressed', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/personal')
  await screen.findByRole('heading', { name: /Ada/ })

  await userEvent.keyboard('{Control>}k{/Control}')
  const input = await screen.findByRole('textbox', { name: 'Capture' })
  await userEvent.type(input, '/todo Call the editor !')

  const menu = screen.getByRole('listbox', { name: 'Priorities' })
  expect(
    within(menu)
      .getAllByRole('option')
      .map((option) => option.textContent),
  ).toEqual(['!1High priority', '!2Medium priority', '!3Low priority'])
  await userEvent.keyboard('{ArrowDown}{Enter}')
  expect(input).toHaveProperty('value', '/todo Call the editor !2 ')
  expect(screen.queryByRole('listbox')).toBeNull()

  await userEvent.click(screen.getByRole('button', { name: 'Medium priority. Press to change it' }))
  expect(input).toHaveProperty('value', '/todo Call the editor !3 ')
  expect(document.activeElement).toBe(input)
  await userEvent.keyboard('{Enter}')

  await waitFor(async () => expect(await db.todos.count()).toBe(1))
  const [todo] = await db.todos.toArray()
  expect(todo).toMatchObject({ title: 'Call the editor', priority: 3 })
})

it('a typed priority saves on Enter, without a menu in the way', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/personal')
  await screen.findByRole('heading', { name: /Ada/ })

  await userEvent.keyboard('{Control>}k{/Control}')
  await userEvent.type(
    await screen.findByRole('textbox', { name: 'Capture' }),
    '/icebox Redo it !1',
  )
  expect(screen.queryByRole('listbox')).toBeNull()
  await userEvent.keyboard('{Enter}')

  await waitFor(async () => expect(await db.todos.count()).toBe(1))
  const [todo] = await db.todos.toArray()
  expect(todo).toMatchObject({ title: 'Redo it', due_date: null, priority: 1 })
})
