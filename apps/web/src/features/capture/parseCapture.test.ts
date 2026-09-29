import { CalendarDate, Time } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { commandsStartingWith, parseCapture } from './parseCapture'

// Wednesday 30 September 2026.
const TODAY = new CalendarDate(2026, 9, 30)

describe('commands', () => {
  it('plain text is an idea, the inbox', () => {
    expect(parseCapture('Automate the weekly report', TODAY)).toEqual({
      capture: { kind: 'idea', text: 'Automate the weekly report' },
    })
  })

  it('commands are strict: an unknown one is refused, not guessed', () => {
    expect(parseCapture('/task Buy milk', TODAY)).toEqual({ problem: 'unknownCommand' })
  })

  it('commands ignore capitals', () => {
    expect(parseCapture('/TODO Buy milk', TODAY)).toMatchObject({ capture: { kind: 'todo' } })
  })

  it('completes a command from its first letters', () => {
    expect(commandsStartingWith('/b')).toEqual(['block'])
    expect(commandsStartingWith('/')).toEqual(['todo', 'block', 'idea', 'note'])
    expect(commandsStartingWith('/todo')).toEqual(['todo'])
  })

  it('stops completing once a space follows the command', () => {
    expect(commandsStartingWith('/todo ')).toEqual([])
    expect(commandsStartingWith('/todo Buy')).toEqual([])
    expect(commandsStartingWith('Buy milk')).toEqual([])
  })

  it('needs something to capture', () => {
    expect(parseCapture('   ', TODAY)).toEqual({ problem: 'empty' })
    expect(parseCapture('/todo tomorrow', TODAY)).toEqual({ problem: 'noTitle' })
  })
})

describe('/todo', () => {
  it.each([
    ['Call the editor', null],
    ['Call the editor today', TODAY],
    ['Call the editor tomorrow', new CalendarDate(2026, 10, 1)],
    ['Appeler l’éditeur demain', new CalendarDate(2026, 10, 1)],
    ['Llamar al editor mañana', new CalendarDate(2026, 10, 1)],
    ['Call the editor friday', new CalendarDate(2026, 10, 2)],
    ['Appeler l’éditeur lundi', new CalendarDate(2026, 10, 5)],
    ['Call the editor wednesday', TODAY], // today counts
    ['Call the editor in 3 days', new CalendarDate(2026, 10, 3)],
    ['Appeler l’éditeur dans 10 jours', new CalendarDate(2026, 10, 10)],
    ['Call the editor 2026-11-02', new CalendarDate(2026, 11, 2)],
  ])('"%s"', (text, dueDate) => {
    const title = text.split(
      / (today|tomorrow|demain|mañana|friday|lundi|wednesday|in|dans|2026)/,
    )[0]
    expect(parseCapture(`/todo ${text}`, TODAY)).toEqual({
      capture: { kind: 'todo', title, dueDate },
    })
  })

  it('only takes whole words as dates', () => {
    expect(parseCapture('/todo Read Monday.com docs', TODAY)).toMatchObject({
      capture: { title: 'Read Monday.com docs', dueDate: null },
    })
  })
})

describe('/block', () => {
  it.each([
    ['Deep work 9-11', new Time(9), new Time(11)],
    ['Deep work 9:30-11:00', new Time(9, 30), new Time(11)],
    ['Deep work 14:00–15:30', new Time(14), new Time(15, 30)],
    ['Travail profond 9h-11h30', new Time(9), new Time(11, 30)],
    ['Deep work 2pm-4pm', new Time(14), new Time(16)],
    ['Deep work 10-11am', new Time(10), new Time(11)],
    ['Deep work 9:00', new Time(9), new Time(10)], // one hour when only the start is given
    ['Deep work at 16h', new Time(16), new Time(17)],
  ])('"%s"', (text, start, end) => {
    expect(parseCapture(`/block ${text}`, TODAY)).toEqual({
      capture: { kind: 'block', title: text.split(/ (\d|at )/)[0], day: TODAY, start, end },
    })
  })

  it('takes a day too', () => {
    expect(parseCapture('/block Lunch walk 12:30-13:15 tomorrow', TODAY)).toEqual({
      capture: {
        kind: 'block',
        title: 'Lunch walk',
        day: new CalendarDate(2026, 10, 1),
        start: new Time(12, 30),
        end: new Time(13, 15),
      },
    })
  })

  it('says what is missing', () => {
    expect(parseCapture('/block Deep work', TODAY)).toEqual({ problem: 'noTime' })
    expect(parseCapture('/block Deep work 11-9', TODAY)).toEqual({ problem: 'endBeforeStart' })
    expect(parseCapture('/block 9-11', TODAY)).toEqual({ problem: 'noTitle' })
  })
})

describe('/note', () => {
  it('keeps the note as written, dates and line breaks included', () => {
    expect(parseCapture('/note The editor prefers mornings,\nsee you tomorrow', TODAY)).toEqual({
      capture: { kind: 'note', text: 'The editor prefers mornings,\nsee you tomorrow' },
    })
  })

  it('needs something to keep', () => {
    expect(parseCapture('/note   ', TODAY)).toEqual({ problem: 'noTitle' })
  })
})
