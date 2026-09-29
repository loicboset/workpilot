import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import { newRowFields } from './localWrites'
import {
  addTodo,
  completeTodo,
  deleteTodo,
  listIcebox,
  listTodos,
  moveToIcebox,
  postponeTodo,
} from './todos'

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

  it('keeps the todos without a date in the icebox, newest first, the done ones apart', async () => {
    const written = (title: string, created_at: string, completed_at: string | null = null) =>
      db.todos.put({
        ...newRowFields(),
        created_at,
        title,
        notes: null,
        due_date: null,
        completed_at,
        milestone_id: null,
      })
    await written('older', '2026-09-01T09:00:00Z')
    await written('done', '2026-09-02T09:00:00Z', '2026-09-05T17:00:00Z')
    await written('newer', '2026-09-03T09:00:00Z')
    const dated = await addTodo({ title: 'dated', due_date: '2026-10-01' })
    await moveToIcebox(dated.id)

    const { open, done } = await listIcebox()

    expect(open.map((todo) => todo.title)).toEqual(['dated', 'newer', 'older'])
    expect(done.map((todo) => todo.title)).toEqual(['done'])
  })
})
