import { vi } from 'vitest'

/**
 * A stand-in for the WorkPilot API, installed as `fetch`. It knows one user and answers the
 * auth routes; sync accepts every push and has nothing to pull; there are no connectors.
 * `offline: true` makes every request fail like a browser without network.
 */
export function startFakeServer({
  password = 'right-password',
  offline = false,
  signedIn: startSignedIn = false,
} = {}) {
  let signedIn = startSignedIn

  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (offline) throw new TypeError('Failed to fetch')
    const path = String(input)
    const method = init?.method ?? 'GET'

    if (path === '/api/auth/me') {
      return signedIn ? json(200, { username: 'me' }) : json(401, { detail: 'not signed in' })
    }
    if (path === '/api/auth/login' && method === 'POST') {
      const credentials = JSON.parse(String(init?.body))
      if (credentials.password !== password) return json(401, { detail: 'wrong' })
      signedIn = true
      return new Response(null, { status: 204 })
    }
    if (path === '/api/sync/push') {
      const { changes } = JSON.parse(String(init?.body)) as { changes: { row: { id: string } }[] }
      return json(200, {
        applied: changes.map((change) => change.row.id),
        skipped: [],
        rejected: [],
      })
    }
    if (path.startsWith('/api/sync/pull'))
      return json(200, { changes: [], cursor: 0, has_more: false })
    if (path === '/api/connectors' && method === 'GET') return json(200, [])
    return json(404, { detail: 'not found' })
  })

  vi.stubGlobal('fetch', fetch)
  return { fetch }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
