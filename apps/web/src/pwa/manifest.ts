import type { ManifestOptions } from 'vite-plugin-pwa'

/** Web app manifest: makes WorkPilot installable on desktop and phone. */
// TODO: add PNG icons (192, 512 and an Apple touch icon) before the v0.1 release; iOS needs PNG.
export const manifest: Partial<ManifestOptions> = {
  name: 'WorkPilot',
  short_name: 'WorkPilot',
  description: 'A calm, offline-first workspace that connects your North Star to your daily work.',
  theme_color: '#EDF0E8',
  background_color: '#EDF0E8',
  display: 'standalone',
  start_url: '/',
  icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
}
