import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db/db'
import { startFakeServer } from '@/test/fakeServer'
import { renderApp, seedProfile } from '@/test/renderApp'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('signed-in pages', () => {
  it('send a signed-out visitor to sign-in, remembering where they were going', async () => {
    startFakeServer()

    const { router } = renderApp('/?view=week')

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeTruthy()
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(router.state.location.search).toBe('?next=%2F%3Fview%3Dweek')
  })

  it('stay open offline, because the data lives on this device', async () => {
    startFakeServer({ offline: true })
    await seedProfile('Loïc')

    renderApp('/')

    expect(await screen.findByRole('heading', { name: /Loïc/ })).toBeTruthy()
  })
})

describe('sign-in', () => {
  it('asks for both fields before calling the server', async () => {
    const server = startFakeServer()
    renderApp('/sign-in')

    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }))

    expect(await screen.findAllByText('Please fill this in.')).toHaveLength(2)
    expect(server.fetch).not.toHaveBeenCalledWith('/api/auth/login', expect.anything())
  })

  it('says so calmly when the password is wrong', async () => {
    startFakeServer()
    renderApp('/sign-in')

    await signInWith('me', 'wrong-password')

    expect((await screen.findByRole('alert')).textContent).toContain("don't match")
  })

  it('goes to the page the user wanted after signing in', async () => {
    startFakeServer()
    await seedProfile('Loïc') // a returning user: no onboarding
    const { router } = renderApp('/sign-in?next=%2F%3Fview%3Dweek')

    await signInWith('me', 'right-password')

    await waitFor(() => expect(router.state.location.search).toBe('?view=week'))
    expect(router.state.location.pathname).toBe('/')
  })

  it('never follows a "next" link to another site', async () => {
    startFakeServer()
    await seedProfile('Loïc')
    const { router } = renderApp('/sign-in?next=%2F%2Fevil.example')

    await signInWith('me', 'right-password')

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })
})

async function signInWith(username: string, password: string) {
  await userEvent.type(await screen.findByLabelText('Username'), username)
  await userEvent.type(screen.getByLabelText('Password'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}
