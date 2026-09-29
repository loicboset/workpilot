import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Todo } from '@/db/types'
import { byPriority, type Priority } from '@/lib/priority'
import { useSpace } from './currentSpace'
import { deleteLocally, newSpaceRowFields, nowIso, saveLocally, updateLocally } from './localWrites'
import { activeRowsIn } from './spaceRows'

/**
 * Todos repository (ADR 0017, 0025): screens read and change todos only through here.
 * Reads come from Dexie and update live; writes are saved locally, then synced. Reads are of
 * one space: hooks take the page's space, plain functions its id (ADR 0031).
 * Each synced resource has a repository like this one in src/data.
 */

export type TodoFields = Pick<
  Todo,
  'title' | 'notes' | 'due_date' | 'priority' | 'completed_at' | 'milestone_id'
>

/**
 * The space's active todos, sorted like the API: dated first (soonest first), then undated;
 * within a day, by priority (none last), then oldest first.
 */
export async function listTodos(spaceId: string): Promise<Todo[]> {
  const todos = await activeRowsIn(db.todos, spaceId)
  return todos.sort(byDueDateThenCreation)
}

/** Live version of `listTodos` for the page's space. `undefined` while loading. */
export function useTodos(): Todo[] | undefined {
  const { id } = useSpace()
  return useLiveQuery(() => listTodos(id), [id])
}

export function addTodo(
  spaceId: string,
  fields: Pick<TodoFields, 'title'> & Partial<TodoFields>,
): Promise<Todo> {
  return saveLocally<Todo>('todos', {
    ...newSpaceRowFields(spaceId),
    notes: null,
    due_date: null,
    priority: null,
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
export const setTodoPriority = (id: string, priority: Priority | null) =>
  updateTodo(id, { priority })
export const deleteTodo = (id: string) => deleteLocally('todos', id)

// --- Icebox (ADR 0029): the todos without a date --------------------------------------------

export const moveToIcebox = (id: string) => updateTodo(id, { due_date: null })

/** The space's icebox, by priority then newest first: the open todos, and the done ones apart. */
export const listIcebox = async (spaceId: string): Promise<{ open: Todo[]; done: Todo[] }> => {
  const todos = (await activeRowsIn(db.todos, spaceId)).filter((todo) => todo.due_date === null)
  todos.sort(
    (a, b) => byPriority(a.priority, b.priority) || b.created_at.localeCompare(a.created_at),
  )
  return {
    open: todos.filter((todo) => todo.completed_at === null),
    done: todos.filter((todo) => todo.completed_at !== null),
  }
}

/** Live version of `listIcebox` for the page's space. `undefined` while loading. */
export const useIcebox = () => {
  const { id } = useSpace()
  return useLiveQuery(() => listIcebox(id), [id])
}

// ISO dates and timestamps sort correctly as plain strings.
function byDueDateThenCreation(a: Todo, b: Todo): number {
  if (a.due_date === b.due_date) {
    return byPriority(a.priority, b.priority) || a.created_at.localeCompare(b.created_at)
  }
  if (a.due_date === null) return 1
  if (b.due_date === null) return -1
  return a.due_date.localeCompare(b.due_date)
}
