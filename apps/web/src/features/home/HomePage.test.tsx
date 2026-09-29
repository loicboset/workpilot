import { Time, today } from '@internationalized/date'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { newSpaceRowFields } from '@/data/localWrites'
import { db } from '@/db/db'
import type { Space } from '@/db/types'
import { useCaptureBar } from '@/features/capture/captureStore'
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
  useCaptureBar.setState({ isOpen: false }) // it's app-wide state
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const at = (hour: number, minute: number) => momentOf(today(ZONE), new Time(hour, minute), ZONE)

const openHome = async () => {
  startFakeServer({ signedIn: true })
  renderApp('/personal')
  await screen.findByRole('heading', { name: 'Hi Ada,' })
}

it('has the cards of the Grove concept', async () => {
  await openHome()
  const cards = [
    'Capture',
    'Today',
    'Direction',
    'Review',
    'Opportunities',
    'Learning',
    'Connectors',
  ]
  for (const name of cards) {
    expect(screen.getByRole('region', { name })).toBeTruthy()
  }
})

it("opens a card's page from its title; the arrow and the logo lead back home", async () => {
  await openHome()
  const card = screen.getByRole('region', { name: 'Today' })
  await userEvent.click(within(card).getByRole('link', { name: 'Today' }))
  expect(await screen.findByRole('heading', { level: 1, name: 'Today' })).toBeTruthy()

  await userEvent.click(screen.getByRole('link', { name: 'Back to home' }))
  await screen.findByRole('heading', { name: 'Hi Ada,' })

  await userEvent.click(
    within(screen.getByRole('region', { name: 'Direction' })).getByRole('link', {
      name: 'Direction',
    }),
  )
  expect(await screen.findByRole('heading', { level: 1, name: 'Direction' })).toBeTruthy()

  await userEvent.click(screen.getByRole('link', { name: 'WorkPilot' }))
  await screen.findByRole('heading', { name: 'Hi Ada,' })
})

it('shows the day with the next thing to do standing out, and ticks it', async () => {
  const deepWork = {
    ...newSpaceRowFields(space.id),
    title: 'Deep work',
    start_at: at(9, 0),
    end_at: at(11, 0),
  }
  await db.time_blocks.bulkPut([
    {
      ...newSpaceRowFields(space.id),
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
    ...newSpaceRowFields(space.id),
    title: 'Finish my first novel',
    description: null,
    target_date: null,
  }
  await db.north_stars.put(northStar)
  const milestone = (title: string, position: number, fields = {}) => ({
    ...newSpaceRowFields(space.id),
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
