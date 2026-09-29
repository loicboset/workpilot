import { today } from '@internationalized/date'
import { useId, useState, type AriaAttributes } from 'react'
import { TextField, type KeyboardEvent } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/Alert'
import { Input, TextArea } from '@/components/ui/Field'
import { useTimeZone } from '@/data/profile'
import { CaptureHint, CapturePreview } from './CapturePreview'
import { CommandMenu } from './CommandMenu'
import { commandsStartingWith, parseCapture, type Command } from './parseCapture'
import { saveCapture } from './saveCapture'

type CaptureComposerProps = {
  /**
   * "bar": one large line, and the command menu pushes what is below, like a command palette.
   * "card": a text area (Shift+Enter for a new line), and the menu floats over the page.
   */
  variant: 'bar' | 'card'
  label: string
  /** What to say once saved, given the name of what was saved ("Todo"). */
  savedMessage: (kind: string) => string
  autoFocus?: boolean
}

/**
 * Where thoughts are captured, in the ⌘K bar and on the homepage: type, then Enter.
 * "/" opens the command menu, as in Slack or Claude; plain text becomes an idea (ADR 0010).
 */
export const CaptureComposer = ({
  variant,
  label,
  savedMessage,
  autoFocus,
}: CaptureComposerProps) => {
  // STATES
  const [text, setText] = useState('')
  const [savedKind, setSavedKind] = useState<Command | null>(null)
  const [isFocused, setFocused] = useState(false)
  const [isMenuDismissed, setMenuDismissed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  // HOOKS
  const { t } = useTranslation()
  const timeZone = useTimeZone()
  const menuId = useId()

  // METHODS
  const changeText = (value: string) => {
    setText(value)
    setSavedKind(null)
    setMenuDismissed(false)
    setActiveIndex(0)
  }

  const pickCommand = (command: Command) => changeText(`/${command} `)

  const optionId = (command: Command) => `${menuId}-${command}`

  const save = async () => {
    if (!('capture' in result)) return
    await saveCapture(result.capture, timeZone)
    setText('')
    setSavedKind(result.capture.kind)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.nativeEvent.isComposing) return // Enter ends an IME composition, it doesn't save
    if (isMenuOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((activeIndex + step + commands.length) % commands.length)
    } else if (isMenuOpen && (event.key === 'Enter' || event.key === 'Tab')) {
      event.preventDefault()
      pickCommand(activeCommand)
    } else if (isMenuOpen && event.key === 'Escape') {
      setMenuDismissed(true) // Esc closes the menu only, not the bar
    } else if (event.key === 'Enter' && !(isMultiline && event.shiftKey)) {
      event.preventDefault()
      void save()
    } else {
      event.continuePropagation() // React Aria stops key events by default: let Esc close the bar
    }
  }

  // VARS
  const isMultiline = variant === 'card'
  const result = parseCapture(text, today(timeZone))
  const commands = commandsStartingWith(text)
  const isMenuOpen = isFocused && !isMenuDismissed && commands.length > 0
  const activeCommand = commands[activeIndex] // activeIndex is reset whenever the text changes
  const comboboxProps: AriaAttributes = {
    'aria-autocomplete': 'list',
    'aria-controls': isMenuOpen ? menuId : undefined,
    'aria-activedescendant': isMenuOpen ? optionId(activeCommand) : undefined,
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <TextField
          aria-label={label}
          value={text}
          onChange={changeText}
          onKeyDown={onKeyDown}
          onFocusChange={setFocused}
          autoFocus={autoFocus}
        >
          {isMultiline ? (
            <TextArea {...comboboxProps} placeholder={t('capture.placeholder')} />
          ) : (
            <Input
              {...comboboxProps}
              placeholder={t('capture.placeholder')}
              className="h-14 px-5 text-lg"
            />
          )}
        </TextField>
        {isMenuOpen && (
          <CommandMenu
            id={menuId}
            commands={commands}
            activeCommand={activeCommand}
            optionId={optionId}
            onHighlight={(command) => setActiveIndex(commands.indexOf(command))}
            onPick={pickCommand}
            className={isMultiline ? 'absolute inset-x-0 top-full z-20 mt-2' : 'mt-2'}
          />
        )}
      </div>

      <div className="min-h-6">
        {savedKind ? (
          <Alert tone="success">{savedMessage(t(`capture.kinds.${savedKind}`))}</Alert>
        ) : isMenuOpen ? (
          <CaptureHint />
        ) : (
          <CapturePreview result={result} timeZone={timeZone} />
        )}
      </div>
    </div>
  )
}
