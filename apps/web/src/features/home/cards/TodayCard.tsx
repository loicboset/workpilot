import { today } from '@internationalized/date'
import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from '@/components/ui/Link'
import { useMilestones } from '@/data/direction'
import { useTimeZone } from '@/data/profile'
import { useDayPlan } from '@/features/today/useDayPlan'
import { HomeCard } from '../HomeCard'
import { DayRow } from './DayRow'
import { dayItems, dayLoad, focusItem } from './dayTimeline'

/** Enough lines for a calm day; the Today page has the rest. */
const SHOWN = 6

/** Today at a glance: the time blocks in order, then the todos due; the next one stands out. */
export const TodayCard = () => {
  // HOOKS
  const { t } = useTranslation()
  const timeZone = useTimeZone()
  const plan = useDayPlan(today(timeZone), timeZone)
  const milestones = useMilestones() ?? []

  // VARS
  const blocks = plan?.blocks ?? []
  const todos = plan ? [...plan.overdue, ...plan.due] : []
  const items = dayItems(blocks, todos)
  const focus = focusItem(items)
  const load = dayLoad(blocks, todos)
  const openBlocks = blocks.filter((block) => block.completed_at === null).length
  const openTodos = todos.filter((todo) => todo.completed_at === null).length
  const aside = [
    t(`home.today.${load}`),
    openBlocks > 0 && t('home.today.blocks', { count: openBlocks }),
    openTodos > 0 && t('home.today.todos', { count: openTodos }),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <HomeCard
      title={t('nav.today')}
      href="/today"
      aside={plan ? aside : undefined}
      icon={<Clock />}
      tone="moss"
      footer={
        items.length > SHOWN && (
          <Link href="/today" className="text-sm">
            {t('home.today.more', { count: items.length - SHOWN })}
          </Link>
        )
      }
    >
      {plan && items.length === 0 && (
        <p className="text-sm text-grove-muted">{t('home.today.freeHint')}</p>
      )}
      <ul className="-mt-0.75 space-y-1.75">
        {items.slice(0, SHOWN).map((item) => (
          <DayRow
            key={item.id}
            item={item}
            isFocus={item.id === focus?.id}
            milestone={milestones.find((milestone) => milestone.id === item.milestoneId)}
            timeZone={timeZone}
          />
        ))}
      </ul>
    </HomeCard>
  )
}
