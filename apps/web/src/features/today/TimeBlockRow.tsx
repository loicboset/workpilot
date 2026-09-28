import type { CalendarDate } from '@internationalized/date'
import { MoreHorizontal, Pencil, Sunrise, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { MenuTrigger } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/Checkbox'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem } from '@/components/ui/Menu'
import {
  completeTimeBlock,
  deleteTimeBlock,
  reopenTimeBlock,
  shiftTimeBlock,
  updateTimeBlock,
} from '@/data/timeBlocks'
import type { Milestone, TimeBlock } from '@/db/types'
import { formatClock } from '@/lib/format'
import { MilestoneSubmenu } from './MilestoneMenu'
import { TimeBlockForm } from './TimeBlockForm'

interface TimeBlockRowProps {
  block: TimeBlock
  day: CalendarDate
  milestones: Milestone[]
  timeZone: string
}

/** A time block: its hours, tick it done, move it to tomorrow, edit, link or delete it. */
export function TimeBlockRow({ block, day, milestones, timeZone }: TimeBlockRowProps) {
  const { t, i18n } = useTranslation()
  const [isEditing, setEditing] = useState(false)
  const isDone = block.completed_at !== null
  const milestone = milestones.find((m) => m.id === block.milestone_id)
  const from = formatClock(block.start_at, i18n.language, timeZone)
  const until = formatClock(block.end_at, i18n.language, timeZone)

  function onAction(action: string) {
    if (action === 'tomorrow') void shiftTimeBlock(block, 1)
    if (action === 'edit') setEditing(true)
    if (action === 'delete') void deleteTimeBlock(block.id)
  }

  return (
    <li className="flex items-start gap-3 py-2">
      <span className="w-18 shrink-0 pt-0.5 text-sm font-semibold whitespace-nowrap text-grove-moss tabular-nums">
        {from}
      </span>
      <Checkbox
        className="flex-1 items-start pt-0.5"
        isSelected={isDone}
        onChange={(done) => void (done ? completeTimeBlock(block.id) : reopenTimeBlock(block.id))}
      >
        <span className="flex flex-col gap-0.5">
          <span className={isDone ? 'text-grove-muted line-through' : undefined}>
            {block.title}
          </span>
          <span className="flex flex-wrap gap-2 text-xs text-grove-muted">
            {t('today.until')} {until}
            {milestone && <span className="text-grove-moss">⚑ {milestone.title}</span>}
          </span>
        </span>
      </Checkbox>

      <MenuTrigger>
        <IconButton size="sm" aria-label={t('today.moreFor', { title: block.title })}>
          <MoreHorizontal />
        </IconButton>
        <Menu onAction={(key) => onAction(String(key))}>
          <MenuItem id="edit">
            <Pencil aria-hidden />
            {t('common.edit')}
          </MenuItem>
          <MenuItem id="tomorrow">
            <Sunrise aria-hidden />
            {t('today.moveTomorrow')}
          </MenuItem>
          <MilestoneSubmenu
            milestones={milestones}
            selectedId={block.milestone_id}
            onSelect={(milestoneId) =>
              void updateTimeBlock(block.id, { milestone_id: milestoneId })
            }
          />
          <MenuItem id="delete" isDanger>
            <Trash2 aria-hidden />
            {t('common.delete')}
          </MenuItem>
        </Menu>
      </MenuTrigger>

      <TimeBlockForm
        day={day}
        timeZone={timeZone}
        block={block}
        isOpen={isEditing}
        onOpenChange={setEditing}
      />
    </li>
  )
}
