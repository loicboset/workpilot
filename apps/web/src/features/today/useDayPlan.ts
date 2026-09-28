import { today, type CalendarDate } from '@internationalized/date'
import { useTimeBlocksOn } from '@/data/timeBlocks'
import { useTodos } from '@/data/todos'
import type { TimeBlock, Todo } from '@/db/types'
import { dayBounds, isBetween } from '@/lib/dates'

export interface DayPlan {
  blocks: TimeBlock[]
  /** Todos due that day, done or not. */
  due: Todo[]
  /** Viewing today: open todos whose day has passed. */
  overdue: Todo[]
  /** Viewing today: todos without a date that are open, or were done today. */
  someday: Todo[]
}

/** What a day holds: its time blocks and todos. `undefined` while loading. */
export function useDayPlan(day: CalendarDate, timeZone: string): DayPlan | undefined {
  const blocks = useTimeBlocksOn(day, timeZone)
  const todos = useTodos()
  if (!blocks || !todos) return undefined

  const date = day.toString() // "2026-09-30": compares correctly as text
  const isToday = day.compare(today(timeZone)) === 0
  const todayBounds = dayBounds(day, timeZone)
  const isOpen = (todo: Todo) => todo.completed_at === null
  const doneToday = (todo: Todo) =>
    todo.completed_at !== null && isBetween(todo.completed_at, todayBounds)

  return {
    blocks,
    due: todos.filter((todo) => todo.due_date === date),
    overdue: isToday
      ? todos.filter((todo) => todo.due_date !== null && todo.due_date < date && isOpen(todo))
      : [],
    someday: isToday
      ? todos.filter((todo) => todo.due_date === null && (isOpen(todo) || doneToday(todo)))
      : [],
  }
}
