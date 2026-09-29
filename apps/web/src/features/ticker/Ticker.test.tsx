import '@/i18n'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { db } from '@/db/db'
import { Ticker } from './Ticker'

// No AI messages: the built-in English tips.
const FIRST_TIP = 'Pick the one thing that would make today feel good.'
const SECOND_TIP = "It's okay to say “not this quarter”."

beforeEach(async () => {
  await db.delete()
  await db.open()
})

/** The ring's filling stroke, whose animation ending brings the next message. */
const clockOf = (container: HTMLElement) => {
  const clock = container.querySelectorAll('circle')[1]
  if (!clock) throw new Error('The ticker has no clock')
  return clock
}

it('shows the next message when its clock has filled', async () => {
  const { container } = render(<Ticker />)
  await screen.findByText(FIRST_TIP)

  fireEvent.animationEnd(clockOf(container))
  expect(await screen.findByText(SECOND_TIP)).toBeTruthy()
  expect(screen.queryByText(FIRST_TIP)).toBeNull()
})

it('holds the clock while hovered, and while paused', async () => {
  const { container } = render(<Ticker />)
  const tip = await screen.findByText(FIRST_TIP)
  expect(clockOf(container).style.animationPlayState).toBe('running')

  await userEvent.hover(tip)
  expect(clockOf(container).style.animationPlayState).toBe('paused')
  await userEvent.unhover(tip)
  expect(clockOf(container).style.animationPlayState).toBe('running')

  await userEvent.click(screen.getByRole('button', { name: 'Pause the messages' }))
  await userEvent.unhover(tip)
  expect(screen.getByRole('button', { name: 'Play the messages' })).toBeTruthy()
  expect(clockOf(container).style.animationPlayState).toBe('paused')
})
