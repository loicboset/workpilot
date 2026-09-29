/**
 * AI settings (ADR 0026), one set per space (ADR 0031): server-only data, so TanStack Query
 * rather than Dexie.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, request } from '@/api/client'
import { useSpace } from '@/data/currentSpace'

export type AIProviderKind = 'openai_compatible' | 'anthropic'

export interface AISettings {
  provider: AIProviderKind | null
  base_url: string | null
  model: string | null
  has_api_key: boolean
}

/** What to change. `api_key`: a new key, `null` to remove it, absent to keep it. */
export interface AISettingsChanges {
  provider?: AIProviderKind | null
  base_url?: string | null
  model?: string | null
  api_key?: string | null
}

const aiSettingsKey = (spaceId: string) => ['ai-settings', spaceId] as const

/** The page's space's AI settings. */
export function useAISettings() {
  const { id } = useSpace()
  return useQuery({
    queryKey: aiSettingsKey(id),
    queryFn: () => request<AISettings>('GET', `/spaces/${id}/ai/settings`),
  })
}

export function useSaveAISettings() {
  const { id } = useSpace()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (changes: AISettingsChanges) =>
      request<AISettings>('PATCH', `/spaces/${id}/ai/settings`, changes),
    onSuccess: (saved) => queryClient.setQueryData(aiSettingsKey(id), saved),
  })
}

/** Settings to test before saving them. Without `api_key`, the stored key is used. */
export type AISettingsTry = {
  provider: AIProviderKind
  base_url: string | null
  api_key?: string
}

/**
 * The models these settings offer, without saving them: tests the URL and the key (the space's
 * stored key when none is typed).
 */
export const tryAISettings = (spaceId: string, settings: AISettingsTry): Promise<string[]> =>
  request<string[]>('POST', `/spaces/${spaceId}/ai/models/try`, settings)

/** The translation key for a failed AI call (codes from the server, ADR 0026). */
export function aiErrorKey(error: unknown): string {
  if (error instanceof ApiError && error.code?.startsWith('ai_'))
    return `settings.ai.errors.${error.code}`
  if (error instanceof TypeError) return 'auth.signIn.errors.unreachable'
  return 'settings.ai.errors.unexpected'
}
