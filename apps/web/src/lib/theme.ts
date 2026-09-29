/**
 * Light or dark colours (styles/index.css). The choice is the profile's, so it follows the
 * user to every device; each device keeps a copy, read by index.html so that the next load
 * starts in the right colours before the profile is read.
 */

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

// Also in index.html: change both together.
const STORAGE_KEY = 'workpilot:theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

export const isTheme = (value: unknown): value is Theme => THEMES.some((theme) => theme === value)

const isDark = (theme: Theme): boolean =>
  theme === 'dark' || (theme === 'system' && window.matchMedia(DARK_QUERY).matches)

/** Show the theme's colours, and keep it on this device for the next load. */
export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement
  root.dataset.theme = isDark(theme) ? 'dark' : 'light'

  // The browser's bar (on phones, and around the installed app) takes the page's colour.
  const pageColour = getComputedStyle(root).getPropertyValue('--color-grove-bg').trim()
  if (pageColour) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', pageColour)
  }

  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage blocked (e.g. private browsing): the next load starts with the device's setting.
  }
}

/** Apply the theme, following the device's setting while it's `system`. Returns the cleanup. */
export const watchTheme = (theme: Theme): (() => void) => {
  applyTheme(theme)
  if (theme !== 'system') return () => {}

  const query = window.matchMedia(DARK_QUERY)
  const onChange = () => applyTheme('system')
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
