import { parseDate } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { seasonOf } from './season'

describe('seasonOf', () => {
  it('follows the meteorological seasons in the north', () => {
    expect(seasonOf(parseDate('2026-09-29'), 'Europe/Zurich')).toBe('autumn')
    expect(seasonOf(parseDate('2026-12-01'), 'Europe/Paris')).toBe('winter')
    expect(seasonOf(parseDate('2026-02-28'), 'America/New_York')).toBe('winter')
    expect(seasonOf(parseDate('2026-03-01'), 'Europe/Madrid')).toBe('spring')
    expect(seasonOf(parseDate('2026-08-31'), 'Asia/Tokyo')).toBe('summer')
  })

  it('swaps them in the southern hemisphere', () => {
    expect(seasonOf(parseDate('2026-09-29'), 'Australia/Sydney')).toBe('spring')
    expect(seasonOf(parseDate('2026-01-15'), 'America/Argentina/Buenos_Aires')).toBe('summer')
    expect(seasonOf(parseDate('2026-07-01'), 'Pacific/Auckland')).toBe('winter')
  })
})
