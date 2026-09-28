import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getHealth } from '@/api/health'
import { Card } from '@/components/Card'

type ServerStatus = 'checking' | 'ok' | 'offline'

/** Placeholder homepage: proves the wiring (i18n, styles, API proxy, TanStack Query). */
export function HomePage() {
  const { t } = useTranslation()
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth, retry: false })

  let serverStatus: ServerStatus = 'offline'
  if (health.isPending) serverStatus = 'checking'
  else if (health.isSuccess) serverStatus = 'ok'

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 p-6">
      <h1 className="font-serif text-4xl">{t('home.greeting')}</h1>
      <Card>
        <p className="text-grove-muted">{t('home.tagline')}</p>
        <p className="mt-4 text-sm">
          {t('home.apiStatus.label')}: <strong>{t(`home.apiStatus.${serverStatus}`)}</strong>
        </p>
      </Card>
    </main>
  )
}
