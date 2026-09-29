/**
 * Light or dark colours, and the palette (styles/index.css). The choices are the profile's, so
 * they follow the user to every device; each device keeps a copy, read by index.html so that
 * the next load starts in the right colours before the profile is read.
 */

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

/** Grove first: the default. */
export const PALETTES = ['grove', 'lake', 'heather', 'olive', 'birch'] as const
export type Palette = (typeof PALETTES)[number]

// Also in index.html: change both together.
const STORAGE_KEY = 'workpilot:theme'
const PALETTE_STORAGE_KEY = 'workpilot:palette'
const DARK_QUERY = '(prefers-color-scheme: dark)'

export const isTheme = (value: unknown): value is Theme => THEMES.some((theme) => theme === value)

export const isPalette = (value: unknown): value is Palette =>
  PALETTES.some((palette) => palette === value)

const isDark = (theme: Theme): boolean =>
  theme === 'dark' || (theme === 'system' && window.matchMedia(DARK_QUERY).matches)

/** The browser's bar (on phones, and around the installed app) takes the page's colour. */
const colourBrowserBar = (): void => {
  const pageColour = getComputedStyle(document.documentElement).getPropertyValue('--grove-bg')
  if (pageColour.trim()) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', pageColour.trim())
  }
}

/** Keep a choice on this device for the next load. */
const remember = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked (e.g. private browsing): the next load starts with the defaults.
  }
}

/** Show the theme's colours, and keep it on this device for the next load. */
export const applyTheme = (theme: Theme): void => {
  document.documentElement.dataset.theme = isDark(theme) ? 'dark' : 'light'
  colourBrowserBar()
  remember(STORAGE_KEY, theme)
}

/** Show the palette's colours, and keep it on this device for the next load. */
export const applyPalette = (palette: Palette): void => {
  document.documentElement.dataset.palette = palette
  colourBrowserBar()
  remember(PALETTE_STORAGE_KEY, palette)
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
