import { parseDate, today, type CalendarDate } from '@internationalized/date'
import { ChevronLeft, ChevronRight, Clock3, ListTodo, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/IconButton'
import { Spinner } from '@/components/ui/Spinner'
import { TextField } from '@/components/ui/TextField'
import { useMilestones } from '@/data/direction'
import { useTimeZone } from '@/data/profile'
import { addTodo } from '@/data/todos'
import type { Milestone, Todo } from '@/db/types'
import { dayLabel, formatDay } from '@/lib/format'
import { TimeBlockForm } from './TimeBlockForm'
import { TimeBlockRow } from './TimeBlockRow'
import { TodoRow } from './TodoRow'
import { useDayPlan } from './useDayPlan'

/** A full day: its time blocks and todos. Past and future days are one arrow away. */
export function TodayPage() {
  const { t, i18n } = useTranslation()
  const timeZone = useTimeZone()
  const [searchParams, setSearchParams] = useSearchParams()
  const day = dayFromParam(searchParams.get('day'), timeZone)
  const isToday = day.compare(today(timeZone)) === 0
  const plan = useDayPlan(day, timeZone)
  const milestones = useMilestones() ?? []
  const [isAddingBlock, setAddingBlock] = useState(false)

  const goTo = (next: CalendarDate) =>
    setSearchParams(next.compare(today(timeZone)) === 0 ? {} : { day: next.toString() })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="font-serif text-3xl text-grove-ink">
            {dayLabel(day, t, i18n.language, timeZone)}
          </h1>
          <p className="text-sm text-grove-muted first-letter:uppercase">
            {formatDay(day, i18n.language, timeZone)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            variant="secondary"
            aria-label={t('today.previousDay')}
            onPress={() => goTo(day.subtract({ days: 1 }))}
          >
            <ChevronLeft />
          </IconButton>
          {!isToday && (
            <Button variant="secondary" onPress={() => goTo(today(timeZone))}>
              {t('common.today')}
            </Button>
          )}
          <IconButton
            variant="secondary"
            aria-label={t('today.nextDay')}
            onPress={() => goTo(day.add({ days: 1 }))}
          >
            <ChevronRight />
          </IconButton>
        </div>
      </header>

      {!plan ? (
        <Spinner label={t('common.loading')} className="text-grove-moss" />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card
            title={t('today.blocks')}
            subtitle={t('today.blocksSubtitle')}
            icon={<Clock3 />}
            actions={
              <IconButton
                variant="secondary"
                size="sm"
                aria-label={t('today.addBlock')}
                onPress={() => setAddingBlock(true)}
              >
                <Plus />
              </IconButton>
            }
          >
            {plan.blocks.length === 0 ? (
              <p className="text-sm text-grove-muted">{t('today.noBlocks')}</p>
            ) : (
              <ul className="divide-y divide-grove-line">
                {plan.blocks.map((block) => (
                  <TimeBlockRow
                    key={block.id}
                    block={block}
                    day={day}
                    milestones={milestones}
                    timeZone={timeZone}
                  />
                ))}
              </ul>
            )}
          </Card>

          <Card title={t('today.todos')} subtitle={t('today.todosSubtitle')} icon={<ListTodo />}>
            <AddTodoField day={day} />
            <TodoGroup
              title={t('today.overdue')}
              todos={plan.overdue}
              milestones={milestones}
              timeZone={timeZone}
              showDue
            />
            <TodoGroup
              title={isToday ? t('today.dueToday') : t('today.dueThatDay')}
              todos={plan.due}
              milestones={milestones}
              timeZone={timeZone}
              empty={t('today.noTodos')}
            />
            <TodoGroup
              title={t('today.someday')}
              todos={plan.someday}
              milestones={milestones}
              timeZone={timeZone}
            />
          </Card>
        </div>
      )}

      <TimeBlockForm
        day={day}
        timeZone={timeZone}
        isOpen={isAddingBlock}
        onOpenChange={setAddingBlock}
      />
    </div>
  )
}

function TodoGroup(props: {
  title: string
  todos: Todo[]
  milestones: Milestone[]
  timeZone: string
  showDue?: boolean
  empty?: string
}) {
  if (props.todos.length === 0 && !props.empty) return null
  return (
    <Section title={props.title}>
      {props.todos.length === 0 ? (
        <p className="py-2 text-sm text-grove-muted">{props.empty}</p>
      ) : (
        <ul className="divide-y divide-grove-line">
          {props.todos.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              milestones={props.milestones}
              timeZone={props.timeZone}
              showDue={props.showDue}
            />
          ))}
        </ul>
      )}
    </Section>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="text-xs font-semibold tracking-wider text-grove-muted uppercase">{title}</h3>
      {children}
    </section>
  )
}

/** A text field that adds a todo for the day on Enter. */
function AddTodoField({ day }: { day: CalendarDate }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  return (
    <TextField
      aria-label={t('today.addTodo')}
      placeholder={t('today.addTodoPlaceholder')}
      value={title}
      onChange={setTitle}
      onKeyDown={(event) => {
        if (event.key !== 'Enter') return event.continuePropagation()
        if (title.trim()) {
          void addTodo({ title, due_date: day.toString() })
          setTitle('')
        }
      }}
    />
  )
}

/** The day in the address (?day=2026-10-01), or today. */
function dayFromParam(param: string | null, timeZone: string): CalendarDate {
  if (param) {
    try {
      return parseDate(param)
    } catch {
      // not a date: show today
    }
  }
  return today(timeZone)
}
