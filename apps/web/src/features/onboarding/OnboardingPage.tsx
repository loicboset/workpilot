import { Compass, Flag, Plus, Sprout } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router'
import { FocusLayout } from '@/app/layouts/FocusLayout'
import { MethodInfo } from '@/components/MethodInfo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Form } from '@/components/ui/Form'
import { TextField } from '@/components/ui/TextField'
import { addMilestone, saveNorthStar } from '@/data/direction'
import { deviceTimeZone, saveProfile, useProfile } from '@/data/profile'
import { changeLocale, currentLocale } from '@/i18n'
import { LanguageSelect, TimezoneComboBox } from '@/features/profile/ProfileFields'

type Step = 'you' | 'northStar' | 'milestones'
const STEPS: Step[] = ['you', 'northStar', 'milestones']

/** Three short steps: you, your North Star, the milestones on the way. Nothing else is asked. */
export function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profile = useProfile()
  const [step, setStep] = useState<Step>('you')
  const [you, setYou] = useState({
    firstName: '',
    locale: currentLocale(),
    timeZone: deviceTimeZone(),
    city: '',
  })
  const [northStar, setNorthStar] = useState({ title: '', description: '' })
  const [milestones, setMilestones] = useState(['', '', ''])
  const [isSaving, setSaving] = useState(false)

  if (profile) return <Navigate to="/" replace /> // already done, e.g. on another device

  async function finish() {
    setSaving(true)
    await saveProfile({
      first_name: you.firstName.trim(),
      last_name: null,
      locale: you.locale,
      timezone: you.timeZone,
      city: you.city.trim() || null,
    })
    const star = await saveNorthStar({
      title: northStar.title.trim(),
      description: northStar.description.trim() || null,
      target_date: null,
    })
    for (const title of milestones.filter((milestone) => milestone.trim())) {
      await addMilestone(star.id, { title })
    }
    navigate('/', { replace: true })
  }

  const stepNumber = STEPS.indexOf(step) + 1
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
          <Form onSubmit={onSubmit(() => setStep('northStar'))}>
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

      {step === 'northStar' && (
        <Card
          title={t('onboarding.northStar.title')}
          subtitle={t('onboarding.northStar.subtitle')}
          icon={<Compass />}
          actions={<MethodInfo method="hoshinKanri" />}
        >
          <Form onSubmit={onSubmit(() => setStep('milestones'))}>
            <p className="text-sm leading-6 text-grove-muted">
              {t('onboarding.northStar.explain')}
            </p>
            <TextField
              label={t('direction.northStarTitle')}
              placeholder={t('onboarding.northStar.placeholder')}
              value={northStar.title}
              onChange={(title) => setNorthStar({ ...northStar, title })}
              isRequired
              autoFocus
            />
            <TextField
              label={t('direction.northStarWhy')}
              description={t('common.optional')}
              value={northStar.description}
              onChange={(description) => setNorthStar({ ...northStar, description })}
              multiline
            />
            <StepButtons
              onBack={() => setStep('you')}
              next={t('onboarding.continue')}
              isNextDisabled={!northStar.title.trim()}
            />
          </Form>
        </Card>
      )}

      {step === 'milestones' && (
        <Card
          title={t('onboarding.milestones.title')}
          subtitle={t('onboarding.milestones.subtitle')}
          icon={<Flag />}
        >
          <Form onSubmit={onSubmit(() => void finish())}>
            <p className="text-sm leading-6 text-grove-muted">
              {t('onboarding.milestones.explain')}
            </p>
            {milestones.map((title, index) => (
              <TextField
                key={index}
                aria-label={t('onboarding.milestones.label', { number: index + 1 })}
                placeholder={index === 0 ? t('onboarding.milestones.placeholder') : undefined}
                value={title}
                autoFocus={index === 0}
                onChange={(value) =>
                  setMilestones(milestones.map((old, i) => (i === index ? value : old)))
                }
              />
            ))}
            <Button
              variant="quiet"
              size="sm"
              className="self-start"
              onPress={() => setMilestones([...milestones, ''])}
            >
              <Plus className="size-4" aria-hidden /> {t('onboarding.milestones.addAnother')}
            </Button>
            <StepButtons
              onBack={() => setStep('northStar')}
              next={t('onboarding.finish')}
              isPending={isSaving}
            />
          </Form>
        </Card>
      )}
    </FocusLayout>
  )
}

/** Handle a form's submit in the app, instead of the browser sending it. */
function onSubmit(action: () => void) {
  return (event: FormEvent) => {
    event.preventDefault()
    action()
  }
}

function StepButtons(props: {
  onBack: () => void
  next: string
  isNextDisabled?: boolean
  isPending?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex gap-3">
      <Button variant="secondary" onPress={props.onBack}>
        {t('onboarding.back')}
      </Button>
      <Button
        type="submit"
        className="flex-1"
        isDisabled={props.isNextDisabled}
        isPending={props.isPending}
      >
        {props.next}
      </Button>
    </div>
  )
}
