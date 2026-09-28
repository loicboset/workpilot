import { describe, expect, it } from 'vitest'
import { retryDelay } from './scheduler'

describe('retryDelay', () => {
  it('doubles after each failure, up to five minutes', () => {
    expect([0, 1, 2, 3].map(retryDelay)).toEqual([1_000, 2_000, 4_000, 8_000])
    expect(retryDelay(20)).toBe(5 * 60_000)
  })
})
