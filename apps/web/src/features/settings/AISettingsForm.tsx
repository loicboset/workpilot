import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ComboBox } from '@/components/ui/ComboBox'
import { Form } from '@/components/ui/Form'
import { ListBoxItem } from '@/components/ui/ListBoxItem'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { TextField } from '@/components/ui/TextField'
import { useSpace } from '@/data/currentSpace'
import { refreshTicker } from '@/data/ticker'
import {
  aiErrorKey,
  tryAISettings,
  useAISettings,
  useSaveAISettings,
  type AIProviderKind,
  type AISettings,
} from './aiSettings'

/** Common addresses, one tap away (docs/ai-providers.md). */
const PRESETS: { label: string; provider: AIProviderKind; baseUrl: string }[] = [
  { label: 'LM Studio', provider: 'openai_compatible', baseUrl: 'http://localhost:1234/v1' },
  {
    label: 'LM Studio (Docker)',
    provider: 'openai_compatible',
    baseUrl: 'http://host.docker.internal:1234/v1',
  },
  { label: 'Ollama', provider: 'openai_compatible', baseUrl: 'http://localhost:11434/v1' },
  { label: 'OpenAI', provider: 'openai_compatible', baseUrl: 'https://api.openai.com/v1' },
  { label: 'Claude', provider: 'anthropic', baseUrl: '' },
]

export function AISettingsForm() {
  const { t } = useTranslation()
  const settings = useAISettings()
  if (settings.isPending) return <Spinner label={t('common.loading')} />
  if (settings.isError) return <Alert tone="error">{t(aiErrorKey(settings.error))}</Alert>
  return <Fields saved={settings.data} />
}

type Status = { tone: 'success' | 'error'; message: string } | null

const Fields = ({ saved }: { saved: AISettings }) => {
  // STATES
  const [provider, setProvider] = useState<AIProviderKind>(saved.provider ?? 'openai_compatible')
  const [baseUrl, setBaseUrl] = useState(saved.base_url ?? '')
  const [apiKey, setApiKey] = useState('') // write-only: the stored key is never sent back
  const [model, setModel] = useState(saved.model ?? '')
  const [models, setModels] = useState<string[]>([])
  const [status, setStatus] = useState<Status>(null)
  const [isTesting, setTesting] = useState(false)

  // RQ
  const save = useSaveAISettings()

  // HOOKS
  const { t } = useTranslation()
  const space = useSpace()

  // METHODS
  const saveSettings = async () => {
    await save.mutateAsync({
      provider,
      base_url: baseUrl.trim() || null,
      model: model.trim() || null,
      ...(apiKey ? { api_key: apiKey } : {}),
    })
    setApiKey('')
    if (model.trim()) void refreshTicker(space.id)
  }

  /** List the models of the settings as typed, saving nothing: proves the address and the key. */
  const testConnection = async () => {
    setTesting(true)
    setStatus(null)
    try {
      const found = await tryAISettings(space.id, {
        provider,
        base_url: baseUrl.trim() || null,
        ...(apiKey ? { api_key: apiKey } : {}),
      })
      setModels(found)
      setStatus({ tone: 'success', message: t('settings.ai.connected', { count: found.length }) })
    } catch (error) {
      setStatus({ tone: 'error', message: t(aiErrorKey(error)) })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()
        void saveSettings().then(
          () => setStatus({ tone: 'success', message: t('settings.saved') }),
          (error) => setStatus({ tone: 'error', message: t(aiErrorKey(error)) }),
        )
      }}
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('settings.ai.presets')}>
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            size="sm"
            variant="secondary"
            onPress={() => {
              setProvider(preset.provider)
              setBaseUrl(preset.baseUrl)
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <Select
        label={t('settings.ai.provider')}
        selectedKey={provider}
        onSelectionChange={(key) => setProvider(key as AIProviderKind)}
      >
        <ListBoxItem id="openai_compatible">{t('settings.ai.openaiCompatible')}</ListBoxItem>
        <ListBoxItem id="anthropic">{t('settings.ai.anthropic')}</ListBoxItem>
      </Select>
      <TextField
        label={t('settings.ai.baseUrl')}
        description={
          provider === 'anthropic' ? t('settings.ai.baseUrlClaude') : t('settings.ai.baseUrlHelp')
        }
        placeholder={
          provider === 'anthropic' ? 'https://api.anthropic.com' : 'http://localhost:1234/v1'
        }
        value={baseUrl}
        onChange={setBaseUrl}
        type="url"
      />
      <TextField
        label={t('settings.ai.apiKey')}
        description={
          saved.has_api_key ? t('settings.ai.apiKeyStored') : t('settings.ai.apiKeyHelp')
        }
        value={apiKey}
        onChange={setApiKey}
        type="password"
        autoComplete="off"
      />
      <ComboBox
        label={t('settings.ai.model')}
        description={t('settings.ai.modelHelp')}
        allowsCustomValue
        inputValue={model}
        onInputChange={setModel}
        onSelectionChange={(key) => key && setModel(String(key))}
        defaultItems={models.map((id) => ({ id }))}
      >
        {(item) => <ListBoxItem id={item.id}>{item.id}</ListBoxItem>}
      </ComboBox>
      {status && <Alert tone={status.tone}>{status.message}</Alert>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" isPending={save.isPending}>
          {t('common.save')}
        </Button>
        <Button variant="secondary" onPress={() => void testConnection()} isPending={isTesting}>
          {t('settings.ai.test')}
        </Button>
      </div>
    </Form>
  )
}
