import type { ManifestOptions } from 'vite-plugin-pwa'

/**
 * Web app manifest: makes WorkPilot installable on desktop and phone.
 * PNG icons for Android and iOS (they don't use SVG), a maskable one that phones crop to their
 * own shape, and the SVG for desktop browsers. Drawn from the leaf logo, in public/.
 */
export const manifest: Partial<ManifestOptions> = {
  name: 'WorkPilot',
  short_name: 'WorkPilot',
  description: 'A calm, offline-first workspace that connects your North Star to your daily work.',
  theme_color: '#EDF0E8',
  background_color: '#EDF0E8',
  display: 'standalone',
  start_url: '/',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
  ],
}
