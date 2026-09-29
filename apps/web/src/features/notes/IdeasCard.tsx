import { Lightbulb, MoreHorizontal, Snowflake, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { MenuTrigger } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { Spinner } from '@/components/ui/Spinner'
import { TextField } from '@/components/ui/TextField'
import { useSpace } from '@/data/currentSpace'
import { addIdea, deleteIdea, useIdeas } from '@/data/ideas'
import { addTodo } from '@/data/todos'
import type { Idea } from '@/db/types'

/** Thoughts captured quickly, newest first. One can become a todo in the icebox. */
export const IdeasCard = () => {
  // STATES
  const [text, setText] = useState('')

  // HOOKS
  const { t } = useTranslation()
  const space = useSpace()
  const ideas = useIdeas()

  return (
    <Card title={t('notes.ideas')} subtitle={t('notes.ideasSubtitle')} icon={<Lightbulb />}>
      <TextField
        aria-label={t('notes.addIdea')}
        placeholder={t('notes.addIdeaPlaceholder')}
        value={text}
        onChange={setText}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return event.continuePropagation()
          if (text.trim()) {
            void addIdea(space.id, text)
            setText('')
          }
        }}
      />
      {!ideas ? (
        <Spinner label={t('common.loading')} className="mt-5 text-grove-moss" />
      ) : ideas.length === 0 ? (
        <p className="mt-5 text-sm text-grove-muted">{t('notes.noIdeas')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-grove-line">
          {ideas.map((idea) => (
            <IdeaRow key={idea.id} idea={idea} />
          ))}
        </ul>
      )}
    </Card>
  )
}

const IdeaRow = ({ idea }: { idea: Idea }) => {
  // HOOKS
  const { t } = useTranslation()

  // METHODS
  const onAction = async (action: string) => {
    if (action === 'icebox') {
      await addTodo(idea.space_id, { title: idea.text, due_date: null })
      await deleteIdea(idea.id)
    }
    if (action === 'delete') await deleteIdea(idea.id)
  }

  return (
    <li className="flex items-start gap-2 py-2">
      <p className="flex-1 pt-1.5 text-sm whitespace-pre-wrap text-grove-ink">{idea.text}</p>
      <MenuTrigger>
        <IconButton size="sm" aria-label={t('notes.moreFor', { text: idea.text })}>
          <MoreHorizontal />
        </IconButton>
        <Menu onAction={(key) => void onAction(String(key))}>
          <MenuItem id="icebox">
            <Snowflake aria-hidden />
            {t('notes.toIcebox')}
          </MenuItem>
          <MenuItem id="delete" isDanger>
            <Trash2 aria-hidden />
            {t('common.delete')}
          </MenuItem>
        </Menu>
      </MenuTrigger>
    </li>
  )
}
