import { MoreHorizontal, Pencil, Plus, StickyNote, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { MenuTrigger } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { Spinner } from '@/components/ui/Spinner'
import { deleteNote, useNotes } from '@/data/notes'
import { useTimeZone } from '@/data/profile'
import type { Note } from '@/db/types'
import { dayOf } from '@/lib/dates'
import { dayLabel } from '@/lib/format'
import { NoteForm } from './NoteForm'

/** Things kept as written, newest first. Long notes open in full on a click. */
export const NotesCard = () => {
  // STATES
  const [isAdding, setAdding] = useState(false)

  // HOOKS
  const { t } = useTranslation()
  const notes = useNotes()

  return (
    <Card
      title={t('notes.notes')}
      subtitle={t('notes.notesSubtitle')}
      icon={<StickyNote />}
      actions={
        <IconButton
          variant="secondary"
          size="sm"
          aria-label={t('notes.addNote')}
          onPress={() => setAdding(true)}
        >
          <Plus />
        </IconButton>
      }
    >
      {!notes ? (
        <Spinner label={t('common.loading')} className="text-grove-moss" />
      ) : notes.length === 0 ? (
        <p className="text-sm text-grove-muted">{t('notes.noNotes')}</p>
      ) : (
        <ul className="-mt-2 divide-y divide-grove-line">
          {notes.map((note) => (
            <NoteRow key={note.id} note={note} />
          ))}
        </ul>
      )}
      <NoteForm isOpen={isAdding} onOpenChange={setAdding} />
    </Card>
  )
}

const NoteRow = ({ note }: { note: Note }) => {
  // STATES
  const [isExpanded, setExpanded] = useState(false)
  const [isEditing, setEditing] = useState(false)

  // HOOKS
  const { t, i18n } = useTranslation()
  const timeZone = useTimeZone()

  // VARS
  const name = note.title ?? note.content.split('\n')[0]

  // METHODS
  const onAction = (action: string) => {
    if (action === 'edit') setEditing(true)
    if (action === 'delete') void deleteNote(note.id)
  }

  return (
    <li className="flex items-start gap-2 py-3">
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setExpanded(!isExpanded)}
        className="flex-1 cursor-pointer rounded text-left focus-visible:outline-2 focus-visible:outline-grove-moss"
      >
        <span className="flex items-baseline justify-between gap-3">
          {note.title && <span className="font-medium text-grove-ink">{note.title}</span>}
          <span className="ml-auto shrink-0 text-xs text-grove-muted">
            {dayLabel(dayOf(note.created_at, timeZone), t, i18n.language, timeZone)}
          </span>
        </span>
        <span
          className={twMerge(
            'mt-1 block text-sm whitespace-pre-wrap text-grove-ink',
            note.title && 'text-grove-muted',
            !isExpanded && 'line-clamp-4',
          )}
        >
          {note.content}
        </span>
      </button>
      <MenuTrigger>
        <IconButton size="sm" aria-label={t('notes.moreFor', { text: name })}>
          <MoreHorizontal />
        </IconButton>
        <Menu onAction={(key) => onAction(String(key))}>
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
      <NoteForm note={note} isOpen={isEditing} onOpenChange={setEditing} />
    </li>
  )
}
