import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'

/** All keys of a nested translation object, e.g. "home.apiStatus.ok". */
function flattenKeys(translations: object, prefix = ''): string[] {
  return Object.entries(translations).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? flattenKeys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )
}

// Every locale must have exactly the same keys as English (ADR 0005).
describe('locales', () => {
  const englishKeys = flattenKeys(en).sort()

  it.each([
    ['fr', fr],
    ['es', es],
  ])('%s has the same keys as en', (_language, translations) => {
    expect(flattenKeys(translations).sort()).toEqual(englishKeys)
  })
})
