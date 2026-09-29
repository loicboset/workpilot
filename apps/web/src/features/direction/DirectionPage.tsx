import { parseDate, type CalendarDate } from '@internationalized/date'
import { Compass, Flag, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { MenuTrigger } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { MethodInfo } from '@/components/MethodInfo'
import { PageTitle } from '@/components/PageTitle'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { DatePicker } from '@/components/ui/DatePicker'
import { Form } from '@/components/ui/Form'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { Meter } from '@/components/ui/Meter'
import { TextField } from '@/components/ui/TextField'
import {
  addMilestone,
  completeMilestone,
  deleteMilestone,
  reopenMilestone,
  saveNorthStar,
  useMilestones,
  useNorthStar,
} from '@/data/direction'
import { useTimeZone } from '@/data/profile'
import type { Milestone, NorthStar } from '@/db/types'
import { formatDay } from '@/lib/format'
import { MilestoneForm } from './MilestoneForm'
import { useTimeAlignedThisWeek } from './useTimeAligned'

/** Your North Star and the milestones on the way (ADR 0013, adapted from Hoshin Kanri). */
export function DirectionPage() {
  const { t } = useTranslation()
  const northStar = useNorthStar()
  const milestones = useMilestones() ?? []
  const aligned = useTimeAlignedThisWeek()
  const reached = milestones.filter((milestone) => milestone.completed_at !== null).length

  return (
    <div className="space-y-6 pt-2">
      <header>
        <PageTitle subtitle={t('direction.subtitle')}>{t('nav.direction')}</PageTitle>
      </header>

      {/* Only once loaded: the form starts from the saved North Star. */}
      {northStar !== undefined && (
        <NorthStarCard key={northStar?.id ?? 'new'} northStar={northStar} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <Meter
            label={t('direction.progress')}
            value={reached}
            maxValue={Math.max(milestones.length, 1)}
            valueLabel={t('direction.reachedOf', { reached, total: milestones.length })}
          />
          <p className="mt-3 text-sm text-grove-muted">{t('direction.progressHelp')}</p>
        </Card>
        <Card>
          <Meter
            label={t('northStar.timeAligned')}
            value={Math.round((aligned ?? 0) * 100)}
            valueLabel={
              aligned === null || aligned === undefined ? '–' : `${Math.round(aligned * 100)}%`
            }
          />
          <p className="mt-3 text-sm text-grove-muted">
            {aligned === null ? t('northStar.timeAlignedNone') : t('direction.timeAlignedHelp')}
          </p>
        </Card>
      </div>

      {northStar && <MilestonesCard northStar={northStar} milestones={milestones} />}
    </div>
  )
}

function NorthStarCard({ northStar }: { northStar: NorthStar | null }) {
  const { t, i18n } = useTranslation()
  const timeZone = useTimeZone()
  const [isEditing, setEditing] = useState(northStar === null)
  const [title, setTitle] = useState(northStar?.title ?? '')
  const [description, setDescription] = useState(northStar?.description ?? '')
  const [target, setTarget] = useState<CalendarDate | null>(
    northStar?.target_date ? parseDate(northStar.target_date) : null,
  )

  async function save() {
    await saveNorthStar({
      title: title.trim(),
      description: description.trim() || null,
      target_date: target?.toString() ?? null,
    })
    setEditing(false)
  }

  return (
    <Card
      title={t('northStar.label')}
      icon={<Compass />}
      actions={
        <>
          <MethodInfo method="hoshinKanri" />
          {!isEditing && (
            <IconButton size="sm" aria-label={t('common.edit')} onPress={() => setEditing(true)}>
              <Pencil />
            </IconButton>
          )}
        </>
      }
    >
      {isEditing ? (
        <Form
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <TextField
            label={t('direction.northStarTitle')}
            value={title}
            onChange={setTitle}
            isRequired
            autoFocus
          />
          <TextField
            label={t('direction.northStarWhy')}
            description={t('common.optional')}
            value={description}
            onChange={setDescription}
            multiline
          />
          <DatePicker
            label={t('direction.targetDate')}
            description={t('common.optional')}
            value={target}
            onChange={setTarget}
          />
          <div className="flex justify-end gap-3">
            {northStar && (
              <Button variant="quiet" onPress={() => setEditing(false)}>
                {t('common.cancel')}
              </Button>
            )}
            <Button type="submit" isDisabled={!title.trim()}>
              {t('common.save')}
            </Button>
          </div>
        </Form>
      ) : (
        northStar && (
          <div className="space-y-2">
            <p className="font-serif text-2xl leading-snug text-grove-ink">{northStar.title}</p>
            {northStar.description && <p className="text-grove-muted">{northStar.description}</p>}
            {northStar.target_date && (
              <p className="text-sm text-grove-moss">
                {t('direction.by', {
                  day: formatDay(parseDate(northStar.target_date), i18n.language, timeZone),
                })}
              </p>
            )}
          </div>
        )
      )}
    </Card>
  )
}

function MilestonesCard({
  northStar,
  milestones,
}: {
  northStar: NorthStar
  milestones: Milestone[]
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  return (
    <Card
      title={t('direction.milestones')}
      subtitle={t('direction.milestonesSubtitle')}
      icon={<Flag />}
    >
      {milestones.length === 0 ? (
        <p className="mb-4 text-sm text-grove-muted">{t('direction.noMilestones')}</p>
      ) : (
        <ol className="mb-4 divide-y divide-grove-line">
          {milestones.map((milestone, index) => (
            <MilestoneRow key={milestone.id} milestone={milestone} number={index + 1} />
          ))}
        </ol>
      )}
      <TextField
        aria-label={t('direction.addMilestone')}
        placeholder={t('direction.addMilestonePlaceholder')}
        value={title}
        onChange={setTitle}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return event.continuePropagation()
          if (title.trim()) {
            void addMilestone(northStar.id, { title })
            setTitle('')
          }
        }}
      />
    </Card>
  )
}

function MilestoneRow({ milestone, number }: { milestone: Milestone; number: number }) {
  const { t, i18n } = useTranslation()
  const timeZone = useTimeZone()
  const [isEditing, setEditing] = useState(false)
  const isReached = milestone.completed_at !== null

  return (
    <li className="flex items-start gap-3 py-3">
      <span className="w-6 shrink-0 pt-0.5 font-serif text-grove-muted">{number}.</span>
      <Checkbox
        className="flex-1 items-start pt-0.5"
        isSelected={isReached}
        onChange={(reached) =>
          void (reached ? completeMilestone(milestone.id) : reopenMilestone(milestone.id))
        }
      >
        <span className="flex flex-col gap-0.5">
          <span className={isReached ? 'text-grove-muted line-through' : 'font-medium'}>
            {milestone.title}
          </span>
          {milestone.description && (
            <span className="text-sm text-grove-muted">{milestone.description}</span>
          )}
          {milestone.target_date && (
            <span className="text-xs text-grove-moss">
              {formatDay(parseDate(milestone.target_date), i18n.language, timeZone, true)}
            </span>
          )}
        </span>
      </Checkbox>
      <MenuTrigger>
        <IconButton size="sm" aria-label={t('today.moreFor', { title: milestone.title })}>
          <MoreHorizontal />
        </IconButton>
        <Menu
          onAction={(key) => {
            if (key === 'edit') setEditing(true)
            if (key === 'delete') void deleteMilestone(milestone.id)
          }}
        >
          <MenuItem id="edit">
            <Pencil aria-hidden />
            {t('common.edit')}
          </MenuItem>
          <MenuItem id="delete" isDanger>
            <Trash2 aria-hidden />
            {t('common.delete')}
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <MilestoneForm milestone={milestone} isOpen={isEditing} onOpenChange={setEditing} />
    </li>
  )
}
