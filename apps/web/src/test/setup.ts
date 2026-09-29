// An in-memory IndexedDB, so Dexie works in tests.
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount what each test rendered (Vitest runs without globals, so Testing Library can't do it).
afterEach(() => cleanup())

// jsdom lays nothing out, so it has no scrollIntoView (the capture command menu uses it).
Element.prototype.scrollIntoView = () => {}

// Nor matchMedia (the theme asks for the device's): no media query matches, e.g. a light
// screen. Tests of the theme stub their own.
window.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})
