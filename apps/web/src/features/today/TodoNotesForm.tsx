import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Form } from '@/components/ui/Form'
import { Dialog, DialogTitle, Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { updateTodo } from '@/data/todos'
import type { Todo } from '@/db/types'

type TodoNotesFormProps = {
  todo: Todo
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

/** A todo's notes, as written: steps as "- [ ] step" make a checklist. */
export const TodoNotesForm = ({ todo, isOpen, onOpenChange }: TodoNotesFormProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="max-w-xl">
      <Dialog>
        <DialogTitle>{t('today.notesFor', { title: todo.title })}</DialogTitle>
        {/* Mounted only while open, so it starts from the saved notes every time. */}
        <NotesFields todo={todo} onDone={() => onOpenChange(false)} />
      </Dialog>
    </Modal>
  )
}

const NotesFields = ({ todo, onDone }: { todo: Todo; onDone: () => void }) => {
  // HOOKS
  const { t } = useTranslation()

  // RHF
  const { control, handleSubmit } = useForm<{ notes: string }>({
    defaultValues: { notes: todo.notes ?? '' },
  })

  // METHODS
  const save = async ({ notes }: { notes: string }) => {
    await updateTodo(todo.id, { notes: notes.trim() || null })
    onDone()
  }

  return (
    <Form onSubmit={handleSubmit(save)}>
      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <TextField
            aria-label={t('today.notes')}
            placeholder={t('today.notesPlaceholder')}
            multiline
            autoFocus
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            className="[&_textarea]:min-h-64 [&_textarea]:font-mono [&_textarea]:text-sm"
          />
        )}
      />
      <div className="flex justify-end gap-3">
        <Button variant="quiet" slot="close">
          {t('common.cancel')}
        </Button>
        <Button type="submit">{t('common.save')}</Button>
      </div>
    </Form>
  )
}
