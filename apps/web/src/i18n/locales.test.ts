import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'

const LOCALES = { en, fr, es }

// i18next picks "summary_one" or "summary_other" from the count (1 seed, 2 seeds).
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

/** All keys of a nested translation object, e.g. "home.ideas.summary_one". */
function flattenKeys(translations: object, prefix = ''): string[] {
  return Object.entries(translations).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? flattenKeys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )
}

/** Each text once, without its plural forms: "home.ideas.summary". */
function texts(translations: object): string[] {
  return [...new Set(flattenKeys(translations).map((key) => key.replace(PLURAL_SUFFIX, '')))].sort()
}

/** The texts that depend on a count, with the plural forms they have. */
function pluralForms(translations: object): Map<string, string[]> {
  const forms = new Map<string, string[]>()
  for (const key of flattenKeys(translations)) {
    const suffix = PLURAL_SUFFIX.exec(key)
    if (!suffix) continue
    const text = key.replace(PLURAL_SUFFIX, '')
    forms.set(text, [...(forms.get(text) ?? []), suffix[1]].sort())
  }
  return forms
}

describe('locales', () => {
  // Every locale has the same texts as English (ADR 0005).
  it.each([
    ['fr', fr],
    ['es', es],
  ])('%s has the same texts as en', (_language, translations) => {
    expect(texts(translations)).toEqual(texts(en))
    expect([...pluralForms(translations).keys()].sort()).toEqual([...pluralForms(en).keys()].sort())
  })

  // Each counted text has the plural forms its language uses: French and Spanish also have
  // "many" ("1 000 000 de graines").
  it.each(Object.entries(LOCALES))(
    '%s has the plural forms of its language',
    (language, translations) => {
      const needed = [...new Intl.PluralRules(language).resolvedOptions().pluralCategories].sort()
      for (const [text, forms] of pluralForms(translations)) {
        expect(forms, text).toEqual(needed)
      }
    },
  )
})
