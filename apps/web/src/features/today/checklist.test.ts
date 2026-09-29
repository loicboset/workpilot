import { describe, expect, it } from 'vitest'
import { checklistProgress } from './checklist'

describe('checklistProgress', () => {
  it('counts the checklist lines and the ticked ones', () => {
    const notes = '- [ ] connect GitHub\n- [x] seeded users\n  * [X] nested\nplain line\n- a bullet'
    expect(checklistProgress(notes)).toEqual({ done: 2, total: 3 })
  })

  it('is null without a checklist', () => {
    expect(checklistProgress(null)).toBeNull()
    expect(checklistProgress('- a bullet\n[ ] not a list item')).toBeNull()
  })
})
