import { describe, expect, it } from 'vitest'
import { newSpaceRowFields } from '@/data/localWrites'
import type { TimeBlock, Todo } from '@/db/types'
import { dayItems, dayLoad, focusItem } from './dayTimeline'

const block = (title: string, from: string, until: string, done = false): TimeBlock => ({
  ...newSpaceRowFields('space-personal'),
  title,
  start_at: `2026-09-29T${from}:00Z`,
  end_at: `2026-09-29T${until}:00Z`,
  completed_at: done ? '2026-09-29T08:55:00Z' : null,
  milestone_id: null,
})

const todo = (title: string, done = false): Todo => ({
  ...newSpaceRowFields('space-personal'),
  title,
  notes: null,
  due_date: '2026-09-29',
  completed_at: done ? '2026-09-29T10:00:00Z' : null,
  milestone_id: null,
})

describe('the day on the Today card', () => {
  it('lists the time blocks, then the todos', () => {
    const items = dayItems([block('Plan the day', '08:30', '09:00')], [todo('Call the editor')])
    expect(items.map((item) => [item.kind, item.title])).toEqual([
      ['block', 'Plan the day'],
      ['todo', 'Call the editor'],
    ])
  })

  it('puts the focus on the first thing not done, even when its time has passed', () => {
    const items = dayItems(
      [block('Plan the day', '08:30', '09:00', true), block('Deep work', '09:00', '11:00')],
      [todo('Call the editor')],
    )
    expect(focusItem(items)?.title).toBe('Deep work')
    expect(focusItem(dayItems([block('Plan the day', '08:30', '09:00', true)], []))).toBeUndefined()
  })

  it('calls a day free, light (up to 5 hours of blocks) or full', () => {
    expect(dayLoad([], [])).toBe('free')
    expect(dayLoad([], [todo('Call the editor')])).toBe('light')
    expect(dayLoad([block('Deep work', '09:00', '14:00')], [])).toBe('light')
    expect(dayLoad([block('Deep work', '09:00', '14:30')], [])).toBe('full')
  })
})
