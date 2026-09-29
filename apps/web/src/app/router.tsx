import type { RouteObject } from 'react-router'
import { SignInPage } from '@/features/auth/SignInPage'
import { DirectionPage } from '@/features/direction/DirectionPage'
import { HomePage } from '@/features/home/HomePage'
import { IceboxPage } from '@/features/icebox/IceboxPage'
import { NotesPage } from '@/features/notes/NotesPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { ReviewPage } from '@/features/review/ReviewPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { TodayPage } from '@/features/today/TodayPage'
import { AppLayout } from './layouts/AppLayout'
import { RequireSession } from './RequireSession'
import { Root } from './Root'

// Only in development (`pnpm dev`), not in the built app: every building block on one page, and
// the weather card at any time of the day.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/dev/ui',
        lazy: async () => ({ Component: (await import('@/dev/UiGalleryPage')).UiGalleryPage }),
      },
      {
        path: '/dev/weather',
        lazy: async () => ({
          Component: (await import('@/dev/WeatherPreviewPage')).WeatherPreviewPage,
        }),
      },
    ]
  : []

export const routes: RouteObject[] = [
  {
    element: <Root />,
    children: [
      { path: '/sign-in', element: <SignInPage /> },
      {
        path: '/onboarding',
        element: (
          <RequireSession>
            <OnboardingPage />
          </RequireSession>
        ),
      },
      {
        element: (
          <RequireSession>
            <AppLayout />
          </RequireSession>
        ),
        children: [
          { index: true, element: <HomePage /> },
          { path: '/today', element: <TodayPage /> },
          { path: '/icebox', element: <IceboxPage /> },
          { path: '/notes', element: <NotesPage /> },
          { path: '/review', element: <ReviewPage /> },
          { path: '/direction', element: <DirectionPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
      ...devRoutes,
    ],
  },
]
