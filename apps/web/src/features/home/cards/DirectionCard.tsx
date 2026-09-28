import { Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Link } from '@/components/ui/Link'
import { completeMilestone, reopenMilestone, useMilestones } from '@/data/direction'

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']

/** The milestones as a short checklist: tick one when you reach it. */
export function DirectionCard() {
  const { t } = useTranslation()
  const milestones = useMilestones() ?? []
  const reached = milestones.filter((milestone) => milestone.completed_at !== null).length

  return (
    <Card
      title={t('nav.direction')}
      subtitle={t('home.direction.summary', { reached, total: milestones.length })}
      icon={<Compass />}
      actions={<Link href="/direction">{t('home.direction.open')}</Link>}
    >
      {milestones.length === 0 ? (
        <p className="text-sm text-grove-muted">{t('direction.noMilestones')}</p>
      ) : (
        <ol className="space-y-3">
          {milestones.slice(0, ROMAN.length).map((milestone, index) => (
            <li key={milestone.id} className="flex items-start gap-3">
              <span className="w-6 shrink-0 pt-0.5 font-serif text-grove-muted italic">
                {ROMAN[index]}.
              </span>
              <Checkbox
                className="items-start pt-0.5"
                isSelected={milestone.completed_at !== null}
                onChange={(isReached) =>
                  void (isReached ? completeMilestone(milestone.id) : reopenMilestone(milestone.id))
                }
              >
                <span className="flex flex-col">
                  <span
                    className={
                      milestone.completed_at ? 'text-grove-muted line-through' : 'font-medium'
                    }
                  >
                    {milestone.title}
                  </span>
                  {milestone.description && (
                    <span className="text-sm text-grove-muted">{milestone.description}</span>
                  )}
                </span>
              </Checkbox>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
