import { today, type CalendarDate } from '@internationalized/date'
import { useTimeBlocksOn } from '@/data/timeBlocks'
import { useTodos } from '@/data/todos'
import type { TimeBlock, Todo } from '@/db/types'

export interface DayPlan {
  blocks: TimeBlock[]
  /** Todos due that day, done or not. */
  due: Todo[]
  /** Viewing today: open todos whose day has passed. */
  overdue: Todo[]
}

/**
 * What a day holds: its time blocks and todos. `undefined` while loading.
 * Todos without a date are in the icebox, not on a day (ADR 0029).
 */
export function useDayPlan(day: CalendarDate, timeZone: string): DayPlan | undefined {
  const blocks = useTimeBlocksOn(day, timeZone)
  const todos = useTodos()
  if (!blocks || !todos) return undefined

  const date = day.toString() // "2026-09-30": compares correctly as text
  const isToday = day.compare(today(timeZone)) === 0
  const isOpen = (todo: Todo) => todo.completed_at === null

  return {
    blocks,
    due: todos.filter((todo) => todo.due_date === date),
    overdue: isToday
      ? todos.filter((todo) => todo.due_date !== null && todo.due_date < date && isOpen(todo))
      : [],
  }
}
