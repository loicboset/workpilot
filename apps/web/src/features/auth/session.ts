/**
 * The signed-in session (ADR 0002, 0003). It lives in a cookie set by the server, so the app
 * only asks who is signed in. Server-only data, hence TanStack Query rather than Dexie.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, request } from '@/api/client'

export interface Session {
  username: string
}

export interface Credentials {
  username: string
  password: string
}

export const SESSION_QUERY_KEY = ['session'] as const

/** Who is signed in. Fails with a 401 `ApiError` when no one is, or a `TypeError` offline. */
export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => request<Session>('GET', '/auth/me'),
    retry: false,
    staleTime: 5 * 60_000,
  })
}

export function isSignedOut(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

export function useSignIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credentials: Credentials) => request<void>('POST', '/auth/login', credentials),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => request<void>('POST', '/auth/logout'),
    onSuccess: () => queryClient.resetQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}
