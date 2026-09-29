import { Snowflake } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '@/components/PageTitle'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { TextField } from '@/components/ui/TextField'
import { useMilestones } from '@/data/direction'
import { useTimeZone } from '@/data/profile'
import { addTodo, useIcebox } from '@/data/todos'
import { TodoRow } from '@/features/today/TodoRow'

/** The todos without a date, kept for later (ADR 0029). Giving one a day takes it out. */
export const IceboxPage = () => {
  // STATES
  const [isShowingDone, setShowingDone] = useState(false)

  // HOOKS
  const { t } = useTranslation()
  const timeZone = useTimeZone()
  const icebox = useIcebox()
  const milestones = useMilestones() ?? []

  return (
    <div className="space-y-6 pt-2">
      <header>
        <PageTitle subtitle={t('icebox.subtitle')}>{t('icebox.title')}</PageTitle>
      </header>

      <Card className="max-w-3xl">
        <AddIceboxField />
        {!icebox ? (
          <Spinner label={t('common.loading')} className="mt-5 text-grove-moss" />
        ) : (
          <>
            {icebox.open.length === 0 ? (
              <p className="mt-5 text-sm text-grove-muted">{t('icebox.empty')}</p>
            ) : (
              <ul className="mt-3 divide-y divide-grove-line">
                {icebox.open.map((todo) => (
                  <TodoRow key={todo.id} todo={todo} milestones={milestones} timeZone={timeZone} />
                ))}
              </ul>
            )}

            {icebox.done.length > 0 && (
              <div className="mt-5">
                <Button variant="quiet" size="sm" onPress={() => setShowingDone(!isShowingDone)}>
                  {isShowingDone
                    ? t('icebox.hideDone')
                    : t('icebox.showDone', { count: icebox.done.length })}
                </Button>
                {isShowingDone && (
                  <ul className="mt-1 divide-y divide-grove-line">
                    {icebox.done.map((todo) => (
                      <TodoRow
                        key={todo.id}
                        todo={todo}
                        milestones={milestones}
                        timeZone={timeZone}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

/** A text field that puts a todo in the icebox on Enter. */
const AddIceboxField = () => {
  // STATES
  const [title, setTitle] = useState('')

  // HOOKS
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3">
      <Snowflake className="size-5 shrink-0 text-grove-moss" aria-hidden />
      <TextField
        aria-label={t('icebox.add')}
        placeholder={t('icebox.addPlaceholder')}
        value={title}
        onChange={setTitle}
        className="flex-1"
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return event.continuePropagation()
          if (title.trim()) {
            void addTodo({ title, due_date: null })
            setTitle('')
          }
        }}
      />
    </div>
  )
}
