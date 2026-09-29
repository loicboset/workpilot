import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { PriorityBadge } from '@/components/PriorityBadge'
import { Checkbox } from '@/components/ui/Checkbox'
import { completeTimeBlock, reopenTimeBlock } from '@/data/timeBlocks'
import { completeTodo, reopenTodo } from '@/data/todos'
import type { Milestone } from '@/db/types'
import { formatClock } from '@/lib/format'
import type { DayItem } from './dayTimeline'

type DayRowProps = {
  item: DayItem
  /** The next thing to do: it stands out, with its end time. */
  isFocus: boolean
  milestone: Milestone | undefined
  timeZone: string
}

/** A line of the day: its time, a dot on the timeline, tick it done. */
export const DayRow = ({ item, isFocus, milestone, timeZone }: DayRowProps) => {
  // HOOKS
  const { t, i18n } = useTranslation()

  // METHODS
  const setDone = (isDone: boolean) => {
    if (item.kind === 'block') void (isDone ? completeTimeBlock(item.id) : reopenTimeBlock(item.id))
    else void (isDone ? completeTodo(item.id) : reopenTodo(item.id))
  }

  // VARS
  const block = item.kind === 'block' ? item.block : null
  const priority = item.kind === 'todo' ? item.todo.priority : null

  return (
    <li className="flex items-center">
      <span className="w-16.75 shrink-0 text-[13px] text-grove-muted tabular-nums">
        {block && formatClock(block.start_at, i18n.language, timeZone, { twoDigitHour: true })}
      </span>
      <span
        aria-hidden
        className={twMerge(
          'size-2.5 shrink-0 rounded-full bg-grove-sage-soft',
          item.isDone && 'bg-grove-leaf',
          isFocus && 'border-2 border-grove-clay bg-grove-card',
        )}
      />
      <div
        className={twMerge(
          'ml-4.75 flex min-h-9.75 min-w-0 flex-1 items-center',
          isFocus && 'ml-3.75 min-h-14.5 rounded-control bg-grove-clay-soft py-3 pr-4 pl-4.5',
        )}
      >
        <Checkbox className="min-w-0 gap-3.5" isSelected={item.isDone} onChange={setDone}>
          <span className="flex min-w-0 flex-col">
            <span
              className={twMerge(
                'leading-5',
                milestone && 'text-grove-fern',
                item.isDone && 'text-grove-muted line-through',
                isFocus && 'leading-4.5 font-semibold text-grove-ink',
              )}
            >
              {item.title}
              {priority && (
                <PriorityBadge priority={priority} className="ml-1.5 align-text-bottom" />
              )}
              {milestone && (
                <span className="sr-only">
                  {' '}
                  ({t('home.today.linked', { milestone: milestone.title })})
                </span>
              )}
            </span>
            {isFocus && block && (
              <span className="text-[13px] leading-4 text-grove-clay-ink">
                {t('home.today.focus', {
                  time: formatClock(block.end_at, i18n.language, timeZone),
                })}
              </span>
            )}
          </span>
        </Checkbox>
      </div>
    </li>
  )
}
