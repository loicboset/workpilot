import { I18nProvider, RouterProvider } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Outlet, useHref, useNavigate, type NavigateOptions } from 'react-router'

// Lets React Aria links and buttons take React Router's options, e.g. `routerOptions={{ replace }}`.
declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: NavigateOptions
  }
}

/**
 * The root route. React Aria's links navigate with React Router (no page reloads), and its
 * dates, calendars and number formats follow the app's language.
 */
export function Root() {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  return (
    <I18nProvider locale={i18n.language}>
      <RouterProvider navigate={navigate} useHref={useHref}>
        <Outlet />
      </RouterProvider>
    </I18nProvider>
  )
}
