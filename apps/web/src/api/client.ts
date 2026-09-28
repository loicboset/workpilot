/** Thin HTTP client for the WorkPilot API. Every server call goes through /api. */

export class ApiError extends Error {
  readonly status: number
  /** The server's `detail` when it is a stable code, e.g. "ai_unreachable" (ADR 0026). */
  readonly code: string | undefined

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Call the API and return its JSON. Throws `ApiError` for an error status, and the browser's
 * `TypeError` when the server can't be reached (e.g. offline).
 */
export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    const detail = await errorDetail(response)
    throw new ApiError(response.status, `${method} ${path} failed with ${response.status}`, detail)
  }
  return (response.status === 204 ? undefined : await response.json()) as T
}

async function errorDetail(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { detail?: unknown }
    return typeof body.detail === 'string' ? body.detail : undefined
  } catch {
    return undefined
  }
}
