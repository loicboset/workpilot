import { Feather, Settings, type LucideIcon } from 'lucide-react'
import { Link as AriaLink } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'
import { twMerge } from 'tailwind-merge'
import { tv } from 'tailwind-variants'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { CaptureBar } from '@/features/capture/CaptureBar'
import { openCaptureBar } from '@/features/capture/captureStore'
import { SpaceMenu } from '@/features/spaces/SpaceMenu'
import { useSpacePath } from '@/features/spaces/useSpacePath'
import { focusRing } from '@/lib/styles'

const IS_MAC = /mac|iphone|ipad/i.test(navigator.userAgent)

const logoLinkStyles = tv({ extend: focusRing, base: 'inline-flex rounded-full' })

/** The frame of a space's pages: navigation, the capture bar, and the space menu (ADR 0031). */
export function AppLayout() {
  const { t } = useTranslation()
  const spacePath = useSpacePath()

  return (
    <div className="mx-auto flex min-h-dvh max-w-360 flex-col px-4 sm:px-8 lg:px-12">
      <header className="flex items-center justify-between gap-4 py-5">
        <AriaLink href={spacePath()} className={logoLinkStyles}>
          <Logo showName="from-sm" />
        </AriaLink>
        <div className="flex items-center gap-2">
          <nav aria-label={t('nav.label')} className="flex items-center gap-1">
            <NavLink href={spacePath('/settings')} label={t('nav.settings')} icon={Settings} />
          </nav>
          <Button size="sm" onPress={openCaptureBar} aria-keyshortcuts="Meta+K Control+K">
            <Feather className="size-4" aria-hidden />
            <span className="hidden sm:inline">{t('nav.capture')}</span>
            <kbd className="hidden rounded bg-grove-on-fill/15 px-1.5 text-xs font-normal lg:inline">
              {IS_MAC ? '⌘K' : 'Ctrl K'}
            </kbd>
          </Button>
          <SpaceMenu />
        </div>
      </header>
      <main className="flex-1 pb-12">
        <Outlet />
      </main>
      <CaptureBar />
    </div>
  )
}

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  const { pathname } = useLocation()
  const isCurrent = pathname.startsWith(href)
  return (
    <AriaLink
      href={href}
      aria-current={isCurrent ? 'page' : undefined}
      aria-label={label}
      className={twMerge(
        'flex h-9 items-center gap-2 rounded-full px-2.5 text-sm sm:px-3 font-medium text-grove-muted transition-colors hovered:bg-grove-card hovered:text-grove-ink focus-visible:outline-2 focus-visible:outline-grove-moss',
        isCurrent && 'bg-grove-card text-grove-moss shadow-grove',
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span className="hidden lg:inline">{label}</span>
    </AriaLink>
  )
}
