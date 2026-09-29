import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui/TextField'
import { SPACE_NAME_MAX_LENGTH, spaceNameProblem } from '@/data/spaces'
import type { Space } from '@/db/types'

type SpaceNameFieldProps = {
  value: string
  onChange: (value: string) => void
  /** Every space, archived included: names are unique whatever their case and accents. */
  spaces: Space[]
  /** The space being renamed, whose own name is fine. */
  renaming?: Space
  autoFocus?: boolean
}

/** A space's name, which is also its URL: says at once when it can't be used. */
export const SpaceNameField = ({
  value,
  onChange,
  spaces,
  renaming,
  autoFocus,
}: SpaceNameFieldProps) => {
  // HOOKS
  const { t } = useTranslation()

  // VARS
  const problem = spaceNameProblem(value, spaces, renaming)

  return (
    <TextField
      label={t('spaces.name')}
      placeholder={t('spaces.namePlaceholder')}
      value={value}
      onChange={onChange}
      maxLength={SPACE_NAME_MAX_LENGTH}
      isRequired
      autoFocus={autoFocus}
      isInvalid={problem !== null}
      errorMessage={problem ? t(`spaces.problems.${problem}`) : undefined}
    />
  )
}
