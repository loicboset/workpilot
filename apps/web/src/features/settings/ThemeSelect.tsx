import type { Key } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { ListBoxItem } from '@/components/ui/ListBoxItem'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { saveTheme, useTheme } from '@/data/profile'
import { isTheme, THEMES } from '@/lib/theme'

/** Light, dark, or the device's setting: saved, and shown, as soon as it's picked. */
export const ThemeSelect = () => {
  // HOOKS
  const { t } = useTranslation()
  const theme = useTheme()

  // METHODS
  const pick = (key: Key | null) => {
    if (isTheme(key)) void saveTheme(key)
  }

  if (!theme) return <Spinner label={t('common.loading')} />

  return (
    <Select
      label={t('settings.appearance.theme')}
      description={t('settings.appearance.themeHelp')}
      selectedKey={theme}
      onSelectionChange={pick}
    >
      {THEMES.map((option) => (
        <ListBoxItem key={option} id={option}>
          {t(`settings.appearance.${option}`)}
        </ListBoxItem>
      ))}
    </Select>
  )
}
