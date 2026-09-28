import { beforeEach, describe, expect, it } from 'vitest'
import { addTodo, updateTodo } from '@/data/todos'
import { db } from '@/db/db'
import type { Todo } from '@/db/types'
import { fakeSyncApi } from '@/test/fakeSyncApi'
import { CURSOR_KEY, syncOnce } from './engine'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

function serverTodo(title: string): Todo {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title,
    notes: null,
    due_date: null,
    completed_at: null,
    milestone_id: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }
}

describe('push', () => {
  it('sends queued rows and clears the outbox', async () => {
    const todo = await addTodo({ title: 'Written offline' })
    const { api, pushed } = fakeSyncApi()

    await syncOnce(api)

    expect(pushed).toEqual([[{ table: 'todos', row: todo }]])
    expect(await db.outbox.count()).toBe(0)
  })

  it('keeps a copy of a version the server did not keep', async () => {
    const todo = await addTodo({ title: 'Mine' })
    const { api } = fakeSyncApi({
      pushResult: () => ({ applied: [], skipped: [todo.id], rejected: [] }),
    })

    await syncOnce(api)

    const [conflict] = await db.conflicts.toArray()
    expect(conflict).toMatchObject({ table: 'todos', id: todo.id, reason: 'newer_on_server' })
    expect(conflict?.row).toEqual(todo)
    expect(await db.outbox.count()).toBe(0)
  })

  it('keeps a row queued when it was edited again during the push', async () => {
    const todo = await addTodo({ title: 'First' })
    const { api } = fakeSyncApi({
      pushResult: async (changes) => {
        await updateTodo(todo.id, { title: 'Second' }) // the user types while syncing
        return { applied: changes.map((change) => change.row.id), skipped: [], rejected: [] }
      },
    })

    await syncOnce(api)

    expect(await db.outbox.count()).toBe(1)
  })
})

describe('pull', () => {
  it('saves pulled rows and pages until caught up', async () => {
    const first = serverTodo('From the phone')
    const second = serverTodo('Also from the phone')
    const { api } = fakeSyncApi({
      pages: [
        { changes: [{ table: 'todos', row: first }], cursor: 1, has_more: true },
        { changes: [{ table: 'todos', row: second }], cursor: 2, has_more: false },
      ],
    })

    await syncOnce(api)

    expect(await db.todos.count()).toBe(2)
    expect((await db.meta.get(CURSOR_KEY))?.value).toBe(2)
    expect(api.pull).toHaveBeenLastCalledWith(1)
  })

  it('never overwrites a row with a local edit waiting to be pushed', async () => {
    const local = await addTodo({ title: 'Local edit' })
    const olderServerCopy: Todo = { ...local, title: 'Older server copy' }
    const { api } = fakeSyncApi({
      pushResult: async () => {
        await updateTodo(local.id, { title: 'Edited during sync' })
        return { applied: [local.id], skipped: [], rejected: [] }
      },
      pages: [{ changes: [{ table: 'todos', row: olderServerCopy }], cursor: 5, has_more: false }],
    })

    await syncOnce(api)

    expect((await db.todos.get(local.id))?.title).toBe('Edited during sync')
  })

  it('ignores tables this version of the app does not know', async () => {
    const { api } = fakeSyncApi({
      pages: [
        { changes: [{ table: 'future_table', row: serverTodo('x') }], cursor: 3, has_more: false },
      ],
    })

    await syncOnce(api)

    expect((await db.meta.get(CURSOR_KEY))?.value).toBe(3)
  })
})
