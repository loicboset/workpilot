import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Form } from '@/components/ui/Form'
import { Dialog, DialogTitle, Modal } from '@/components/ui/Modal'
import {
  archiveSpace,
  createSpace,
  lastSpaceId,
  nextPalette,
  renameSpace,
  spaceNameProblem,
} from '@/data/spaces'
import type { Space } from '@/db/types'
import { PalettePicker } from '@/features/settings/PalettePicker'
import type { Palette } from '@/lib/theme'
import { SpaceNameField } from './SpaceNameField'

/** The start page's dialogs: a new space, a new name, archiving (ADR 0031). */

type NewSpaceDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  spaces: Space[]
}

export const NewSpaceDialog = ({ isOpen, onOpenChange, spaces }: NewSpaceDialogProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog>
        <DialogTitle>{t('spaces.newTitle')}</DialogTitle>
        {/* Mounted only while open, so it starts fresh every time. */}
        <NewSpaceFields spaces={spaces} onDone={() => onOpenChange(false)} />
      </Dialog>
    </Modal>
  )
}

type NewSpaceValues = { name: string; palette: Palette }

const NewSpaceFields = ({ spaces, onDone }: { spaces: Space[]; onDone: () => void }) => {
  // RHF
  const { control, handleSubmit } = useForm<NewSpaceValues>({
    defaultValues: { name: '', palette: nextPalette(spaces) },
  })
  const name = useWatch({ control, name: 'name' })

  // HOOKS
  const { t } = useTranslation()
  const navigate = useNavigate()

  // METHODS
  /** It starts with the AI settings of the space last opened here, else of the first one. */
  const create = async (values: NewSpaceValues) => {
    const firstActive = spaces.find((space) => space.archived_at === null)
    const space = await createSpace(values, lastSpaceId() ?? firstActive?.id ?? null)
    onDone()
    navigate(`/${space.slug}`) // its setup: the North Star first
  }

  // VARS
  const canCreate = name.trim() !== '' && spaceNameProblem(name, spaces) === null

  return (
    <Form onSubmit={handleSubmit(create)}>
      <Controller
        name="name"
        control={control}
        rules={{ validate: (value) => value.trim() !== '' && !spaceNameProblem(value, spaces) }}
        render={({ field }) => (
          <SpaceNameField value={field.value} onChange={field.onChange} spaces={spaces} autoFocus />
        )}
      />
      <Controller
        name="palette"
        control={control}
        render={({ field }) => <PalettePicker value={field.value} onChange={field.onChange} />}
      />
      <p className="text-sm leading-6 text-grove-muted">{t('spaces.newExplain')}</p>
      <div className="flex justify-end gap-3">
        <Button variant="quiet" slot="close">
          {t('common.cancel')}
        </Button>
        <Button type="submit" isDisabled={!canCreate}>
          {t('spaces.create')}
        </Button>
      </div>
    </Form>
  )
}

type SpaceDialogProps = {
  /** The space the dialog is about; closed when null. */
  space: Space | null
  onClose: () => void
}

type RenameDialogProps = SpaceDialogProps & { spaces: Space[] }

export const RenameSpaceDialog = ({ space, spaces, onClose }: RenameDialogProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <Modal isOpen={space !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog>
        {space && (
          <>
            <DialogTitle>{t('spaces.renameTitle', { name: space.name })}</DialogTitle>
            <RenameFields space={space} spaces={spaces} onDone={onClose} />
          </>
        )}
      </Dialog>
    </Modal>
  )
}

type RenameFieldsProps = { space: Space; spaces: Space[]; onDone: () => void }

const RenameFields = ({ space, spaces, onDone }: RenameFieldsProps) => {
  // RHF
  const { control, handleSubmit } = useForm({ defaultValues: { name: space.name } })
  const name = useWatch({ control, name: 'name' })

  // HOOKS
  const { t } = useTranslation()

  // METHODS
  const rename = async (values: { name: string }) => {
    if (values.name.trim() !== space.name) await renameSpace(space.id, values.name)
    onDone()
  }

  // VARS
  const canRename = name.trim() !== '' && spaceNameProblem(name, spaces, space) === null

  return (
    <Form onSubmit={handleSubmit(rename)}>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <SpaceNameField
            value={field.value}
            onChange={field.onChange}
            spaces={spaces}
            renaming={space}
            autoFocus
          />
        )}
      />
      <p className="text-sm leading-6 text-grove-muted">{t('spaces.renameExplain')}</p>
      <div className="flex justify-end gap-3">
        <Button variant="quiet" slot="close">
          {t('common.cancel')}
        </Button>
        <Button type="submit" isDisabled={!canRename}>
          {t('common.save')}
        </Button>
      </div>
    </Form>
  )
}

export const ArchiveSpaceDialog = ({ space, onClose }: SpaceDialogProps) => {
  // HOOKS
  const { t } = useTranslation()

  // METHODS
  const archive = async () => {
    if (space) await archiveSpace(space.id)
    onClose()
  }

  return (
    <Modal isOpen={space !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog>
        {space && (
          <>
            <DialogTitle>{t('spaces.archiveTitle', { name: space.name })}</DialogTitle>
            <p className="text-sm leading-6 text-grove-muted">{t('spaces.archiveExplain')}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="quiet" slot="close">
                {t('common.cancel')}
              </Button>
              <Button onPress={() => void archive()}>{t('spaces.archive')}</Button>
            </div>
          </>
        )}
      </Dialog>
    </Modal>
  )
}
