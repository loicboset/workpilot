import { today } from '@internationalized/date'
import { CornerDownLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button as AriaButton, Input, TextField, type KeyboardEvent } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, Modal } from '@/components/ui/Modal'
import { useTimeZone } from '@/data/profile'
import { useCaptureBar } from './captureStore'
import { CapturePreview } from './CapturePreview'
import { COMMANDS, commandsStartingWith, parseCapture, type Command } from './parseCapture'
import { saveCapture } from './saveCapture'

/** The capture bar (⌘K / Ctrl+K from anywhere): empty your mind, one line at a time. */
export function CaptureBar() {
  const { t } = useTranslation()
  const { isOpen, setOpen } = useCaptureBar()
  useCaptureShortcut()

  return (
    <Modal isOpen={isOpen} onOpenChange={setOpen} placement="top" className="max-w-xl p-5">
      <Dialog aria-label={t('capture.title')}>
        <CaptureForm />
      </Dialog>
    </Modal>
  )
}

function CaptureForm() {
  const { t } = useTranslation()
  const timeZone = useTimeZone()
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [savedKind, setSavedKind] = useState<Command | null>(null)
  const result = parseCapture(text, today(timeZone))

  async function save() {
    if (!('capture' in result)) return
    await saveCapture(result.capture, timeZone)
    setSavedKind(result.capture.kind)
    setText('')
  }

  function insertCommand(command: Command) {
    const withoutCommand = text.replace(/^\/\S*\s*/, '')
    setText(`/${command} ${withoutCommand}`)
    inputRef.current?.focus()
  }

  function onKeyDown(event: KeyboardEvent) {
    const completions = commandsStartingWith(text)
    if (event.key === 'Enter') {
      event.preventDefault()
      void save()
    } else if (event.key === 'Tab' && completions.length === 1) {
      event.preventDefault()
      insertCommand(completions[0])
    } else {
      event.continuePropagation() // React Aria stops key events by default: let Esc close the bar
    }
  }

  return (
    <div className="space-y-4">
      <TextField
        aria-label={t('capture.title')}
        value={text}
        onChange={(value) => {
          setText(value)
          setSavedKind(null)
        }}
        onKeyDown={onKeyDown}
        autoFocus
      >
        <Input
          ref={inputRef}
          placeholder={t('capture.placeholder')}
          className="h-14 w-full rounded-control bg-grove-field px-5 text-lg text-grove-ink outline-none placeholder:text-grove-muted/70 focus-visible:outline-2 focus-visible:outline-grove-moss"
        />
      </TextField>

      <div className="min-h-6">
        {savedKind && text === '' ? (
          <Alert tone="success">
            {t('capture.saved', { kind: t(`capture.kinds.${savedKind}`) })}
          </Alert>
        ) : (
          <CapturePreview result={result} timeZone={timeZone} />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-grove-line pt-4">
        <div className="flex flex-wrap gap-2" aria-label={t('capture.commandsLabel')} role="group">
          {COMMANDS.map((command) => (
            <AriaButton
              key={command}
              onPress={() => insertCommand(command)}
              className="cursor-pointer rounded-full border border-grove-line bg-grove-card px-3 py-1 text-sm text-grove-ink hovered:bg-grove-field focus-visible:outline-2 focus-visible:outline-grove-moss"
            >
              <span className="font-semibold text-grove-moss">/{command}</span>{' '}
              <span className="text-grove-muted">{t(`capture.commands.${command}`)}</span>
            </AriaButton>
          ))}
        </div>
        <Button size="sm" onPress={() => void save()} isDisabled={!('capture' in result)}>
          <CornerDownLeft className="size-4" aria-hidden />
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}

/** ⌘K on a Mac, Ctrl+K elsewhere, from any page. */
function useCaptureShortcut() {
  const setOpen = useCaptureBar((state) => state.setOpen)
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setOpen])
}
