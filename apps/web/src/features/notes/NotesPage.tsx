import { useTranslation } from 'react-i18next'
import { SpacePageTitle } from '@/features/spaces/SpacePageTitle'
import { IdeasCard } from './IdeasCard'
import { NotesCard } from './NotesCard'

/** Everything captured to look at later (ideas) or to keep (notes). */
export const NotesPage = () => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <div className="space-y-6 pt-2">
      <header>
        <SpacePageTitle>{t('notes.title')}</SpacePageTitle>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <IdeasCard />
        <NotesCard />
      </div>
    </div>
  )
}
