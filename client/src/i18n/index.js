/**
 * Vue I18n Configuration
 * Internationalization setup for NaviDocs
 * Supports EN/FR with browser language detection
 */

import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'

// Detect browser language
function getBrowserLocale() {
  const navigatorLocale =
    navigator.languages !== undefined
      ? navigator.languages[0]
      : navigator.language

  if (!navigatorLocale) {
    return 'en'
  }

  // Extract language code (en-US -> en, fr-FR -> fr)
  const languageCode = navigatorLocale.trim().split(/[-_]/)[0]

  // Check if we support this language
  const supportedLocales = ['en', 'fr']
  return supportedLocales.includes(languageCode) ? languageCode : 'en'
}

// Get stored locale or browser locale
function getStartingLocale() {
  const storedLocale = localStorage.getItem('navidocs-locale')
  if (storedLocale) {
    return storedLocale
  }

  return getBrowserLocale()
}

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getStartingLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    fr
  },
  // Development guards: warn about missing translations
  missing: (locale, key) => {
    console.error(`[i18n] Missing translation: ${locale}:${key}`)
  },
  missingWarn: import.meta.env.DEV, // Only warn in development
  fallbackWarn: import.meta.env.DEV,
  // Enable number and date formatting
  datetimeFormats: {
    en: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }
    },
    fr: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }
    }
  },
  numberFormats: {
    en: {
      currency: {
        style: 'currency',
        currency: 'USD'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    },
    fr: {
      currency: {
        style: 'currency',
        currency: 'EUR'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    }
  }
})

// Helper function to switch locale
export function setLocale(locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('navidocs-locale', locale)
  document.querySelector('html').setAttribute('lang', locale)
}

// Set initial HTML lang attribute
document.querySelector('html').setAttribute('lang', getStartingLocale())

export default i18n
