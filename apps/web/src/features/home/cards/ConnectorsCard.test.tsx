import '@/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Connector } from '@/features/connectors/connectors'
import { ConnectorsCard } from './ConnectorsCard'

type Call = { method: string; path: string; body: unknown }

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

const connector = (fields: Partial<Connector>): Connector => ({
  id: 'c1',
  kind: 'rss',
  name: 'Stratechery',
  url: 'https://stratechery.com/feed/',
  instruction: null,
  paused_at: null,
  last_checked_at: null,
  last_error: null,
  created_at: minutesAgo(600),
  updated_at: minutesAgo(600),
  ...fields,
})

/**
 * A stand-in for the connectors routes, holding `saved`. A new feed takes its title from the
 * server when it has no name; `failWith` answers every POST with that error code instead.
 */
const startFakeServer = (saved: Connector[], { failWith }: { failWith?: string } = {}) => {
  const calls: Call[] = []
  let connectors = [...saved]
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    const path = String(input)
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ method, path, body })
    const id = path.split('/').at(-1)
    if (method === 'GET' && path === '/api/connectors') return json(200, connectors)
    if (method === 'POST' && path === '/api/connectors') {
      if (failWith) return json(422, { detail: failWith })
      const added = connector({ ...body, id: 'c-new', name: body.name ?? 'The Feed' })
      connectors = [...connectors, added]
      return json(201, added)
    }
    if (method === 'PATCH') {
      const changed = { ...connectors.find((row) => row.id === id), ...body }
      connectors = connectors.map((row) => (row.id === id ? changed : row))
      return json(200, changed)
    }
    if (method === 'DELETE') {
      connectors = connectors.filter((row) => row.id !== id)
      return new Response(null, { status: 204 })
    }
    return json(404, { detail: 'not found' })
  })
  vi.stubGlobal('fetch', fetch)
  return calls
}

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const renderCard = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ConnectorsCard />
    </QueryClientProvider>,
  )
}

const list = () => screen.findByRole('list', { name: 'Your connections' })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Connectors card', () => {
  it('lists the connections with a quiet status each', async () => {
    startFakeServer([
      connector({ id: 'a', name: 'Stratechery', last_checked_at: minutesAgo(12) }),
      connector({
        id: 'b',
        name: 'Lenny',
        url: 'https://www.lenny.com/feed',
        paused_at: minutesAgo(5),
      }),
      connector({ id: 'c', name: 'Old blog', last_error: 'feed_unreachable' }),
      connector({ id: 'd', name: 'New one' }),
    ])
    renderCard()

    const rows = within(await list()).getAllByRole('listitem')
    expect(rows.map((row) => row.textContent)).toEqual([
      'Stratechery' + 'stratechery.com · Checked 12 minutes ago',
      'Lenny' + 'lenny.com · Paused',
      'Old blog' + "stratechery.com · Couldn't be reached at the last check",
      'New one' + 'stratechery.com · Not checked yet',
    ])
  })

  it('says so when nothing is connected yet', async () => {
    startFakeServer([])
    renderCard()

    expect(await screen.findByText(/Nothing connected yet/)).toBeTruthy()
  })

  it('adds a feed from a site address typed without https', async () => {
    const calls = startFakeServer([])
    renderCard()

    await userEvent.click(await screen.findByRole('button', { name: 'Add a feed' }))
    const dialog = screen.getByRole('dialog', { name: 'Add a feed' })
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Address' }),
      'example.com/feed',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }))

    expect(within(await list()).getByText('The Feed')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(calls).toContainEqual({
      method: 'POST',
      path: '/api/connectors',
      body: { kind: 'rss', url: 'https://example.com/feed', name: null, instruction: null },
    })
  })

  it("refuses what can't be a web address, and sends nothing", async () => {
    const calls = startFakeServer([])
    renderCard()

    await userEvent.click(await screen.findByRole('button', { name: 'Add a feed' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Address' }), 'blog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }))

    expect(await within(dialog).findByText(/Enter a web address/)).toBeTruthy()
    expect(calls.some((call) => call.method === 'POST')).toBe(false)
  })

  it("explains the server's answer when the address has no feed, and keeps the form", async () => {
    startFakeServer([], { failWith: 'feed_not_found' })
    renderCard()

    await userEvent.click(await screen.findByRole('button', { name: 'Add a feed' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Address' }), 'example.com')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }))

    expect((await within(dialog).findByRole('alert')).textContent).toContain(
      "There's no feed at this address.",
    )
  })

  it('changes the name and the instruction without checking the address again', async () => {
    const calls = startFakeServer([connector({})])
    renderCard()

    await userEvent.click(await screen.findByRole('button', { name: 'More for “Stratechery”' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    const dialog = screen.getByRole('dialog', { name: 'Change the feed' })
    const name = within(dialog).getByRole('textbox', { name: 'Name' })
    await userEvent.clear(name)
    await userEvent.type(name, 'Ben Thompson')
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'For your AI' }),
      'Only the AI parts',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(within(await list()).getByText('Ben Thompson')).toBeTruthy()
    expect(calls).toContainEqual({
      method: 'PATCH',
      path: '/api/connectors/c1',
      body: { name: 'Ben Thompson', instruction: 'Only the AI parts' },
    })
  })

  it('pauses a connection, resumes it, and removes it', async () => {
    const calls = startFakeServer([connector({})])
    renderCard()
    const more = () => screen.findByRole('button', { name: 'More for “Stratechery”' })

    await userEvent.click(await more())
    await userEvent.click(screen.getByRole('menuitem', { name: 'Pause' }))
    expect(await within(await list()).findByText(/Paused/)).toBeTruthy()

    await userEvent.click(await more())
    await userEvent.click(screen.getByRole('menuitem', { name: 'Resume' }))
    expect(await within(await list()).findByText(/Not checked yet/)).toBeTruthy()

    await userEvent.click(await more())
    await userEvent.click(screen.getByRole('menuitem', { name: 'Remove' }))
    expect(await screen.findByText(/Nothing connected yet/)).toBeTruthy()

    const changes = calls.filter((call) => call.method !== 'GET')
    expect(changes.map((call) => [call.method, call.path])).toEqual([
      ['PATCH', '/api/connectors/c1'],
      ['PATCH', '/api/connectors/c1'],
      ['DELETE', '/api/connectors/c1'],
    ])
    expect(changes[0].body).toEqual({ paused_at: expect.any(String) })
    expect(changes[1].body).toEqual({ paused_at: null })
    await waitFor(() => expect(screen.queryByRole('list')).toBeNull())
  })
})
