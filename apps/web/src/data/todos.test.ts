import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import { newSpaceRowFields } from './localWrites'
import {
  addTodo,
  completeTodo,
  deleteTodo,
  listIcebox,
  listTodos,
  moveToIcebox,
  postponeTodo,
  setTodoPriority,
} from './todos'

const SPACE = 'space-personal'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('todos repository', () => {
  it('saves a new todo locally and queues it for sync', async () => {
    const todo = await addTodo(SPACE, { title: '  Call Marc  ' })

    expect(todo.title).toBe('Call Marc')
    expect(await db.todos.get(todo.id)).toEqual(todo)
    expect(await db.outbox.get(['todos', todo.id])).toBeDefined()
  })

  it('lists dated todos first, soonest first, then undated', async () => {
    await addTodo(SPACE, { title: 'undated' })
    await addTodo(SPACE, { title: 'late', due_date: '2026-10-05' })
    await addTodo(SPACE, { title: 'early', due_date: '2026-10-01' })

    const titles = (await listTodos(SPACE)).map((todo) => todo.title)

    expect(titles).toEqual(['early', 'late', 'undated'])
  })

  it('lists a day by priority, the todos without one last', async () => {
    await db.todos.put({
      ...newSpaceRowFields(SPACE),
      created_at: '2026-09-01T09:00:00Z', // before the other todo without a priority
      title: 'saved before priorities',
      notes: null,
      due_date: '2026-10-01',
      completed_at: null,
      milestone_id: null,
    })
    await addTodo(SPACE, { title: 'none', due_date: '2026-10-01' })
    await addTodo(SPACE, { title: 'low', due_date: '2026-10-01', priority: 3 })
    await addTodo(SPACE, { title: 'high', due_date: '2026-10-01', priority: 1 })
    const medium = await addTodo(SPACE, { title: 'medium', due_date: '2026-10-01' })
    await setTodoPriority(medium.id, 2)

    const titles = (await listTodos(SPACE)).map((todo) => todo.title)

    expect(titles).toEqual(['high', 'medium', 'low', 'saved before priorities', 'none'])
  })

  it('completes, postpones and soft-deletes', async () => {
    const todo = await addTodo(SPACE, { title: 'Draft', due_date: '2026-10-01' })

    expect((await completeTodo(todo.id)).completed_at).not.toBeNull()
    expect((await postponeTodo(todo.id, '2026-10-03')).due_date).toBe('2026-10-03')

    await deleteTodo(todo.id)
    expect(await listTodos(SPACE)).toEqual([])
    expect((await db.todos.get(todo.id))?.deleted_at).not.toBeNull() // kept, so it syncs
  })

  it('keeps the todos without a date in the icebox, newest first, the done ones apart', async () => {
    const written = (title: string, created_at: string, completed_at: string | null = null) =>
      db.todos.put({
        ...newSpaceRowFields(SPACE),
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
    const dated = await addTodo(SPACE, { title: 'dated', due_date: '2026-10-01' })
    await moveToIcebox(dated.id)

    const { open, done } = await listIcebox(SPACE)

    expect(open.map((todo) => todo.title)).toEqual(['dated', 'newer', 'older'])
    expect(done.map((todo) => todo.title)).toEqual(['done'])
  })

  it('puts the icebox todos with a priority first', async () => {
    await addTodo(SPACE, { title: 'important', priority: 1 })
    await addTodo(SPACE, { title: 'newest' })

    const { open } = await listIcebox(SPACE)

    expect(open.map((todo) => todo.title)).toEqual(['important', 'newest'])
  })

  it('lists only the todos of the space asked for', async () => {
    await addTodo(SPACE, { title: 'Call mum' })
    await addTodo('space-work', { title: 'Ship the release' })

    expect((await listTodos(SPACE)).map((todo) => todo.title)).toEqual(['Call mum'])
    expect((await listIcebox('space-work')).open.map((todo) => todo.title)).toEqual([
      'Ship the release',
    ])
  })
})
