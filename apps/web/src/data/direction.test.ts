import { describe, expect, it } from 'vitest'
import { timeAligned } from './direction'

const WEEK: [number, number] = [
  Date.parse('2026-09-28T00:00:00Z'),
  Date.parse('2026-10-05T00:00:00Z'),
]

describe('time aligned this week', () => {
  it('is the share of done work linked to a milestone', () => {
    const work = [
      { completed_at: '2026-09-29T10:00:00Z', milestone_id: 'm1' },
      { completed_at: '2026-09-30T10:00:00Z', milestone_id: 'm1' },
      { completed_at: '2026-09-30T11:00:00Z', milestone_id: null },
      { completed_at: '2026-10-01T09:00:00Z', milestone_id: null },
    ]
    expect(timeAligned(work, WEEK)).toBe(0.5)
  })

  it('leaves out open work and work done in other weeks', () => {
    const work = [
      { completed_at: null, milestone_id: null },
      { completed_at: '2026-09-20T10:00:00Z', milestone_id: null },
      { completed_at: '2026-09-29T10:00:00Z', milestone_id: 'm1' },
    ]
    expect(timeAligned(work, WEEK)).toBe(1)
  })

  it('is null when nothing is done yet, so the app can say so kindly', () => {
    expect(timeAligned([{ completed_at: null, milestone_id: 'm1' }], WEEK)).toBeNull()
  })
})
