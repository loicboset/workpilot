import { Feather } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { CaptureComposer } from '@/features/capture/CaptureComposer'

/** "Empty your mind": write it down, then Enter. A command files it: /todo, /idea, /note… */
export const CaptureCard = () => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <Card title={t('home.capture.title')} subtitle={t('home.capture.subtitle')} icon={<Feather />}>
      <CaptureComposer
        variant="card"
        label={t('home.capture.fieldLabel')}
        savedMessage={(kind) => t('home.capture.saved', { kind })}
      />
    </Card>
  )
}
