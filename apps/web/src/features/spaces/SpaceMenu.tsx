import { Check, ChevronDown, LayoutGrid } from 'lucide-react'
import { Button as AriaButton, MenuTrigger, Separator, type Key } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { tv } from 'tailwind-variants'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { useSpace } from '@/data/currentSpace'
import { useSpaces } from '@/data/spaces'
import { focusRing } from '@/lib/styles'
import { SpaceMark } from './SpaceMark'

const ALL_SPACES = 'all-spaces'

const triggerStyles = tv({
  extend: focusRing,
  base: 'flex h-9 cursor-pointer items-center gap-2 rounded-full pr-1 pl-1 text-sm font-medium text-grove-ink transition-colors hovered:bg-grove-card sm:pr-2.5',
})

/**
 * The space menu, right of Capture (ADR 0031): another space on the same page (`/work/today` →
 * `/personal/today`), or all spaces on the start page.
 */
export const SpaceMenu = () => {
  // HOOKS
  const { t } = useTranslation()
  const space = useSpace()
  const spaces = useSpaces()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // VARS
  const activeSpaces = (spaces ?? []).filter((each) => each.archived_at === null)
  const page = pathname.slice(`/${space.slug}`.length) // "/today", or "" on the homepage

  // METHODS
  const onAction = (key: Key) => {
    if (key === ALL_SPACES) return navigate('/')
    const picked = activeSpaces.find((each) => each.id === key)
    if (picked && picked.id !== space.id) navigate(`/${picked.slug}${page}`)
  }

  return (
    <MenuTrigger>
      <AriaButton aria-label={t('spaces.current', { name: space.name })} className={triggerStyles}>
        <SpaceMark space={space} size="sm" />
        <span className="hidden max-w-40 truncate sm:inline">{space.name}</span>
        <ChevronDown className="hidden size-4 text-grove-muted sm:block" aria-hidden />
      </AriaButton>
      <Menu onAction={onAction}>
        {activeSpaces.map((each) => (
          <MenuItem key={each.id} id={each.id} textValue={each.name}>
            <SpaceMark space={each} size="xs" />
            <span className="flex-1 truncate">{each.name}</span>
            {each.id === space.id && (
              <>
                <Check aria-hidden />
                <span className="sr-only">{t('spaces.here')}</span>
              </>
            )}
          </MenuItem>
        ))}
        <Separator className="mx-2 my-1 border-grove-line" />
        <MenuItem id={ALL_SPACES}>
          <LayoutGrid aria-hidden />
          {t('spaces.all')}
        </MenuItem>
      </Menu>
    </MenuTrigger>
  )
}
