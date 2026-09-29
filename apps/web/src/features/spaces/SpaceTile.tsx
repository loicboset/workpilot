import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Plus } from 'lucide-react'
import { Button as AriaButton, Link as AriaLink, MenuTrigger } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { tv } from 'tailwind-variants'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem } from '@/components/ui/Menu'
import type { Space } from '@/db/types'
import { focusRing } from '@/lib/styles'
import { SpaceMark } from './SpaceMark'

const tileStyles = tv({
  base: 'relative flex h-full min-h-40 flex-col rounded-card bg-grove-card p-5 shadow-grove',
  variants: {
    isArchived: { true: 'opacity-60 grayscale' },
  },
})

type SpaceTileProps = {
  space: Space
  northStar: string | undefined
  /** False for the only active space: one always stays. */
  canArchive: boolean
  onRename: () => void
  onArchive: () => void
  onRestore: () => void
}

/**
 * A space on the start page, in its own colours: its name opens it, its North Star says what
 * it's for. Archived ones are greyed out and only restored from here.
 */
export const SpaceTile = ({
  space,
  northStar,
  canArchive,
  onRename,
  onArchive,
  onRestore,
}: SpaceTileProps) => {
  // HOOKS
  const { t } = useTranslation()

  // VARS
  const isArchived = space.archived_at !== null

  // METHODS
  const onAction = (action: string) => {
    if (action === 'rename') onRename()
    if (action === 'archive') onArchive()
    if (action === 'restore') onRestore()
  }

  return (
    <div data-palette={space.palette} className={tileStyles({ isArchived })}>
      <div className="flex items-start justify-between">
        <SpaceMark space={space} size="lg" />
        <MenuTrigger>
          {/* Above the name's link, which covers the whole tile. */}
          <IconButton
            size="sm"
            aria-label={t('spaces.more', { name: space.name })}
            className="z-10"
          >
            <MoreHorizontal />
          </IconButton>
          <Menu onAction={(key) => onAction(String(key))}>
            {isArchived ? (
              <MenuItem id="restore">
                <ArchiveRestore aria-hidden />
                {t('spaces.restore')}
              </MenuItem>
            ) : (
              <>
                <MenuItem id="rename">
                  <Pencil aria-hidden />
                  {t('spaces.rename')}
                </MenuItem>
                <MenuItem id="archive" isDisabled={!canArchive} textValue={t('spaces.archive')}>
                  <Archive aria-hidden />
                  <span className="flex flex-col">
                    {t('spaces.archive')}
                    {!canArchive && (
                      <span className="text-xs text-grove-muted">{t('spaces.onlyActive')}</span>
                    )}
                  </span>
                </MenuItem>
              </>
            )}
          </Menu>
        </MenuTrigger>
      </div>
      <h2 className="mt-4 font-serif text-xl leading-7 text-grove-ink">
        {isArchived ? (
          space.name
        ) : (
          <AriaLink href={`/${space.slug}`} className={nameLinkStyles}>
            {space.name}
          </AriaLink>
        )}
      </h2>
      <p className="mt-1 line-clamp-2 text-sm leading-5 text-grove-muted">
        {northStar ?? t('spaces.noNorthStar')}
      </p>
      {isArchived && (
        <p className="mt-auto pt-4 text-xs font-medium tracking-wide text-grove-muted uppercase">
          {t('spaces.archived')}
        </p>
      )}
    </div>
  )
}

// The whole tile opens the space: the link stretches over it, and shows its focus around it.
const nameLinkStyles = tv({
  base: 'cursor-pointer rounded-sm outline-none after:absolute after:inset-0 after:rounded-card hovered:text-grove-moss focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-grove-moss',
})

const newTileStyles = tv({
  extend: focusRing,
  base: 'flex h-full min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-grove-line text-grove-muted transition-colors hovered:border-grove-sage hovered:text-grove-moss',
})

/** The last tile: a new space. */
export const NewSpaceTile = ({ onPress }: { onPress: () => void }) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <AriaButton onPress={onPress} className={newTileStyles}>
      <Plus className="size-6" aria-hidden />
      <span className="font-medium">{t('spaces.new')}</span>
    </AriaButton>
  )
}
