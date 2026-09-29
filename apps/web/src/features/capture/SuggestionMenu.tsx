import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { PriorityIcon } from '@/components/PriorityBadge'
import { listBoxItemStyles } from '@/components/ui/ListBox.styles'
import { COMMAND_ICONS } from './commandIcons'
import { suggestionKey, type Suggestion } from './suggestions'

type SuggestionMenuProps = {
  id: string
  label: string
  suggestions: Suggestion[]
  activeSuggestion: Suggestion
  /** The DOM id of each option, for the field's `aria-activedescendant`. */
  optionId: (suggestion: Suggestion) => string
  onHighlight: (suggestion: Suggestion) => void
  onPick: (suggestion: Suggestion) => void
  className?: string
}

/**
 * The commands matching what was typed after "/", as in Slack or Claude, or the priorities
 * after "!" in a todo. The focus stays in the capture field, which moves through the options
 * (↑ ↓) and picks one (Enter, Tab).
 */
export const SuggestionMenu = ({
  id,
  label,
  suggestions,
  activeSuggestion,
  optionId,
  onHighlight,
  onPick,
  className,
}: SuggestionMenuProps) => {
  // HOOKS
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
  }, [activeSuggestion])

  return (
    <ul
      ref={menuRef}
      id={id}
      role="listbox"
      aria-label={label}
      className={twMerge(
        'rounded-control border border-grove-line bg-grove-card p-1 shadow-grove',
        className,
      )}
    >
      {suggestions.map((suggestion) => {
        const isActive = suggestionKey(suggestion) === suggestionKey(activeSuggestion)
        return (
          <li
            key={suggestionKey(suggestion)}
            ref={isActive ? activeRef : undefined}
            id={optionId(suggestion)}
            role="option"
            aria-selected={isActive}
            onMouseMove={() => onHighlight(suggestion)}
            onMouseDown={(event) => event.preventDefault()} // keep the focus in the field
            onClick={() => onPick(suggestion)}
            className={listBoxItemStyles({ isFocused: isActive, className: 'justify-start' })}
          >
            <SuggestionContent suggestion={suggestion} />
          </li>
        )
      })}
    </ul>
  )
}

/** An option: "/todo Something to do…" or "!1 High priority". */
const SuggestionContent = ({ suggestion }: { suggestion: Suggestion }) => {
  // HOOKS
  const { t } = useTranslation()

  if (suggestion.kind === 'priority') {
    return (
      <>
        <PriorityIcon priority={suggestion.priority} className="shrink-0" />
        <span className="font-semibold text-grove-moss">!{suggestion.priority}</span>
        <span className="truncate text-sm text-grove-muted">
          {t(`priority.levels.${suggestion.priority}`)}
        </span>
      </>
    )
  }

  // VARS
  const Icon = COMMAND_ICONS[suggestion.command]

  return (
    <>
      <Icon className="size-4 shrink-0 text-grove-moss" aria-hidden />
      <span className="font-semibold text-grove-moss">/{suggestion.command}</span>
      <span className="truncate text-sm text-grove-muted">
        {t(`capture.commands.${suggestion.command}`)}
      </span>
    </>
  )
}
