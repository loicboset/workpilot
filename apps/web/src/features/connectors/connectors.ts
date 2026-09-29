/** Connectors (ADR 0032): server-only data, so TanStack Query rather than Dexie. */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { ApiError, request } from '@/api/client'

export type ConnectorKind = 'rss'

export type Connector = {
  id: string
  kind: ConnectorKind
  name: string
  /** The feed's address, as the server found it (a site's address leads to its feed). */
  url: string
  /** What the AI should do with what comes in, e.g. "Only tell me about AI tools". */
  instruction: string | null
  paused_at: string | null
  // Written by the server only.
  last_checked_at: string | null
  /** A stable code, e.g. "feed_unreachable", when the last check failed. */
  last_error: string | null
  created_at: string
  updated_at: string
}

/** A new feed. Without a `name`, the server takes the feed's title. */
export type NewConnector = { url: string; name: string | null; instruction: string | null }

/** What to change. A new `url` is checked again by the server. */
export type ConnectorChanges = {
  url?: string
  name?: string
  instruction?: string | null
  paused_at?: string | null
}

// Moves under the space, `/spaces/{space_id}/connectors`, once spaces are built (ADR 0031).
const CONNECTORS_PATH = '/connectors'
const CONNECTORS_KEY = ['connectors']

/** The errors the server explains with a code (ADR 0032). */
const ERROR_CODES = ['feed_unreachable', 'feed_not_found', 'connector_exists']

export const useConnectors = () =>
  useQuery({
    queryKey: CONNECTORS_KEY,
    queryFn: () => request<Connector[]>('GET', CONNECTORS_PATH),
  })

export const useAddConnector = () => {
  // HOOKS
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (connector: NewConnector) =>
      request<Connector>('POST', CONNECTORS_PATH, { kind: 'rss', ...connector }),
    onSuccess: (added) => setConnectors(queryClient, (list) => [...list, added]),
  })
}

export const useUpdateConnector = () => {
  // HOOKS
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: ConnectorChanges }) =>
      request<Connector>('PATCH', `${CONNECTORS_PATH}/${id}`, changes),
    onSuccess: (saved) =>
      setConnectors(queryClient, (list) =>
        list.map((connector) => (connector.id === saved.id ? saved : connector)),
      ),
  })
}

export const useDeleteConnector = () => {
  // HOOKS
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => request<void>('DELETE', `${CONNECTORS_PATH}/${id}`),
    onSuccess: (_, id) =>
      setConnectors(queryClient, (list) => list.filter((connector) => connector.id !== id)),
  })
}

/** Change the cached list, if it was loaded, so the card shows the change straight away. */
const setConnectors = (queryClient: QueryClient, change: (list: Connector[]) => Connector[]) =>
  queryClient.setQueryData<Connector[]>(CONNECTORS_KEY, (list) => list && change(list))

/** The translation key for a failed call: the server's code, being offline, or the unexpected. */
export const connectorErrorKey = (error: unknown): string => {
  if (error instanceof ApiError && error.code && ERROR_CODES.includes(error.code))
    return `connectors.errors.${error.code}`
  if (error instanceof TypeError) return 'connectors.errors.offline'
  return 'connectors.errors.unexpected'
}

/**
 * The address as typed, made a web address: "example.com/feed" becomes
 * "https://example.com/feed". `null` when it can't be one.
 */
export const toWebAddress = (typed: string): string | null => {
  const trimmed = typed.trim()
  if (!trimmed) return null
  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
  try {
    const url = new URL(hasScheme ? trimmed : `https://${trimmed}`)
    const isWeb = url.protocol === 'https:' || url.protocol === 'http:'
    // Without a scheme, a word alone ("blog") is a typo, not a host; "http://localhost" is fine.
    return isWeb && (hasScheme || url.hostname.includes('.')) ? url.href : null
  } catch {
    return null
  }
}

/** "example.com" for "https://www.example.com/feed.xml", to tell feeds apart at a glance. */
export const siteOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
