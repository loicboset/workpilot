import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import { manifest } from './src/pwa/manifest.ts'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig(({ mode }) => {
  // Ports from the repo-root .env (defaults match .env.example). Only read here, never
  // exposed to the app: its env still comes from apps/web with the VITE_ prefix.
  const env = loadEnv(mode, repoRoot, 'WORKPILOT_')
  const apiPort = env.WORKPILOT_PORT || '8100'
  const webPort = Number(env.WORKPILOT_WEB_PORT || '5180')

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
        manifest,
        workbox: {
          // Precache the app shell and fonts so the app opens offline.
          globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
          // Never answer /api navigations with the app shell (index.html).
          navigateFallbackDenylist: [/^\/api/],
        },
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: webPort,
      // Fail when the port is taken instead of quietly moving to another one.
      strictPort: true,
      proxy: { '/api': `http://localhost:${apiPort}` },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
