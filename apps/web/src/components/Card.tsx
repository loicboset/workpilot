import type { ReactNode } from 'react'

/** Grove card: the base surface of every homepage card. */
export function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-card bg-grove-card p-6 shadow-grove">{children}</section>
}
