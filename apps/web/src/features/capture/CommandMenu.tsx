import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { listBoxItemStyles } from '@/components/ui/ListBox.styles'
import { COMMAND_ICONS } from './commandIcons'
import type { Command } from './parseCapture'

type CommandMenuProps = {
  id: string
  commands: Command[]
  activeCommand: Command
  /** The DOM id of each option, for the field's `aria-activedescendant`. */
  optionId: (command: Command) => string
  onHighlight: (command: Command) => void
  onPick: (command: Command) => void
  className?: string
}

/**
 * The commands matching what was typed after "/", as in Slack or Claude. The focus stays in
 * the capture field, which moves through the options (↑ ↓) and picks one (Enter, Tab).
 */
export const CommandMenu = ({
  id,
  commands,
  activeCommand,
  optionId,
  onHighlight,
  onPick,
  className,
}: CommandMenuProps) => {
  // HOOKS
  const { t } = useTranslation()
  const menuRef = useRef<HTMLUListElement>(null)
  const activeRef = useRef<HTMLLIElement>(null)

  // EFFECTS
  // On a phone, the menu can open below the fold or under the keyboard.
  // Block bodies: an effect must return nothing, and scrollIntoView can return a promise.
  useEffect(() => {
    menuRef.current?.scrollIntoView({ block: 'nearest' })
  }, [])
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeCommand])

  return (
    <ul
      ref={menuRef}
      id={id}
      role="listbox"
      aria-label={t('capture.commandsLabel')}
      className={twMerge(
        'rounded-control border border-grove-line bg-grove-card p-1 shadow-grove',
        className,
      )}
    >
      {commands.map((command) => {
        const Icon = COMMAND_ICONS[command]
        const isActive = command === activeCommand
        return (
          <li
            key={command}
            ref={isActive ? activeRef : undefined}
            id={optionId(command)}
            role="option"
            aria-selected={isActive}
            onMouseMove={() => onHighlight(command)}
            onMouseDown={(event) => event.preventDefault()} // keep the focus in the field
            onClick={() => onPick(command)}
            className={listBoxItemStyles({ isFocused: isActive, className: 'justify-start' })}
          >
            <Icon className="size-4 shrink-0 text-grove-moss" aria-hidden />
            <span className="font-semibold text-grove-moss">/{command}</span>
            <span className="truncate text-sm text-grove-muted">
              {t(`capture.commands.${command}`)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
