// An in-memory IndexedDB, so Dexie works in tests.
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount what each test rendered (Vitest runs without globals, so Testing Library can't do it).
afterEach(() => cleanup())
