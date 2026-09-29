/** AI settings (ADR 0026): server-only data, so TanStack Query rather than Dexie. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, request } from '@/api/client'

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

const AI_SETTINGS_KEY = ['ai-settings'] as const

export function useAISettings() {
  return useQuery({
    queryKey: AI_SETTINGS_KEY,
    queryFn: () => request<AISettings>('GET', '/ai/settings'),
  })
}

export function useSaveAISettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (changes: AISettingsChanges) =>
      request<AISettings>('PATCH', '/ai/settings', changes),
    onSuccess: (saved) => queryClient.setQueryData(AI_SETTINGS_KEY, saved),
  })
}

/** Settings to test before saving them. Without `api_key`, the stored key is used. */
export type AISettingsTry = {
  provider: AIProviderKind
  base_url: string | null
  api_key?: string
}

/** The models these settings offer, without saving them: tests the URL and the key. */
export const tryAISettings = (settings: AISettingsTry): Promise<string[]> =>
  request<string[]>('POST', '/ai/models/try', settings)

/** The translation key for a failed AI call (codes from the server, ADR 0026). */
export function aiErrorKey(error: unknown): string {
  if (error instanceof ApiError && error.code?.startsWith('ai_'))
    return `settings.ai.errors.${error.code}`
  if (error instanceof TypeError) return 'auth.signIn.errors.unreachable'
  return 'settings.ai.errors.unexpected'
}
