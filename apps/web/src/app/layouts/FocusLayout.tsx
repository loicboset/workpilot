import type { ReactNode } from 'react'
import { Logo } from '@/components/brand/Logo'

/** A calm, centred frame with nothing else on screen: sign-in and onboarding. */
export function FocusLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10 sm:justify-center sm:py-16">
      <Logo className="mb-8" />
      <main className="w-full max-w-md">{children}</main>
    </div>
  )
}
