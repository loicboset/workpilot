/** Fields shared by onboarding and settings: language and timezone. */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ComboBox } from '@/components/ui/ComboBox'
import { ListBoxItem } from '@/components/ui/ListBoxItem'
import { Select } from '@/components/ui/Select'
import { SUPPORTED_LOCALES, type Locale } from '@/i18n'

// Each language in its own words, so anyone finds theirs.
const LANGUAGE_NAMES: Record<Locale, string> = { en: 'English', fr: 'Français', es: 'Español' }

export function LanguageSelect({
  value,
  onChange,
}: {
  value: Locale
  onChange: (locale: Locale) => void
}) {
  const { t } = useTranslation()
  return (
    <Select
      label={t('profile.language')}
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as Locale)}
    >
      {SUPPORTED_LOCALES.map((locale) => (
        <ListBoxItem key={locale} id={locale}>
          {LANGUAGE_NAMES[locale]}
        </ListBoxItem>
      ))}
    </Select>
  )
}

export function TimezoneComboBox({
  value,
  onChange,
}: {
  value: string
  onChange: (timeZone: string) => void
}) {
  const { t } = useTranslation()
  const zones = useMemo(
    () =>
      Intl.supportedValuesOf('timeZone').map((zone) => ({
        id: zone,
        name: zone.replaceAll('_', ' '),
      })),
    [],
  )
  return (
    <ComboBox
      label={t('profile.timezone')}
      description={t('profile.timezoneHelp')}
      defaultItems={zones}
      selectedKey={value}
      onSelectionChange={(key) => key && onChange(String(key))}
    >
      {(zone) => <ListBoxItem id={zone.id}>{zone.name}</ListBoxItem>}
    </ComboBox>
  )
}
