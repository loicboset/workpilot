import { LayoutGrid, Sprout } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router'
import { FocusLayout } from '@/app/layouts/FocusLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Form } from '@/components/ui/Form'
import { TextField } from '@/components/ui/TextField'
import { plantDirection } from '@/data/direction'
import { deviceTimeZone, saveProfile, useProfile } from '@/data/profile'
import { createSpace, spaceNameProblem, type SpaceFields } from '@/data/spaces'
import { LanguageSelect, TimezoneComboBox } from '@/features/profile/ProfileFields'
import { PalettePicker } from '@/features/settings/PalettePicker'
import { SpaceNameField } from '@/features/spaces/SpaceNameField'
import { changeLocale, currentLocale } from '@/i18n'
import { onSubmit } from '@/lib/forms'
import { applyPalette, type Palette } from '@/lib/theme'
import { MilestonesStep, NorthStarStep, StepButtons, type NorthStarDraft } from './DirectionSteps'

type Step = 'you' | 'space' | 'northStar' | 'milestones'
const STEPS: Step[] = ['you', 'space', 'northStar', 'milestones']

/**
 * Four short steps: you, your first space (ADR 0031), its North Star, the milestones on the way.
 * Nothing else is asked.
 */
export function OnboardingPage() {
  // STATES
  const [step, setStep] = useState<Step>('you')
  const [you, setYou] = useState({
    firstName: '',
    locale: currentLocale(),
    timeZone: deviceTimeZone(),
    city: '',
  })
  const [space, setSpace] = useState<SpaceFields>({ name: '', palette: 'grove' })
  const [northStar, setNorthStar] = useState<NorthStarDraft>({ title: '', description: '' })
  const [milestones, setMilestones] = useState(['', '', ''])
  const [isSaving, setSaving] = useState(false)

  // HOOKS
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profile = useProfile()

  // METHODS
  const finish = async () => {
    setSaving(true)
    await saveProfile({
      first_name: you.firstName.trim(),
      last_name: null,
      locale: you.locale,
      timezone: you.timeZone,
      city: you.city.trim() || null,
    })
    const created = await createSpace(space)
    await plantDirection(
      created.id,
      {
        title: northStar.title.trim(),
        description: northStar.description.trim() || null,
        target_date: null,
      },
      milestones,
    )
    navigate(`/${created.slug}`, { replace: true })
  }

  /** The space's colours show at once, as a preview. */
  const pickPalette = (palette: Palette) => {
    setSpace({ ...space, palette })
    applyPalette(palette)
  }

  // VARS
  const stepNumber = STEPS.indexOf(step) + 1

  if (profile) return <Navigate to="/" replace /> // already done, e.g. on another device

  return (
    <FocusLayout>
      <p className="mb-3 text-center text-sm text-grove-muted">
        {t('onboarding.step', { number: stepNumber, total: STEPS.length })}
      </p>

      {step === 'you' && (
        <Card
          title={t('onboarding.you.title')}
          subtitle={t('onboarding.you.subtitle')}
          icon={<Sprout />}
        >
          <Form onSubmit={onSubmit(() => setStep('space'))}>
            <TextField
              label={t('profile.firstName')}
              value={you.firstName}
              onChange={(firstName) => setYou({ ...you, firstName })}
              isRequired
              autoFocus
              autoComplete="given-name"
            />
            <LanguageSelect
              value={you.locale}
              onChange={(locale) => {
                setYou({ ...you, locale })
                void changeLocale(locale)
              }}
            />
            <TimezoneComboBox
              value={you.timeZone}
              onChange={(timeZone) => setYou({ ...you, timeZone })}
            />
            <TextField
              label={t('profile.city')}
              description={t('profile.cityHelp')}
              value={you.city}
              onChange={(city) => setYou({ ...you, city })}
              autoComplete="address-level2"
            />
            <Button type="submit" isDisabled={!you.firstName.trim()} className="w-full">
              {t('onboarding.continue')}
            </Button>
          </Form>
        </Card>
      )}

      {step === 'space' && (
        <Card
          title={t('onboarding.space.title')}
          subtitle={t('onboarding.space.subtitle')}
          icon={<LayoutGrid />}
        >
          <Form onSubmit={onSubmit(() => setStep('northStar'))}>
            <p className="text-sm leading-6 text-grove-muted">{t('onboarding.space.explain')}</p>
            <SpaceNameField
              value={space.name}
              onChange={(name) => setSpace({ ...space, name })}
              spaces={[]}
              autoFocus
            />
            <PalettePicker value={space.palette} onChange={pickPalette} />
            <p className="text-sm leading-6 text-grove-muted">{t('onboarding.space.later')}</p>
            <StepButtons
              onBack={() => setStep('you')}
              next={t('onboarding.continue')}
              isNextDisabled={!space.name.trim() || spaceNameProblem(space.name, []) !== null}
            />
          </Form>
        </Card>
      )}

      {step === 'northStar' && (
        <NorthStarStep
          value={northStar}
          onChange={setNorthStar}
          onBack={() => setStep('space')}
          onNext={() => setStep('milestones')}
        />
      )}

      {step === 'milestones' && (
        <MilestonesStep
          milestones={milestones}
          onChange={setMilestones}
          onBack={() => setStep('northStar')}
          onFinish={() => void finish()}
          isSaving={isSaving}
        />
      )}
    </FocusLayout>
  )
}
