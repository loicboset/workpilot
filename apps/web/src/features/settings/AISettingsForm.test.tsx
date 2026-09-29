import '@/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AISettingsForm } from './AISettingsForm'

type Call = { method: string; path: string; body: unknown }

/** A stand-in for the AI routes: settings saved for LM Studio, and one model for any tried. */
const startFakeServer = () => {
  const calls: Call[] = []
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    const path = String(input)
    calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    if (method === 'GET' && path === '/api/ai/settings') {
      return json(200, {
        provider: 'openai_compatible',
        base_url: 'http://localhost:1234/v1',
        model: null,
        has_api_key: false,
      })
    }
    if (method === 'POST' && path === '/api/ai/models/try') return json(200, ['qwen3-8b'])
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

const renderForm = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <AISettingsForm />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AI settings', () => {
  it('test the settings as typed, and save nothing', async () => {
    const calls = startFakeServer()
    renderForm()

    await userEvent.click(await screen.findByRole('button', { name: 'LM Studio (Docker)' }))
    await userEvent.click(screen.getByRole('button', { name: 'Test' }))

    expect((await screen.findByText(/Connected\. 1 model available\./)).textContent).toContain(
      'Save to keep these settings.',
    )
    expect(calls).toContainEqual({
      method: 'POST',
      path: '/api/ai/models/try',
      body: { provider: 'openai_compatible', base_url: 'http://host.docker.internal:1234/v1' },
    })
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false)
  })
})
