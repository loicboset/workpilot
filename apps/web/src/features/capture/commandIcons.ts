import { Clock3, Lightbulb, ListTodo, StickyNote, type LucideIcon } from 'lucide-react'
import type { Command } from './parseCapture'

/** One icon per command, in the command menu and in the preview of what was understood. */
export const COMMAND_ICONS: Record<Command, LucideIcon> = {
  todo: ListTodo,
  block: Clock3,
  idea: Lightbulb,
  note: StickyNote,
}
