import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Todo } from '@/db/types'
import { deleteLocally, newRowFields, nowIso, saveLocally, updateLocally } from './localWrites'

/**
 * Todos repository (ADR 0017, 0025): screens read and change todos only through here.
 * Reads come from Dexie and update live; writes are saved locally, then synced.
 * Each synced resource has a repository like this one in src/data.
 */

export type TodoFields = Pick<
  Todo,
  'title' | 'notes' | 'due_date' | 'completed_at' | 'milestone_id'
>

/** Active todos, sorted like the API: dated first (soonest first), then undated, oldest first. */
export async function listTodos(): Promise<Todo[]> {
  const todos = await db.todos.filter((todo) => todo.deleted_at === null).toArray()
  return todos.sort(byDueDateThenCreation)
}

/** Live version of `listTodos` for React components. `undefined` while loading. */
export function useTodos(): Todo[] | undefined {
  return useLiveQuery(listTodos)
}

export function addTodo(fields: Pick<TodoFields, 'title'> & Partial<TodoFields>): Promise<Todo> {
  return saveLocally<Todo>('todos', {
    ...newRowFields(),
    notes: null,
    due_date: null,
    completed_at: null,
    milestone_id: null,
    ...fields,
    title: fields.title.trim(),
  })
}

export function updateTodo(id: string, changes: Partial<TodoFields>): Promise<Todo> {
  return updateLocally<Todo>('todos', id, changes)
}

export const completeTodo = (id: string) => updateTodo(id, { completed_at: nowIso() })
export const reopenTodo = (id: string) => updateTodo(id, { completed_at: null })
export const postponeTodo = (id: string, dueDate: string) => updateTodo(id, { due_date: dueDate })
export const deleteTodo = (id: string) => deleteLocally('todos', id)

// ISO dates and timestamps sort correctly as plain strings.
function byDueDateThenCreation(a: Todo, b: Todo): number {
  if (a.due_date === b.due_date) return a.created_at.localeCompare(b.created_at)
  if (a.due_date === null) return 1
  if (b.due_date === null) return -1
  return a.due_date.localeCompare(b.due_date)
}
