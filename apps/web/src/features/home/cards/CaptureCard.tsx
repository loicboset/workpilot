import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CaptureComposer } from '@/features/capture/CaptureComposer'
import { HomeCard } from '../HomeCard'

/** "Empty your mind": write it down, then Enter. A command files it: /todo, /idea, /note… */
export const CaptureCard = () => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <HomeCard
      title={t('home.capture.title')}
      href="/notes"
      aside={t('home.capture.subtitle')}
      icon={<Pencil />}
      tone="sand"
    >
      <CaptureComposer
        variant="card"
        label={t('home.capture.fieldLabel')}
        savedMessage={(kind) => t('home.capture.saved', { kind })}
      />
    </HomeCard>
  )
}
