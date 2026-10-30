import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh.json'
import en from './locales/en.json'

// locale files reused as-is from the old site (vue-i18n style single-brace
// placeholders, so the interpolation delimiters are configured accordingly)

export const LANG_KEY = 'plotbridge-lang'
export type Lang = 'zh' | 'en'

function initialLang(): Lang {
  const saved = localStorage.getItem(LANG_KEY)
  if (saved === 'zh' || saved === 'en') return saved
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

void i18next.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: initialLang(),
  fallbackLng: 'en',
  interpolation: { prefix: '{', suffix: '}', escapeValue: false },
  // synchronous init: useTranslation must never suspend without a Suspense
  // boundary, which would leave the whole tree uncommitted (blank page race)
  initImmediate: false,
  react: { useSuspense: false },
})

export function currentLang(): Lang {
  return i18next.language === 'en' ? 'en' : 'zh'
}

export function setLang(lang: Lang): void {
  void i18next.changeLanguage(lang)
  localStorage.setItem(LANG_KEY, lang)
}

/** list-valued keys (e.g. wo-notice, home-news) need returnObjects */
export function tList<T = string>(key: string): T[] {
  const val = i18next.t(key, { returnObjects: true })
  return Array.isArray(val) ? (val as T[]) : []
}
