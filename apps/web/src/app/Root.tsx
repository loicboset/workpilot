import { useEffect } from 'react'
import { I18nProvider, RouterProvider } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Outlet, useHref, useNavigate, type NavigateOptions } from 'react-router'
import { useTheme } from '@/data/profile'
import { watchTheme } from '@/lib/theme'

// Lets React Aria links and buttons take React Router's options, e.g. `routerOptions={{ replace }}`.
declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: NavigateOptions
  }
}

/**
 * The root route. React Aria's links navigate with React Router (no page reloads), and its
 * dates, calendars and number formats follow the app's language. Every page, sign-in
 * included, takes the profile's light or dark; the palette is the space's (see `SpaceLayout`),
 * else the last one shown on this device.
 */
export function Root() {
  // HOOKS
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const theme = useTheme()

  // EFFECTS
  // While the profile loads, keep the theme index.html started with.
  useEffect(() => (theme ? watchTheme(theme) : undefined), [theme])

  return (
    <I18nProvider locale={i18n.language}>
      <RouterProvider navigate={navigate} useHref={useHref}>
        <Outlet />
      </RouterProvider>
    </I18nProvider>
  )
}
