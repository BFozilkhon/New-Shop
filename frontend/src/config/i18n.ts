import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en'
import ru from './locales/ru'
import uz from './locales/uz'

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  uz: { translation: uz },
}

const stored = typeof window !== 'undefined' ? (localStorage.getItem('pref_language') || 'EN') : 'EN'
const preferred = (stored || 'EN').toLowerCase()

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en','ru','uz'],
    lowerCaseLng: true,
    lng: preferred,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'pref_language',
      caches: ['localStorage'],
    },
  })

export default i18n 