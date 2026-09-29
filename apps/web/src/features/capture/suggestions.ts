import type { Priority } from '@/lib/priority'
import { commandsStartingWith, prioritiesToOffer, withPriority, type Command } from './parseCapture'

/** An option of the capture field's menu: a command after "/", a priority after "!". */
export type Suggestion =
  { kind: 'command'; command: Command } | { kind: 'priority'; priority: Priority }

/** What the menu offers for the text typed so far: commands, priorities, or nothing. */
export const suggestionsFor = (input: string): Suggestion[] => {
  const commands = commandsStartingWith(input)
  if (commands.length > 0) {
    return commands.map((command): Suggestion => ({ kind: 'command', command }))
  }
  return prioritiesToOffer(input).map((priority): Suggestion => ({ kind: 'priority', priority }))
}

/** The text once a suggestion is picked: "/b" → "/block ", "/todo Call !" → "/todo Call !1 ". */
export const applySuggestion = (input: string, suggestion: Suggestion): string =>
  suggestion.kind === 'command'
    ? `/${suggestion.command} `
    : withPriority(input, suggestion.priority)

/** Unique among the suggestions shown together, for React keys and option ids. */
export const suggestionKey = (suggestion: Suggestion): string =>
  suggestion.kind === 'command' ? suggestion.command : `priority-${suggestion.priority}`
