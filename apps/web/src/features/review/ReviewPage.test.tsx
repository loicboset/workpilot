import { Time, today } from '@internationalized/date'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { newSpaceRowFields } from '@/data/localWrites'
import { db } from '@/db/db'
import type { Space } from '@/db/types'
import { momentOf } from '@/lib/dates'
import { startFakeServer } from '@/test/fakeServer'
import { renderApp, seedProfile, seedSpace } from '@/test/renderApp'

const ZONE = 'Europe/Zurich' // seedProfile's timezone

let space: Space

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedProfile('Ada')
  space = await seedSpace()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** A note written `daysAgo` days ago at the given time, in the profile's timezone. */
const noteAt = (daysAgo: number, hour: number, minute: number, content: string) => {
  const created_at = momentOf(today(ZONE).subtract({ days: daysAgo }), new Time(hour, minute), ZONE)
  return db.notes.put({
    ...newSpaceRowFields(space.id),
    created_at,
    title: null,
    content,
    milestone_id: null,
  })
}

const seedWeek = async () => {
  await noteAt(0, 8, 5, 'Released: email-less users')
  await noteAt(2, 16, 40, 'The editor prefers mornings\nCall before noon')
  await noteAt(6, 9, 15, 'First day of the week')
  await noteAt(7, 10, 0, 'Too old for this week')
}

it('lists the notes of the last 7 days on the homepage, each after its day and time', async () => {
  await seedWeek()
  startFakeServer({ signedIn: true })
  renderApp('/personal')

  const card = await screen.findByRole('region', { name: 'Review' })
  const list = await within(card).findByRole('list', { name: 'Your notes of the last 7 days' })
  const rows = within(list).getAllByRole('listitem')
  expect(rows.map((row) => row.textContent)).toEqual([
    expect.stringMatching(/8:05.*Released: email-less users/),
    expect.stringMatching(/4:40.*The editor prefers mornings/),
    expect.stringMatching(/9:15.*First day of the week/),
  ])
  expect(within(card).queryByText(/Too old/)).toBeNull()
  expect(within(card).queryByText('How are you arriving at the end of the week?')).toBeNull()
})

it('opens the review page from the card, with the notes day by day', async () => {
  await seedWeek()
  startFakeServer({ signedIn: true })
  renderApp('/personal')

  const card = await screen.findByRole('region', { name: 'Review' })
  await userEvent.click(within(card).getByRole('link', { name: 'Review' }))
  expect(await screen.findByRole('heading', { level: 1, name: 'Review' })).toBeTruthy()

  expect(await screen.findAllByRole('region')).toHaveLength(3) // one per day with notes
  const twoDaysAgo = screen.getAllByRole('region')[1]
  expect(
    within(twoDaysAgo).getByText(/The editor prefers mornings\s+Call before noon/),
  ).toBeTruthy()
  expect(screen.queryByText(/Too old/)).toBeNull()
  expect(screen.getByRole('link', { name: 'All your ideas and notes' })).toBeTruthy()
})

it('says so when there is no note this week', async () => {
  await noteAt(9, 10, 0, 'Long ago')
  startFakeServer({ signedIn: true })
  renderApp('/personal/review')

  expect(
    await screen.findByText('No notes these last 7 days. /note in the capture bar writes one.'),
  ).toBeTruthy()
})
