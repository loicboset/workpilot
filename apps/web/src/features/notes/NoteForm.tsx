import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Form } from '@/components/ui/Form'
import { Dialog, DialogTitle, Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { addNote, updateNote, type NoteFields } from '@/data/notes'
import type { Note } from '@/db/types'

type NoteFormProps = {
  /** The note to change; a new one is made when absent. */
  note?: Note
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

/** Write a new note or change one: an optional title, and the note as written. */
export const NoteForm = ({ note, isOpen, onOpenChange }: NoteFormProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="max-w-xl">
      <Dialog>
        <DialogTitle>{note ? t('notes.editNote') : t('notes.addNote')}</DialogTitle>
        {/* Mounted only while open, so it starts fresh every time. */}
        <NoteFields note={note} onDone={() => onOpenChange(false)} />
      </Dialog>
    </Modal>
  )
}

type FormValues = { title: string; content: string }

const NoteFields = ({ note, onDone }: { note?: Note; onDone: () => void }) => {
  // HOOKS
  const { t } = useTranslation()

  // RHF
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { title: note?.title ?? '', content: note?.content ?? '' },
  })
  const content = useWatch({ control, name: 'content' })

  // METHODS
  const save = async ({ title, content }: FormValues) => {
    const fields: NoteFields = { title: title.trim() || null, content: content.trim() }
    if (note) await updateNote(note.id, fields)
    else await addNote(fields.content, fields.title)
    onDone()
  }

  return (
    <Form onSubmit={handleSubmit(save)}>
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <TextField
            label={t('notes.noteTitle')}
            description={t('common.optional')}
            autoFocus={!note}
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      <Controller
        name="content"
        control={control}
        rules={{ validate: (content) => content.trim() !== '' }}
        render={({ field }) => (
          <TextField
            label={t('notes.noteContent')}
            multiline
            isRequired
            autoFocus={Boolean(note)}
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            className="[&_textarea]:min-h-64"
          />
        )}
      />
      <div className="flex justify-end gap-3">
        <Button variant="quiet" slot="close">
          {t('common.cancel')}
        </Button>
        <Button type="submit" isDisabled={!content.trim()}>
          {t('common.save')}
        </Button>
      </div>
    </Form>
  )
}
