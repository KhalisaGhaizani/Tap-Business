import type { Locale } from '@tapbusiness/shared'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError } from '../lib/api'
import { en, type MessageKey } from './en'
import { id } from './id'

const dictionaries = { en, id }
const STORAGE_KEY = 'tapbusiness.lang'

export type Vars = Record<string, string | number>
export type Translate = (key: MessageKey, vars?: Vars) => string

interface I18n {
  lang: Locale
  setLang: (lang: Locale) => void
  t: Translate
  /** BCP 47 tag for Intl formatting */
  intlLocale: string
}

const I18nContext = createContext<I18n | null>(null)

function detectLang(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'id') return saved
  } catch {
    // storage may be blocked
  }
  return navigator.language.toLowerCase().startsWith('id') ? 'id' : 'en'
}

export function hasStoredLang() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>(detectLang)

  const setLang = useCallback((next: Locale) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // not fatal; the choice just won't be remembered
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<I18n>(() => {
    const dict = dictionaries[lang]
    const t: Translate = (key, vars) => {
      const text: string = dict[key] ?? en[key] ?? key
      return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text
    }
    return { lang, setLang, t, intlLocale: lang === 'id' ? 'id-ID' : 'en-GB' }
  }, [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}

const isKey = (key: string): key is MessageKey => key in en

/** Turn any thrown error into a sentence in the current language. */
export function errorMessage(t: Translate, err: unknown): string {
  if (err instanceof ApiError) {
    const validationKey = `validation.${err.message}`
    if (err.code === 'VALIDATION' && isKey(validationKey)) return t(validationKey)
    const codeKey = `errors.${err.code}`
    if (isKey(codeKey)) return t(codeKey)
  }
  return t('errors.INTERNAL')
}

/** Translate a validation code such as INVALID_USERNAME, if we know it. */
export function validationMessage(t: Translate, code: string | undefined) {
  const key = `validation.${code}`
  return code && isKey(key) ? t(key) : undefined
}

export function useFormatters() {
  const { intlLocale, t } = useI18n()
  return useMemo(
    () => ({
      date: (iso: string | null) =>
        iso ? new Date(iso).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short', year: 'numeric' }) : t('common.never'),
      dateTime: (iso: string | null) =>
        iso ? new Date(iso).toLocaleString(intlLocale, { dateStyle: 'medium', timeStyle: 'short' }) : t('common.never'),
      number: (n: number) => n.toLocaleString(intlLocale),
    }),
    [intlLocale, t],
  )
}
