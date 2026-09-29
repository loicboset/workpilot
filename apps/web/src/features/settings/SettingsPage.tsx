import { LogOut, Sparkles, SunMoon, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Form } from '@/components/ui/Form'
import { Spinner } from '@/components/ui/Spinner'
import { TextField } from '@/components/ui/TextField'
import { useSpace } from '@/data/currentSpace'
import { saveProfile, useProfile } from '@/data/profile'
import { setSpacePalette } from '@/data/spaces'
import type { Profile } from '@/db/types'
import { useSignOut } from '@/features/auth/session'
import { LanguageSelect, TimezoneComboBox } from '@/features/profile/ProfileFields'
import { SpacePageTitle } from '@/features/spaces/SpacePageTitle'
import { changeLocale } from '@/i18n'
import { AISettingsForm } from './AISettingsForm'
import { PalettePicker } from './PalettePicker'
import { ThemeSelect } from './ThemeSelect'

/**
 * A space's Settings (ADR 0031): you and light or dark, the same in every space; the space's own
 * palette and AI. Spaces themselves are managed on the start page.
 */
export function SettingsPage() {
  const { t } = useTranslation()
  const space = useSpace()
  const profile = useProfile()
  const navigate = useNavigate()
  const signOut = useSignOut()

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-2">
      <SpacePageTitle>{t('nav.settings')}</SpacePageTitle>

      <Card title={t('settings.you')} subtitle={t('settings.youShared')} icon={<UserRound />}>
        {profile ? <ProfileForm profile={profile} /> : <Spinner label={t('common.loading')} />}
      </Card>

      <Card title={t('settings.appearance.title')} icon={<SunMoon />}>
        <div className="flex flex-col gap-5">
          <ThemeSelect />
          <PalettePicker
            value={space.palette}
            onChange={(palette) => void setSpacePalette(space.id, palette)}
            description={t('settings.appearance.paletteHelpSpace', { name: space.name })}
          />
        </div>
      </Card>

      <Card
        title={t('settings.ai.title')}
        subtitle={t('settings.ai.subtitleSpace', { name: space.name })}
        icon={<Sparkles />}
      >
        <AISettingsForm />
      </Card>

      <Card title={t('settings.session')} icon={<LogOut />}>
        <Button
          variant="secondary"
          isPending={signOut.isPending}
          onPress={() => signOut.mutate(undefined, { onSuccess: () => navigate('/sign-in') })}
        >
          {t('auth.signOut')}
        </Button>
      </Card>
    </div>
  )
}

function ProfileForm({ profile }: { profile: Profile }) {
  const { t } = useTranslation()
  const [fields, setFields] = useState({
    first_name: profile.first_name,
    last_name: profile.last_name,
    locale: profile.locale,
    timezone: profile.timezone,
    city: profile.city,
  })
  const [isSaved, setSaved] = useState(false)
  const change = (changes: Partial<typeof fields>) => {
    setFields({ ...fields, ...changes })
    setSaved(false)
  }

  async function save() {
    await saveProfile({
      ...fields,
      first_name: fields.first_name.trim(),
      city: fields.city?.trim() || null,
    })
    void changeLocale(fields.locale)
    setSaved(true)
  }

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      <TextField
        label={t('profile.firstName')}
        value={fields.first_name}
        onChange={(first_name) => change({ first_name })}
        isRequired
      />
      <LanguageSelect value={fields.locale} onChange={(locale) => change({ locale })} />
      <TimezoneComboBox value={fields.timezone} onChange={(timezone) => change({ timezone })} />
      <TextField
        label={t('profile.city')}
        description={t('profile.cityHelp')}
        value={fields.city ?? ''}
        onChange={(city) => change({ city })}
      />
      {isSaved && <Alert tone="success">{t('settings.saved')}</Alert>}
      <Button type="submit" className="self-start" isDisabled={!fields.first_name.trim()}>
        {t('common.save')}
      </Button>
    </Form>
  )
}
