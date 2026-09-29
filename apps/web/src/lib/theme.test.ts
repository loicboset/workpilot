import { afterEach, expect, it, vi } from 'vitest'
import { applyTheme, watchTheme } from './theme'

/** A device whose screen is light or dark, and can turn. */
const stubDevice = (isDark: boolean) => {
  const listeners = new Set<() => void>()
  const device = {
    isDark,
    turn: (dark: boolean) => {
      device.isDark = dark
      listeners.forEach((listener) => listener())
    },
  }
  vi.stubGlobal('matchMedia', (media: string) => ({
    get matches() {
      return device.isDark
    },
    media,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  }))
  return device
}

const shownTheme = () => document.documentElement.dataset.theme

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

it('shows the picked theme whatever the device, and keeps it for the next load', () => {
  stubDevice(true)
  applyTheme('light')
  expect(shownTheme()).toBe('light')
  expect(localStorage.getItem('workpilot:theme')).toBe('light')

  stubDevice(false)
  applyTheme('dark')
  expect(shownTheme()).toBe('dark')
  expect(localStorage.getItem('workpilot:theme')).toBe('dark')
})

it("follows the device's setting, and its changes, while the theme is `system`", () => {
  const device = stubDevice(false)
  const stop = watchTheme('system')
  expect(shownTheme()).toBe('light')

  device.turn(true)
  expect(shownTheme()).toBe('dark')

  stop()
  device.turn(false)
  expect(shownTheme()).toBe('dark') // no longer followed
})

it("ignores the device's changes once a theme is picked", () => {
  const device = stubDevice(false)
  const stop = watchTheme('dark')
  device.turn(false)
  expect(shownTheme()).toBe('dark')
  stop()
})
