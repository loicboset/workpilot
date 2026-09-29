import { Cable, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ConnectorForm } from '@/features/connectors/ConnectorForm'
import { ConnectorRow } from '@/features/connectors/ConnectorRow'
import { useConnectors } from '@/features/connectors/connectors'
import { useMinuteClock } from '@/lib/useMinuteClock'
import { HomeCard } from '../HomeCard'

/** The sources the AI can read (ADR 0032): only to make and manage them, not to read them. */
export const ConnectorsCard = () => {
  // STATES
  const [isAdding, setAdding] = useState(false)

  // RQ
  const connectors = useConnectors()

  // HOOKS
  const { t } = useTranslation()
  const now = useMinuteClock()

  return (
    <HomeCard
      title={t('connectors.title')}
      aside={t('connectors.subtitle')}
      icon={<Cable />}
      tone="moss"
      footer={
        <Button size="sm" variant="secondary" onPress={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden />
          {t('connectors.add')}
        </Button>
      }
    >
      {connectors.isPending && <Spinner label={t('common.loading')} className="text-grove-moss" />}
      {connectors.isError && (
        <p className="text-sm text-grove-muted">
          {connectors.error instanceof TypeError
            ? t('connectors.errors.offline')
            : t('connectors.unavailable')}
        </p>
      )}
      {connectors.data?.length === 0 && (
        <p className="text-sm text-grove-muted">{t('connectors.empty')}</p>
      )}
      {connectors.data && connectors.data.length > 0 && (
        // The card grows with the list, up to about six connections; past that the list scrolls.
        <ul
          aria-label={t('connectors.list')}
          className="-mt-1 max-h-96 divide-y divide-grove-line overflow-y-auto"
        >
          {connectors.data.map((connector) => (
            <ConnectorRow key={connector.id} connector={connector} now={now.getTime()} />
          ))}
        </ul>
      )}
      <ConnectorForm isOpen={isAdding} onOpenChange={setAdding} />
    </HomeCard>
  )
}
