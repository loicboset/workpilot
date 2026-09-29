import { createContext, useContext } from 'react'
import type { Space } from '@/db/types'

/** The space a page shows, from its URL (`/work/today`): set by the space's layout (ADR 0031). */
export const SpaceContext = createContext<Space | null>(null)

/** The space of the page. Only for the pages of a space, under its layout. */
export const useSpace = (): Space => {
  const space = useContext(SpaceContext)
  if (!space) throw new Error('useSpace is only for the pages of a space')
  return space
}
