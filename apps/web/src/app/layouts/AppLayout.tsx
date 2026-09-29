import { useQueryClient } from '@tanstack/react-query'
import { Compass, Feather, Home, Settings, Sun, type LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Link as AriaLink } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'
import { twMerge } from 'tailwind-merge'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { useProfile } from '@/data/profile'
import { SESSION_QUERY_KEY } from '@/features/auth/session'
import { CaptureBar } from '@/features/capture/CaptureBar'
import { openCaptureBar } from '@/features/capture/captureStore'
import { changeLocale, currentLocale } from '@/i18n'
import { startSync } from '@/sync/scheduler'
import { useSyncStatus } from '@/sync/status'
import { RequireOnboarding } from '../RequireOnboarding'

const IS_MAC = /mac|iphone|ipad/i.test(navigator.userAgent)

const NAV: { href: string; labelKey: string; icon: LucideIcon }[] = [
  { href: '/', labelKey: 'nav.home', icon: Home },
  { href: '/today', labelKey: 'nav.today', icon: Sun },
  { href: '/direction', labelKey: 'nav.direction', icon: Compass },
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
]

/** The frame of every signed-in page: navigation, the capture bar, and sync while it's shown. */
export function AppLayout() {
  const { t } = useTranslation()
  useEffect(() => startSync(), []) // returns the function that stops it
  useSignedOutBySync()
  useProfileLanguage()

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 sm:px-8">
      <header className="flex items-center justify-between gap-4 py-5">
        <Logo showName="from-sm" />
        <div className="flex items-center gap-2">
          <nav aria-label={t('nav.label')} className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink key={item.href} {...item} label={t(item.labelKey)} />
            ))}
          </nav>
          <Button size="sm" onPress={openCaptureBar} aria-keyshortcuts="Meta+K Control+K">
            <Feather className="size-4" aria-hidden />
            <span className="hidden sm:inline">{t('nav.capture')}</span>
            <kbd className="hidden rounded bg-white/15 px-1.5 text-xs font-normal lg:inline">
              {IS_MAC ? '⌘K' : 'Ctrl K'}
            </kbd>
          </Button>
        </div>
      </header>
      <main className="flex-1 pb-12">
        <RequireOnboarding>
          <Outlet />
        </RequireOnboarding>
      </main>
      <CaptureBar />
    </div>
  )
}

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  const { pathname } = useLocation()
  const isCurrent = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return (
    <AriaLink
      href={href}
      aria-current={isCurrent ? 'page' : undefined}
      aria-label={label}
      className={twMerge(
        'flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-grove-muted transition-colors hovered:bg-grove-card hovered:text-grove-ink focus-visible:outline-2 focus-visible:outline-grove-moss',
        isCurrent && 'bg-grove-card text-grove-moss shadow-grove',
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span className="hidden md:inline">{label}</span>
    </AriaLink>
  )
}

/** When sync learns the session has expired, check again: the guard then shows sign-in. */
function useSignedOutBySync() {
  const queryClient = useQueryClient()
  const syncState = useSyncStatus((status) => status.state)
  useEffect(() => {
    if (syncState === 'signed-out') {
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    }
  }, [syncState, queryClient])
}

/** Speak the profile's language, e.g. on a new device once the profile has synced. */
function useProfileLanguage() {
  const locale = useProfile()?.locale
  useEffect(() => {
    if (locale && locale !== currentLocale()) void changeLocale(locale)
  }, [locale])
}
