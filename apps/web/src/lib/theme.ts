/**
 * Light or dark colours (the profile's, shared by every space), and the palette (each space's
 * own, ADR 0031): styles/index.css. Both follow the user to every device; each device keeps a
 * copy, read by index.html so that the next load starts in the right colours before the data is
 * read: light or dark, and the palette of the space in the URL.
 */

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

/** Grove first: the default. */
export const PALETTES = ['grove', 'lake', 'heather', 'olive', 'birch'] as const
export type Palette = (typeof PALETTES)[number]

// Also in index.html: change both together.
const STORAGE_KEY = 'workpilot:theme'
const PALETTE_STORAGE_KEY = 'workpilot:palette' // the last one shown
const SPACE_PALETTES_KEY = 'workpilot:palettes' // each space's, by its URL name
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

/** Each space's palette kept on this device, by URL name. Empty if none or unreadable. */
const storedSpacePalettes = (): Record<string, Palette> => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(SPACE_PALETTES_KEY) ?? '{}')
    if (typeof stored !== 'object' || stored === null) return {}
    return Object.fromEntries(
      Object.entries(stored).filter((entry): entry is [string, Palette] => isPalette(entry[1])),
    )
  } catch {
    return {}
  }
}

/** Keep a space's palette on this device, so a page of the space starts in its colours. */
export const rememberSpacePalette = (slug: string, palette: Palette): void => {
  remember(SPACE_PALETTES_KEY, JSON.stringify({ ...storedSpacePalettes(), [slug]: palette }))
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
