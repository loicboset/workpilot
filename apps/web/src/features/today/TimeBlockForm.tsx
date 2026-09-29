import { Time, type CalendarDate } from '@internationalized/date'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Form } from '@/components/ui/Form'
import { Dialog, DialogTitle, Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { TimeField } from '@/components/ui/TimeField'
import { useSpace } from '@/data/currentSpace'
import { addTimeBlock, updateTimeBlock } from '@/data/timeBlocks'
import type { TimeBlock } from '@/db/types'
import { momentOf, zoned } from '@/lib/dates'

interface TimeBlockFormProps {
  day: CalendarDate
  timeZone: string
  /** The block to edit; a new one is made when absent. */
  block?: TimeBlock
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

/** Add or change a time block on a day: what, from, until. */
export function TimeBlockForm({ day, timeZone, block, isOpen, onOpenChange }: TimeBlockFormProps) {
  const { t } = useTranslation()
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="max-w-md">
      <Dialog>
        <DialogTitle>{block ? t('today.editBlock') : t('today.addBlock')}</DialogTitle>
        {/* Mounted only while open, so it starts fresh every time. */}
        <BlockFields
          day={day}
          timeZone={timeZone}
          block={block}
          onDone={() => onOpenChange(false)}
        />
      </Dialog>
    </Modal>
  )
}

function BlockFields({
  day,
  timeZone,
  block,
  onDone,
}: Omit<TimeBlockFormProps, 'isOpen' | 'onOpenChange'> & { onDone: () => void }) {
  const { t } = useTranslation()
  const space = useSpace()
  const [title, setTitle] = useState(block?.title ?? '')
  const [start, setStart] = useState<Time | null>(
    block ? timeOf(block.start_at, timeZone) : new Time(9),
  )
  const [end, setEnd] = useState<Time | null>(block ? timeOf(block.end_at, timeZone) : new Time(10))
  const endIsBeforeStart = start !== null && end !== null && end.compare(start) <= 0

  async function save() {
    if (!title.trim() || !start || !end || endIsBeforeStart) return
    const times = { start_at: momentOf(day, start, timeZone), end_at: momentOf(day, end, timeZone) }
    if (block) await updateTimeBlock(block.id, { title: title.trim(), ...times })
    else await addTimeBlock(space.id, { title, ...times })
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
        label={t('today.blockTitle')}
        placeholder={t('today.blockPlaceholder')}
        value={title}
        onChange={setTitle}
        isRequired
        autoFocus
      />
      <div className="grid grid-cols-2 gap-4">
        <TimeField label={t('today.from')} value={start} onChange={setStart} isRequired />
        <TimeField label={t('today.until')} value={end} onChange={setEnd} isRequired />
      </div>
      {endIsBeforeStart && <Alert tone="error">{t('capture.problems.endBeforeStart')}</Alert>}
      <div className="flex justify-end gap-3">
        <Button variant="quiet" slot="close">
          {t('common.cancel')}
        </Button>
        <Button type="submit" isDisabled={!title.trim() || !start || !end || endIsBeforeStart}>
          {t('common.save')}
        </Button>
      </div>
    </Form>
  )
}

function timeOf(iso: string, timeZone: string): Time {
  const moment = zoned(iso, timeZone)
  return new Time(moment.hour, moment.minute)
}
