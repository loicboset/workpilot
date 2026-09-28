import { today } from '@internationalized/date'
import { Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Link } from '@/components/ui/Link'
import { useMilestones } from '@/data/direction'
import { useTimeZone } from '@/data/profile'
import { TimeBlockRow } from '@/features/today/TimeBlockRow'
import { TodoRow } from '@/features/today/TodoRow'
import { useDayPlan } from '@/features/today/useDayPlan'

/** Today at a glance: the time blocks, then the todos due (and the ones left from before). */
export function TodayCard() {
  const { t } = useTranslation()
  const timeZone = useTimeZone()
  const day = today(timeZone)
  const plan = useDayPlan(day, timeZone)
  const milestones = useMilestones() ?? []
  if (!plan)
    return (
      <Card title={t('nav.today')} icon={<Sun />}>
        {null}
      </Card>
    )

  const todos = [...plan.overdue, ...plan.due]
  const openCount = todos.filter((todo) => todo.completed_at === null).length
  const subtitle =
    plan.blocks.length === 0 && todos.length === 0
      ? t('home.today.free')
      : t('home.today.summary', { blocks: plan.blocks.length, todos: openCount })

  return (
    <Card
      title={t('nav.today')}
      subtitle={subtitle}
      icon={<Sun />}
      actions={<Link href="/today">{t('home.today.open')}</Link>}
    >
      {plan.blocks.length === 0 && todos.length === 0 ? (
        <p className="text-sm text-grove-muted">{t('home.today.freeHint')}</p>
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
          {todos.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              milestones={milestones}
              timeZone={timeZone}
              showDue
            />
          ))}
        </ul>
      )}
    </Card>
  )
}
