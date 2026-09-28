import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import { addTodo, completeTodo, deleteTodo, listTodos, postponeTodo } from './todos'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('todos repository', () => {
  it('saves a new todo locally and queues it for sync', async () => {
    const todo = await addTodo({ title: '  Call Marc  ' })

    expect(todo.title).toBe('Call Marc')
    expect(await db.todos.get(todo.id)).toEqual(todo)
    expect(await db.outbox.get(['todos', todo.id])).toBeDefined()
  })

  it('lists dated todos first, soonest first, then undated', async () => {
    await addTodo({ title: 'undated' })
    await addTodo({ title: 'late', due_date: '2026-10-05' })
    await addTodo({ title: 'early', due_date: '2026-10-01' })

    const titles = (await listTodos()).map((todo) => todo.title)

    expect(titles).toEqual(['early', 'late', 'undated'])
  })

  it('completes, postpones and soft-deletes', async () => {
    const todo = await addTodo({ title: 'Draft', due_date: '2026-10-01' })

    expect((await completeTodo(todo.id)).completed_at).not.toBeNull()
    expect((await postponeTodo(todo.id, '2026-10-03')).due_date).toBe('2026-10-03')

    await deleteTodo(todo.id)
    expect(await listTodos()).toEqual([])
    expect((await db.todos.get(todo.id))?.deleted_at).not.toBeNull() // kept, so it syncs
  })
})
