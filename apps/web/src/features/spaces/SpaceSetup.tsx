import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { FocusLayout } from '@/app/layouts/FocusLayout'
import { plantDirection } from '@/data/direction'
import type { Space } from '@/db/types'
import {
  MilestonesStep,
  NorthStarStep,
  type NorthStarDraft,
} from '@/features/onboarding/DirectionSteps'
import { SpaceMark } from './SpaceMark'

type Step = 'northStar' | 'milestones'
const STEPS: Step[] = ['northStar', 'milestones']

/**
 * A space without a North Star, e.g. just made on the start page: its North Star (required), then
 * its milestones, like the end of onboarding (ADR 0031). Once saved, the page asked for shows.
 */
export const SpaceSetup = ({ space }: { space: Space }) => {
  // STATES
  const [step, setStep] = useState<Step>('northStar')
  const [northStar, setNorthStar] = useState<NorthStarDraft>({ title: '', description: '' })
  const [milestones, setMilestones] = useState(['', '', ''])
  const [isSaving, setSaving] = useState(false)

  // HOOKS
  const { t } = useTranslation()
  const navigate = useNavigate()

  // METHODS
  const finish = async () => {
    setSaving(true)
    const fields = {
      title: northStar.title.trim(),
      description: northStar.description.trim() || null,
      target_date: null,
    }
    // Then the space's layout sees the North Star and shows its pages.
    await plantDirection(space.id, fields, milestones)
  }

  return (
    <FocusLayout>
      <p className="mb-3 flex items-center justify-center gap-2 text-sm text-grove-muted">
        <SpaceMark space={space} size="xs" />
        {t('spaces.setupStep', {
          name: space.name,
          number: STEPS.indexOf(step) + 1,
          total: STEPS.length,
        })}
      </p>
      {step === 'northStar' ? (
        <NorthStarStep
          value={northStar}
          onChange={setNorthStar}
          onBack={() => navigate('/')}
          onNext={() => setStep('milestones')}
        />
      ) : (
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
