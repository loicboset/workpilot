import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { startSync } from '@/sync/scheduler'

export function Providers({ children }: { children: ReactNode }) {
  // TanStack Query is for server-only data (AI settings, prompts). Synced data comes from Dexie.
  const [queryClient] = useState(() => new QueryClient())

  useEffect(() => startSync(), []) // returns the stop function, run on unmount

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
