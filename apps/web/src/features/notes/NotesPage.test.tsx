import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { addIdea } from '@/data/ideas'
import { addNote } from '@/data/notes'
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

it('shows the ideas and the notes, and adds an idea', async () => {
  await addIdea('Automate the weekly report')
  await addNote('Released: email-less users', 'Product meeting')
  startFakeServer({ signedIn: true })
  renderApp('/notes')

  const ideas = await screen.findByRole('region', { name: 'Ideas' })
  expect(await within(ideas).findByText('Automate the weekly report')).toBeTruthy()
  const notes = screen.getByRole('region', { name: 'Notes' })
  expect(await within(notes).findByText('Product meeting')).toBeTruthy()
  expect(within(notes).getByText('Released: email-less users')).toBeTruthy()

  await userEvent.type(
    within(ideas).getByRole('textbox', { name: 'Add an idea' }),
    'Try PostHog{Enter}',
  )
  expect(await within(ideas).findByText('Try PostHog')).toBeTruthy()
})

it('moves an idea to the icebox as a todo', async () => {
  const idea = await addIdea('Pause a tool')
  startFakeServer({ signedIn: true })
  renderApp('/notes')

  await userEvent.click(await screen.findByRole('button', { name: 'More for “Pause a tool”' }))
  await userEvent.click(screen.getByRole('menuitem', { name: 'Move to the icebox' }))

  await waitFor(async () => expect(await db.todos.count()).toBe(1))
  const [todo] = await db.todos.toArray()
  expect(todo).toMatchObject({ title: 'Pause a tool', due_date: null })
  expect((await db.ideas.get(idea.id))?.deleted_at).not.toBeNull()
})

it('writes a new note and changes it', async () => {
  startFakeServer({ signedIn: true })
  renderApp('/notes')

  await userEvent.click(await screen.findByRole('button', { name: 'New note' }))
  const dialog = screen.getByRole('dialog', { name: 'New note' })
  await userEvent.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'Launch')
  await userEvent.type(
    within(dialog).getByRole('textbox', { name: /^Note/ }),
    'What are we promising?',
  )
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
  await waitFor(async () => expect(await db.notes.count()).toBe(1))

  await userEvent.click(await screen.findByRole('button', { name: 'More for “Launch”' }))
  await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
  const edit = screen.getByRole('dialog', { name: 'Change the note' })
  const title = within(edit).getByRole('textbox', { name: 'Title' })
  await userEvent.clear(title)
  await userEvent.click(within(edit).getByRole('button', { name: 'Save' }))

  await waitFor(async () => {
    const [note] = await db.notes.toArray()
    expect(note).toMatchObject({ title: null, content: 'What are we promising?' })
  })
})
