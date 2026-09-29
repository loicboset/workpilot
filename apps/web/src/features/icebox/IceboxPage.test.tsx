import { today } from '@internationalized/date'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { addTodo, completeTodo } from '@/data/todos'
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
  vi.unstubAllGlobals()
})

it('holds the todos without a date; the done ones wait behind a button', async () => {
  await addTodo(space.id, { title: 'Redo the login', due_date: null })
  const done = await addTodo(space.id, { title: 'Remove sqlite', due_date: null })
  await completeTodo(done.id)
  await addTodo(space.id, { title: 'Call the editor', due_date: today('Europe/Zurich').toString() })
  startFakeServer({ signedIn: true })
  renderApp('/personal/icebox')

  expect(await screen.findByText('Redo the login')).toBeTruthy()
  expect(screen.queryByText('Call the editor')).toBeNull()
  expect(screen.queryByText('Remove sqlite')).toBeNull()

  await userEvent.click(screen.getByRole('button', { name: 'Show the done one' }))
  expect(screen.getByText('Remove sqlite')).toBeTruthy()
})

it('the field puts a todo in the icebox', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/personal/icebox')

  await userEvent.type(
    await screen.findByRole('textbox', { name: 'Add to the icebox' }),
    'Plan disaster recovery{Enter}',
  )

  await waitFor(async () => expect(await db.todos.count()).toBe(1))
  const [todo] = await db.todos.toArray()
  expect(todo).toMatchObject({ title: 'Plan disaster recovery', due_date: null })
})

it('❄️ moves a todo of the day to the icebox, and "Move to today" brings it back', async () => {
  const todo = await addTodo(space.id, {
    title: 'Call the editor',
    due_date: today('Europe/Zurich').toString(),
  })
  startFakeServer({ signedIn: true })
  const { router } = renderApp('/personal/today')

  await userEvent.click(await screen.findByRole('button', { name: 'More for “Call the editor”' }))
  await userEvent.click(screen.getByRole('menuitem', { name: 'Move to the icebox' }))
  await waitFor(async () => expect((await db.todos.get(todo.id))?.due_date).toBeNull())
  await waitFor(() => expect(screen.queryByText('Call the editor')).toBeNull())

  await router.navigate('/personal/icebox')
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
  await addTodo(space.id, {
    title: 'Vibe coder guide',
    due_date: null,
    notes: '- [ ] connect GitHub\n- [x] seeded users',
  })
  startFakeServer({ signedIn: true })
  renderApp('/personal/icebox')

  expect(await screen.findByText('1 of 2')).toBeTruthy()
})

it('a todo’s menu sets its priority, which puts it first', async () => {
  const todo = await addTodo(space.id, { title: 'Redo the login', due_date: null })
  await addTodo(space.id, { title: 'Plan the offsite', due_date: null }) // newer: first until then
  startFakeServer({ signedIn: true })
  renderApp('/personal/icebox')

  await userEvent.click(await screen.findByRole('button', { name: 'More for “Redo the login”' }))
  await userEvent.click(screen.getByRole('menuitem', { name: 'Priority' }))
  await userEvent.click(await screen.findByRole('menuitemradio', { name: 'High priority' }))

  await waitFor(async () => expect((await db.todos.get(todo.id))?.priority).toBe(1))
  await waitFor(() =>
    expect(screen.getAllByRole('listitem')[0].textContent).toMatch(/^Redo the login.*P1/),
  )
})
