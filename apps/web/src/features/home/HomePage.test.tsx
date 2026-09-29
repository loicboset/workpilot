import { Time, today } from '@internationalized/date'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { newRowFields } from '@/data/localWrites'
import { db } from '@/db/db'
import { useCaptureBar } from '@/features/capture/captureStore'
import { momentOf } from '@/lib/dates'
import { startFakeServer } from '@/test/fakeServer'
import { renderApp, seedProfile } from '@/test/renderApp'

const ZONE = 'Europe/Zurich' // seedProfile's timezone

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedProfile('Ada')
  useCaptureBar.setState({ isOpen: false }) // it's app-wide state
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const at = (hour: number, minute: number) => momentOf(today(ZONE), new Time(hour, minute), ZONE)

const openHome = async () => {
  startFakeServer({ signedIn: true })
  renderApp('/')
  await screen.findByRole('heading', { name: 'Hi Ada,' })
}

it('has the cards of the Grove concept', async () => {
  await openHome()
  for (const name of ['Capture', 'Today', 'Direction', 'Review', 'Opportunities', 'Learning']) {
    expect(screen.getByRole('region', { name })).toBeTruthy()
  }
})

it('shows the day with the next thing to do standing out, and ticks it', async () => {
  const deepWork = { ...newRowFields(), title: 'Deep work', start_at: at(9, 0), end_at: at(11, 0) }
  await db.time_blocks.bulkPut([
    {
      ...newRowFields(),
      title: 'Plan the day',
      start_at: at(8, 30),
      end_at: at(9, 0),
      completed_at: at(8, 55),
      milestone_id: null,
    },
    { ...deepWork, completed_at: null, milestone_id: null },
  ])
  await openHome()

  const card = screen.getByRole('region', { name: 'Today' })
  expect(await within(card).findByText('A light day · 1 block')).toBeTruthy()
  expect(within(card).getByText(/^Until 11:00/)).toBeTruthy() // the focus: first not done

  await userEvent.click(within(card).getByRole('checkbox', { name: /^Deep work/ }))
  await waitFor(async () =>
    expect((await db.time_blocks.get(deepWork.id))?.completed_at).toBeTruthy(),
  )
})

it('walks the path to the North Star: reached, here, ahead', async () => {
  const northStar = {
    ...newRowFields(),
    title: 'Finish my first novel',
    description: null,
    target_date: null,
  }
  await db.north_stars.put(northStar)
  const milestone = (title: string, position: number, fields = {}) => ({
    ...newRowFields(),
    north_star_id: northStar.id,
    title,
    description: null,
    target_date: null,
    position,
    completed_at: null,
    ...fields,
  })
  await db.milestones.bulkPut([
    milestone('First draft', 0, { completed_at: new Date().toISOString() }),
    milestone('Second draft', 1),
    milestone('Published', 2, { target_date: `${today(ZONE).year + 1}-06-30` }),
  ])
  await openHome()

  expect(await screen.findByText('Finish my first novel')).toBeTruthy()
  const here = (await screen.findByText('Second draft')).closest('li') // milestones load apart
  if (!here) throw new Error('The milestone should be a list item')
  expect(here.getAttribute('aria-current')).toBe('step')
  expect(within(here).getByText('You are here')).toBeTruthy()
  expect(screen.getByText(String(today(ZONE).year + 1))).toBeTruthy()
  expect(screen.getByRole('meter', { name: 'Time aligned this week' })).toBeTruthy()
})
