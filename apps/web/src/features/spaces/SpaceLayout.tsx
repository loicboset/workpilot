import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router'
import { AppLayout } from '@/app/layouts/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import { SpaceContext } from '@/data/currentSpace'
import { useNorthStar } from '@/data/direction'
import { rememberLastSpace, useSpaceBySlug } from '@/data/spaces'
import type { Space } from '@/db/types'
import { applyPalette, rememberSpacePalette } from '@/lib/theme'
import { useHasHeardFromServer } from '@/sync/useHasHeardFromServer'
import { SpaceSetup } from './SpaceSetup'

/**
 * The pages of a space, at `/work/…` (ADR 0031): the space from the URL, for every page below.
 * An unknown or archived space leads to the start page, once this device has heard from the
 * server (a space made on another device may not have arrived yet).
 */
export const SpaceLayout = () => {
  // HOOKS
  const { t } = useTranslation()
  const { space: slug } = useParams()
  const space = useSpaceBySlug(slug)
  const hasHeardFromServer = useHasHeardFromServer()

  if (space === undefined) return null // read from this device in a moment
  if (space === null || space.archived_at !== null) {
    if (hasHeardFromServer) return <Navigate to="/" replace />
    return (
      <div className="flex min-h-dvh items-center justify-center text-grove-moss">
        <Spinner label={t('common.loading')} className="size-7" />
      </div>
    )
  }
  return (
    <SpaceContext.Provider value={space}>
      <InSpace space={space} />
    </SpaceContext.Provider>
  )
}

/** The space's colours, then its pages, or its setup while it has no North Star. */
const InSpace = ({ space }: { space: Space }) => {
  // HOOKS
  const northStar = useNorthStar()
  const hasHeardFromServer = useHasHeardFromServer()

  // EFFECTS
  useEffect(() => {
    applyPalette(space.palette)
    rememberSpacePalette(space.slug, space.palette)
  }, [space.slug, space.palette])
  useEffect(() => rememberLastSpace(space.id), [space.id])

  if (northStar === undefined) return null // read from this device in a moment
  if (northStar === null && hasHeardFromServer) return <SpaceSetup space={space} />
  return <AppLayout />
}
