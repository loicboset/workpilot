import { parseDate, type CalendarDate } from '@internationalized/date'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Form } from '@/components/ui/Form'
import { Dialog, DialogTitle, Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { updateMilestone } from '@/data/direction'
import type { Milestone } from '@/db/types'

/** Change a milestone: its name, what it means, and when you hope to reach it. */
export function MilestoneForm(props: {
  milestone: Milestone
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <Modal isOpen={props.isOpen} onOpenChange={props.onOpenChange} className="max-w-md">
      <Dialog>
        <DialogTitle>{t('direction.editMilestone')}</DialogTitle>
        <Fields milestone={props.milestone} onDone={() => props.onOpenChange(false)} />
      </Dialog>
    </Modal>
  )
}

function Fields({ milestone, onDone }: { milestone: Milestone; onDone: () => void }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(milestone.title)
  const [description, setDescription] = useState(milestone.description ?? '')
  const [target, setTarget] = useState<CalendarDate | null>(
    milestone.target_date ? parseDate(milestone.target_date) : null,
  )

  async function save() {
    await updateMilestone(milestone.id, {
      title: title.trim(),
      description: description.trim() || null,
      target_date: target?.toString() ?? null,
    })
    onDone()
  }

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      <TextField
        label={t('direction.milestoneTitle')}
        value={title}
        onChange={setTitle}
        isRequired
        autoFocus
      />
      <TextField
        label={t('direction.milestoneMeaning')}
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
        <Button variant="quiet" slot="close">
          {t('common.cancel')}
        </Button>
        <Button type="submit" isDisabled={!title.trim()}>
          {t('common.save')}
        </Button>
      </div>
    </Form>
  )
}
