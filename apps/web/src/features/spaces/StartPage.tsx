import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/brand/Logo'
import { useNorthStarTitles } from '@/data/direction'
import { restoreSpace, useSpaces } from '@/data/spaces'
import type { Space } from '@/db/types'
import { ArchiveSpaceDialog, NewSpaceDialog, RenameSpaceDialog } from './SpaceDialogs'
import { NewSpaceTile, SpaceTile } from './SpaceTile'

// Centred rows of tiles, like a browser's profiles; one per row on a phone.
const TILE_WIDTH = 'w-full sm:w-72'

/**
 * The start page, `/` (ADR 0031): the spaces, like a browser's profiles. It's the only place to
 * create, rename, archive and restore them. Archived ones come last, greyed out.
 */
export const StartPage = () => {
  // STATES
  const [isCreating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<Space | null>(null)
  const [archiving, setArchiving] = useState<Space | null>(null)

  // HOOKS
  const { t } = useTranslation()
  const spaces = useSpaces()
  const northStars = useNorthStarTitles()

  // VARS
  const all = spaces ?? []
  const active = all.filter((space) => space.archived_at === null)
  const archived = all.filter((space) => space.archived_at !== null)
  const tileOf = (space: Space) => (
    <li key={space.id} className={TILE_WIDTH}>
      <SpaceTile
        space={space}
        northStar={northStars?.get(space.id)}
        canArchive={active.length > 1}
        onRename={() => setRenaming(space)}
        onArchive={() => setArchiving(space)}
        onRestore={() => void restoreSpace(space.id)}
      />
    </li>
  )

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10 sm:py-16">
      <Logo className="mb-8" />
      <main className="w-full max-w-4xl">
        <h1 className="text-center font-serif text-3xl text-grove-ink">{t('spaces.choose')}</h1>
        <p className="mt-2 text-center text-sm text-grove-muted">{t('spaces.chooseSubtitle')}</p>
        {spaces && (
          <ul className="mt-8 flex flex-wrap justify-center gap-4">
            {active.map(tileOf)}
            <li className={TILE_WIDTH}>
              <NewSpaceTile onPress={() => setCreating(true)} />
            </li>
            {archived.map(tileOf)}
          </ul>
        )}
      </main>
      <NewSpaceDialog isOpen={isCreating} onOpenChange={setCreating} spaces={all} />
      <RenameSpaceDialog space={renaming} spaces={all} onClose={() => setRenaming(null)} />
      <ArchiveSpaceDialog space={archiving} onClose={() => setArchiving(null)} />
    </div>
  )
}
