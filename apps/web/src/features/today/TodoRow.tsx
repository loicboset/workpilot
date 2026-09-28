import { parseDate, startOfWeek, today, type CalendarDate } from '@internationalized/date'
import {
  CalendarArrowUp,
  CalendarDays,
  CalendarX2,
  MoreHorizontal,
  Sunrise,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { MenuTrigger } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Calendar } from '@/components/ui/Calendar'
import { Checkbox } from '@/components/ui/Checkbox'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { Dialog, DialogTitle, Modal } from '@/components/ui/Modal'
import { completeTodo, deleteTodo, reopenTodo, updateTodo } from '@/data/todos'
import type { Milestone, Todo } from '@/db/types'
import { dayLabel } from '@/lib/format'
import { MilestoneSubmenu } from './MilestoneMenu'

interface TodoRowProps {
  todo: Todo
  milestones: Milestone[]
  timeZone: string
  /** Show the due day, e.g. for overdue todos. */
  showDue?: boolean
}

/** A todo: tick it done, postpone it, link it to a milestone, or delete it. */
export function TodoRow({ todo, milestones, timeZone, showDue = false }: TodoRowProps) {
  const { t, i18n } = useTranslation()
  const [isPickingDay, setPickingDay] = useState(false)
  const isDone = todo.completed_at !== null
  const milestone = milestones.find((m) => m.id === todo.milestone_id)
  const due = todo.due_date ? parseDate(todo.due_date) : null
  const isOverdue = due !== null && !isDone && due.compare(today(timeZone)) < 0

  const moveTo = (day: CalendarDate | null) =>
    updateTodo(todo.id, { due_date: day?.toString() ?? null })

  function onAction(action: string) {
    const todayDate = today(timeZone)
    if (action === 'tomorrow') void moveTo(todayDate.add({ days: 1 }))
    if (action === 'nextWeek') void moveTo(startOfWeek(todayDate.add({ weeks: 1 }), 'en-GB')) // a Monday
    if (action === 'pickDay') setPickingDay(true)
    if (action === 'noDate') void moveTo(null)
    if (action === 'delete') void deleteTodo(todo.id)
  }

  return (
    <li className="group flex items-start gap-2 py-2">
      <Checkbox
        className="flex-1 items-start pt-0.5"
        isSelected={isDone}
        onChange={(done) => void (done ? completeTodo(todo.id) : reopenTodo(todo.id))}
      >
        <span className="flex flex-col gap-0.5">
          <span className={isDone ? 'text-grove-muted line-through' : undefined}>{todo.title}</span>
          {(milestone || (showDue && due)) && (
            <span className="flex flex-wrap gap-2 text-xs">
              {showDue && due && (
                <span className={isOverdue ? 'text-grove-clay' : 'text-grove-muted'}>
                  {dayLabel(due, t, i18n.language, timeZone)}
                </span>
              )}
              {milestone && <span className="text-grove-moss">⚑ {milestone.title}</span>}
            </span>
          )}
        </span>
      </Checkbox>

      <MenuTrigger>
        <IconButton size="sm" aria-label={t('today.moreFor', { title: todo.title })}>
          <MoreHorizontal />
        </IconButton>
        <Menu onAction={(key) => onAction(String(key))}>
          <MenuItem id="tomorrow">
            <Sunrise aria-hidden />
            {t('today.moveTomorrow')}
          </MenuItem>
          <MenuItem id="nextWeek">
            <CalendarArrowUp aria-hidden />
            {t('today.moveNextWeek')}
          </MenuItem>
          <MenuItem id="pickDay">
            <CalendarDays aria-hidden />
            {t('today.pickDay')}
          </MenuItem>
          {due && (
            <MenuItem id="noDate">
              <CalendarX2 aria-hidden />
              {t('today.noDate')}
            </MenuItem>
          )}
          <MilestoneSubmenu
            milestones={milestones}
            selectedId={todo.milestone_id}
            onSelect={(milestoneId) => void updateTodo(todo.id, { milestone_id: milestoneId })}
          />
          <MenuItem id="delete" isDanger>
            <Trash2 aria-hidden />
            {t('common.delete')}
          </MenuItem>
        </Menu>
      </MenuTrigger>

      <Modal isOpen={isPickingDay} onOpenChange={setPickingDay} className="max-w-sm">
        <Dialog>
          <DialogTitle>{t('today.pickDayFor', { title: todo.title })}</DialogTitle>
          <Calendar
            aria-label={t('today.pickDay')}
            defaultValue={due ?? today(timeZone)}
            onChange={(day) => {
              void moveTo(day)
              setPickingDay(false)
            }}
          />
        </Dialog>
      </Modal>
    </li>
  )
}
