/**
 * The capture bar's language (ADR 0010): strict commands, forgiving arguments.
 *
 *   /todo Call the editor tomorrow      → a todo due tomorrow (today when no day is given)
 *   /block Deep work 9-11 friday        → a time block on Friday, 09:00–11:00
 *   /idea Automate the weekly report    → an idea
 *   /note The editor prefers mornings   → a note, kept as written (line breaks too)
 *   /icebox Redo the login              → a todo without a date, in the icebox (ADR 0029)
 *   Automate the weekly report          → no command: an idea (the inbox)
 *
 * Dates are read the same way offline and online, without AI. Date words work in English,
 * French and Spanish, whatever the app's language.
 */
import { Time, type CalendarDate } from '@internationalized/date'

export const COMMANDS = ['todo', 'block', 'idea', 'note', 'icebox'] as const
export type Command = (typeof COMMANDS)[number]

export type Capture =
  | { kind: 'todo'; title: string; dueDate: CalendarDate }
  | { kind: 'icebox'; title: string }
  | { kind: 'block'; title: string; day: CalendarDate; start: Time; end: Time }
  | { kind: 'idea'; text: string }
  | { kind: 'note'; text: string }

export type CaptureProblem = 'empty' | 'unknownCommand' | 'noTitle' | 'noTime' | 'endBeforeStart'

export type ParseResult = { capture: Capture } | { problem: CaptureProblem }

/** A block given only a start time lasts an hour. */
const DEFAULT_BLOCK_MINUTES = 60

export function parseCapture(input: string, today: CalendarDate): ParseResult {
  const text = input.trim()
  if (text === '') return { problem: 'empty' }

  const commandMatch = /^\/(\S*)\s*/.exec(text)
  const command = commandMatch ? commandMatch[1].toLowerCase() : 'idea'
  const rest = commandMatch ? text.slice(commandMatch[0].length) : text
  if (!isCommand(command)) return { problem: 'unknownCommand' }

  if (command === 'idea' || command === 'note') {
    return rest ? { capture: { kind: command, text: rest } } : { problem: 'noTitle' }
  }

  // The icebox has no dates: "friday" stays in the title.
  if (command === 'icebox') {
    const title = tidy(rest)
    return title ? { capture: { kind: 'icebox', title } } : { problem: 'noTitle' }
  }

  const { day, remaining: withoutDate } = takeDay(rest, today)
  if (command === 'todo') {
    const title = tidy(withoutDate)
    return title
      ? { capture: { kind: 'todo', title, dueDate: day ?? today } }
      : { problem: 'noTitle' }
  }

  const { range, remaining: withoutTime } = takeTimeRange(withoutDate)
  const title = tidy(withoutTime)
  if (!title) return { problem: 'noTitle' }
  if (!range) return { problem: 'noTime' }
  if (range.end.compare(range.start) <= 0) return { problem: 'endBeforeStart' }
  return { capture: { kind: 'block', title, day: day ?? today, ...range } }
}

/**
 * Commands that start with what was typed, for the command menu: "/b" → ["block"].
 * None once a space follows the command: "/block " is past choosing.
 */
export function commandsStartingWith(input: string): Command[] {
  const match = /^\/(\S*)$/.exec(input.trimStart())
  if (!match) return []
  return COMMANDS.filter((command) => command.startsWith(match[1].toLowerCase()))
}

function isCommand(value: string): value is Command {
  return (COMMANDS as readonly string[]).includes(value)
}

function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

// --- Days ------------------------------------------------------------------------------------

const TODAY_WORDS = ['today', "aujourd'hui", 'aujourd’hui', 'hoy']
const TOMORROW_WORDS = ['tomorrow', 'demain', 'mañana', 'manana']
// Monday first, as in ISO 8601.
const WEEKDAY_WORDS: string[][] = [
  ['monday', 'mon', 'lundi', 'lunes'],
  ['tuesday', 'tue', 'mardi', 'martes'],
  ['wednesday', 'wed', 'mercredi', 'miércoles', 'miercoles'],
  ['thursday', 'thu', 'jeudi', 'jueves'],
  ['friday', 'fri', 'vendredi', 'viernes'],
  ['saturday', 'sat', 'samedi', 'sábado', 'sabado'],
  ['sunday', 'sun', 'dimanche', 'domingo'],
]
// A whole word: "friday" or "friday," but not "Friday.com".
const WORD = (word: string) => new RegExp(`(^|\\s)${word}(?=[.,!?]?(\\s|$))`, 'i')

function takeDay(
  text: string,
  today: CalendarDate,
): { day: CalendarDate | null; remaining: string } {
  const iso = /(^|\s)(\d{4})-(\d{2})-(\d{2})(?=\s|$)/.exec(text)
  if (iso) {
    const day = today.set({ year: +iso[2], month: +iso[3], day: +iso[4] })
    return { day, remaining: text.replace(iso[0], ' ') }
  }

  const inDays = /(^|\s)(?:in|dans|en)\s+(\d{1,3})\s+(?:days?|jours?|días?|dias?)(?=\s|$)/i.exec(
    text,
  )
  if (inDays) {
    return { day: today.add({ days: +inDays[2] }), remaining: text.replace(inDays[0], ' ') }
  }

  for (const [words, offset] of [
    [TODAY_WORDS, 0],
    [TOMORROW_WORDS, 1],
  ] as const) {
    for (const word of words) {
      const match = WORD(word).exec(text)
      if (match) return { day: today.add({ days: offset }), remaining: text.replace(match[0], ' ') }
    }
  }

  for (const [index, words] of WEEKDAY_WORDS.entries()) {
    for (const word of words) {
      const match = WORD(word).exec(text)
      if (match) return { day: nextWeekday(today, index), remaining: text.replace(match[0], ' ') }
    }
  }
  return { day: null, remaining: text }
}

/** The next day with that weekday (0 = Monday), today included. */
function nextWeekday(today: CalendarDate, weekday: number): CalendarDate {
  const todayWeekday = (today.toDate('UTC').getUTCDay() + 6) % 7 // Monday = 0
  return today.add({ days: (weekday - todayWeekday + 7) % 7 })
}

// --- Times -----------------------------------------------------------------------------------

// 9, 9:30, 9h, 9h30, 9am, 9:30pm, 14:00
const TIME = String.raw`(\d{1,2})(?:[:h](\d{2})?)?\s*(am|pm)?`
const RANGE = new RegExp(String.raw`(^|\s)${TIME}\s*(?:-|–|—|to|à|a)\s*${TIME}(?=\s|$)`, 'i')
const SINGLE = new RegExp(
  String.raw`(^|\s)(?:at\s+|à\s+|a\s+las?\s+)?(\d{1,2})(?::(\d{2})|h(\d{2})?)\s*(am|pm)?(?=\s|$)`,
  'i',
)

function takeTimeRange(text: string): {
  range: { start: Time; end: Time } | null
  remaining: string
} {
  const range = RANGE.exec(text)
  if (range) {
    const endMeridiem = range[7]
    const start = toTime(range[2], range[3], range[4] ?? endMeridiem)
    const end = toTime(range[5], range[6], endMeridiem)
    if (start && end) return { range: { start, end }, remaining: text.replace(range[0], ' ') }
  }
  const single = SINGLE.exec(text)
  if (single) {
    const start = toTime(single[2], single[3] ?? single[4], single[5])
    if (start) {
      const end = start.add({ minutes: DEFAULT_BLOCK_MINUTES })
      const safeEnd = end.compare(start) > 0 ? end : new Time(23, 59)
      return { range: { start, end: safeEnd }, remaining: text.replace(single[0], ' ') }
    }
  }
  return { range: null, remaining: text }
}

function toTime(
  hours: string,
  minutes: string | undefined,
  meridiem: string | undefined,
): Time | null {
  let hour = Number(hours)
  const minute = minutes ? Number(minutes) : 0
  if (meridiem) {
    if (hour < 1 || hour > 12) return null
    hour = (hour % 12) + (meridiem.toLowerCase() === 'pm' ? 12 : 0)
  }
  if (hour > 23 || minute > 59) return null
  return new Time(hour, minute)
}
