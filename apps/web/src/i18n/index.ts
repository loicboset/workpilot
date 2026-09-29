import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'

export const SUPPORTED_LOCALES = ['en', 'fr', 'es'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

const DEFAULT_LOCALE: Locale = 'en'

function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/** The browser's language if supported, else English. The profile's language replaces it. */
function detectLocale(): Locale {
  const language = navigator.language.slice(0, 2)
  return isLocale(language) ? language : DEFAULT_LOCALE
}

/**
 * The language with this device's region when it has one, e.g. "en" → "en-GB", so dates and
 * times look as the user expects ("28 September", "21:47"). Texts come from "en" either way.
 */
function withRegion(locale: Locale): string {
  const withSameLanguage = (tag: string) => tag.toLowerCase().startsWith(`${locale}-`)
  return navigator.languages.find((tag) => withSameLanguage(tag) && isValidTag(tag)) ?? locale
}

/** False for tags some browsers report but Intl refuses, e.g. "en-US@posix" on Linux. */
function isValidTag(tag: string): boolean {
  try {
    Intl.getCanonicalLocales(tag)
    return true
  } catch {
    return false
  }
}

/** Switch the app's language. */
export function changeLocale(locale: Locale): Promise<unknown> {
  return i18n.changeLanguage(withRegion(locale))
}

/** The app's language without the region: "en", "fr" or "es". */
export function currentLocale(): Locale {
  const language = i18n.language.slice(0, 2)
  return isLocale(language) ? language : DEFAULT_LOCALE
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
  },
  lng: withRegion(detectLocale()),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false }, // React already escapes rendered text
})

export default i18n
