import { Compass, Flag, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MethodInfo } from '@/components/MethodInfo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Form } from '@/components/ui/Form'
import { TextField } from '@/components/ui/TextField'
import { onSubmit } from '@/lib/forms'

/**
 * A space's direction, in two steps: its North Star (required), then the milestones on the way
 * (optional). Onboarding ends with them, and so does the setup of every new space (ADR 0031).
 */

export type NorthStarDraft = { title: string; description: string }

type NorthStarStepProps = {
  value: NorthStarDraft
  onChange: (value: NorthStarDraft) => void
  onBack: () => void
  onNext: () => void
}

export const NorthStarStep = ({ value, onChange, onBack, onNext }: NorthStarStepProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <Card
      title={t('onboarding.northStar.title')}
      subtitle={t('onboarding.northStar.subtitle')}
      icon={<Compass />}
      actions={<MethodInfo method="hoshinKanri" />}
    >
      <Form onSubmit={onSubmit(onNext)}>
        <p className="text-sm leading-6 text-grove-muted">{t('onboarding.northStar.explain')}</p>
        <TextField
          label={t('direction.northStarTitle')}
          placeholder={t('onboarding.northStar.placeholder')}
          value={value.title}
          onChange={(title) => onChange({ ...value, title })}
          isRequired
          autoFocus
        />
        <TextField
          label={t('direction.northStarWhy')}
          description={t('common.optional')}
          value={value.description}
          onChange={(description) => onChange({ ...value, description })}
          multiline
        />
        <StepButtons
          onBack={onBack}
          next={t('onboarding.continue')}
          isNextDisabled={!value.title.trim()}
        />
      </Form>
    </Card>
  )
}

type MilestonesStepProps = {
  milestones: string[]
  onChange: (milestones: string[]) => void
  onBack: () => void
  onFinish: () => void
  isSaving: boolean
}

export const MilestonesStep = ({
  milestones,
  onChange,
  onBack,
  onFinish,
  isSaving,
}: MilestonesStepProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <Card
      title={t('onboarding.milestones.title')}
      subtitle={t('onboarding.milestones.subtitle')}
      icon={<Flag />}
    >
      <Form onSubmit={onSubmit(onFinish)}>
        <p className="text-sm leading-6 text-grove-muted">{t('onboarding.milestones.explain')}</p>
        {milestones.map((title, index) => (
          <TextField
            key={index}
            aria-label={t('onboarding.milestones.label', { number: index + 1 })}
            placeholder={index === 0 ? t('onboarding.milestones.placeholder') : undefined}
            value={title}
            autoFocus={index === 0}
            onChange={(value) => onChange(milestones.map((old, i) => (i === index ? value : old)))}
          />
        ))}
        <Button
          variant="quiet"
          size="sm"
          className="self-start"
          onPress={() => onChange([...milestones, ''])}
        >
          <Plus className="size-4" aria-hidden /> {t('onboarding.milestones.addAnother')}
        </Button>
        <StepButtons onBack={onBack} next={t('onboarding.finish')} isPending={isSaving} />
      </Form>
    </Card>
  )
}

type StepButtonsProps = {
  onBack: () => void
  next: string
  isNextDisabled?: boolean
  isPending?: boolean
}

export const StepButtons = ({ onBack, next, isNextDisabled, isPending }: StepButtonsProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <div className="flex gap-3">
      <Button variant="secondary" onPress={onBack}>
        {t('onboarding.back')}
      </Button>
      <Button type="submit" className="flex-1" isDisabled={isNextDisabled} isPending={isPending}>
        {next}
      </Button>
    </div>
  )
}
