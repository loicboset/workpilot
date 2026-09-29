import { parseDate } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { newSpaceRowFields } from '@/data/localWrites'
import type { Milestone } from '@/db/types'
import { milestoneState, milestoneWhen } from './milestoneNote'

const TODAY = parseDate('2026-09-29')

const milestone = (fields: Partial<Milestone>): Milestone => ({
  ...newSpaceRowFields('space-personal'),
  north_star_id: 'north-star',
  title: 'A step',
  description: null,
  target_date: null,
  position: 0,
  completed_at: null,
  ...fields,
})

describe('milestoneState', () => {
  it('tells reached, "you are here" and ahead apart', () => {
    const here = milestone({ title: 'Here' })
    expect(milestoneState(milestone({ completed_at: '2026-03-27T16:00:00Z' }), here)).toBe(
      'reached',
    )
    expect(milestoneState(here, here)).toBe('here')
    expect(milestoneState(milestone({}), here)).toBe('ahead')
  })
})

describe('milestoneWhen', () => {
  it('gives the quarter of this year it was reached in', () => {
    const reached = milestone({ completed_at: '2026-06-19T15:00:00Z', target_date: '2026-12-31' })
    expect(milestoneWhen(reached, TODAY, 'Europe/Zurich')).toEqual({ quarter: 2 })
  })

  it('gives the year it was reached in, or is hoped for, when not this year', () => {
    const lastYear = milestone({ completed_at: '2025-11-02T10:00:00Z' })
    expect(milestoneWhen(lastYear, TODAY, 'Europe/Zurich')).toEqual({ year: 2025 })
    expect(milestoneWhen(milestone({ target_date: '2027-09-30' }), TODAY, 'UTC')).toEqual({
      year: 2027,
    })
  })

  it('counts the day where the user lives: 31 March, 23:30 in Zurich is still Q1', () => {
    const lateEvening = milestone({ completed_at: '2026-03-31T21:30:00Z' })
    expect(milestoneWhen(lateEvening, TODAY, 'Europe/Zurich')).toEqual({ quarter: 1 })
    expect(milestoneWhen(lateEvening, TODAY, 'Asia/Tokyo')).toEqual({ quarter: 2 })
  })

  it('has nothing to say without a date', () => {
    expect(milestoneWhen(milestone({}), TODAY, 'UTC')).toBeNull()
  })
})
