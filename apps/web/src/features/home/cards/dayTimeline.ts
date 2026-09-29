import type { TimeBlock, Todo } from '@/db/types'

/** One line of the Today card: a time block (with its hours) or a todo. */
export type DayItem =
  | {
      kind: 'block'
      id: string
      title: string
      isDone: boolean
      milestoneId: string | null
      block: TimeBlock
    }
  | {
      kind: 'todo'
      id: string
      title: string
      isDone: boolean
      milestoneId: string | null
      todo: Todo
    }

/** Planned hours up to which a day still feels light. */
const LIGHT_DAY_HOURS = 5

/** The day in order: time blocks by their start, then the todos. */
export const dayItems = (blocks: TimeBlock[], todos: Todo[]): DayItem[] => [
  ...blocks.map((block): DayItem => ({
    kind: 'block',
    id: block.id,
    title: block.title,
    isDone: block.completed_at !== null,
    milestoneId: block.milestone_id,
    block,
  })),
  ...todos.map((todo): DayItem => ({
    kind: 'todo',
    id: todo.id,
    title: todo.title,
    isDone: todo.completed_at !== null,
    milestoneId: todo.milestone_id,
    todo,
  })),
]

/** What to do next: the first thing not done yet, whatever the time (no guilt for the late ones). */
export const focusItem = (items: DayItem[]): DayItem | undefined =>
  items.find((item) => !item.isDone)

/** "free" with nothing planned, "light" up to five hours of blocks, "full" beyond. */
export const dayLoad = (blocks: TimeBlock[], todos: Todo[]): 'free' | 'light' | 'full' => {
  if (blocks.length === 0 && todos.length === 0) return 'free'
  const hours =
    blocks.reduce((sum, block) => sum + Date.parse(block.end_at) - Date.parse(block.start_at), 0) /
    3_600_000
  return hours <= LIGHT_DAY_HOURS ? 'light' : 'full'
}
