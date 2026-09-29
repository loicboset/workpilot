import { today } from '@internationalized/date'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { addTodo, completeTodo } from '@/data/todos'
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
})

it('holds the todos without a date; the done ones wait behind a button', async () => {
  await addTodo({ title: 'Redo the login', due_date: null })
  const done = await addTodo({ title: 'Remove sqlite', due_date: null })
  await completeTodo(done.id)
  await addTodo({ title: 'Call the editor', due_date: today('Europe/Zurich').toString() })
  startFakeServer({ signedIn: true })
  renderApp('/icebox')

  expect(await screen.findByText('Redo the login')).toBeTruthy()
  expect(screen.queryByText('Call the editor')).toBeNull()
  expect(screen.queryByText('Remove sqlite')).toBeNull()

  await userEvent.click(screen.getByRole('button', { name: 'Show the done one' }))
  expect(screen.getByText('Remove sqlite')).toBeTruthy()
})

it('the field puts a todo in the icebox', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/icebox')

  await userEvent.type(
    await screen.findByRole('textbox', { name: 'Add to the icebox' }),
    'Plan disaster recovery{Enter}',
  )

  await waitFor(async () => expect(await db.todos.count()).toBe(1))
  const [todo] = await db.todos.toArray()
  expect(todo).toMatchObject({ title: 'Plan disaster recovery', due_date: null })
})

it('❄️ moves a todo of the day to the icebox, and "Move to today" brings it back', async () => {
  const todo = await addTodo({
    title: 'Call the editor',
    due_date: today('Europe/Zurich').toString(),
  })
  startFakeServer({ signedIn: true })
  const { router } = renderApp('/today')

  await userEvent.click(await screen.findByRole('button', { name: 'More for “Call the editor”' }))
  await userEvent.click(screen.getByRole('menuitem', { name: 'Move to the icebox' }))
  await waitFor(async () => expect((await db.todos.get(todo.id))?.due_date).toBeNull())
  await waitFor(() => expect(screen.queryByText('Call the editor')).toBeNull())

  await router.navigate('/icebox')
  const menuButton = await screen.findByRole('button', { name: 'More for “Call the editor”' })
  await userEvent.click(menuButton)
  const menu = screen.getByRole('menu')
  expect(within(menu).queryByRole('menuitem', { name: 'Move to the icebox' })).toBeNull()
  await userEvent.click(within(menu).getByRole('menuitem', { name: 'Move to today' }))
  await waitFor(async () =>
    expect((await db.todos.get(todo.id))?.due_date).toBe(today('Europe/Zurich').toString()),
  )
})

it('shows how far a checklist in the notes has come', async () => {
  await addTodo({
    title: 'Vibe coder guide',
    due_date: null,
    notes: '- [ ] connect GitHub\n- [x] seeded users',
  })
  startFakeServer({ signedIn: true })
  renderApp('/icebox')

  expect(await screen.findByText('1 of 2')).toBeTruthy()
})
