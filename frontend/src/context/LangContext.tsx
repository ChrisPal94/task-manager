import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { translations, type Locale, type TranslationKey } from '@/i18n/translations'

const LANG_KEY = 'tm_lang'

function getSavedLocale(): Locale {
  const saved = localStorage.getItem(LANG_KEY)
  return saved === 'es' || saved === 'en' ? saved : 'en'
}

interface LangContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getSavedLocale)

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(LANG_KEY, next)
    setLocaleState(next)
  }, [])

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key],
    [locale],
  )

  const value = useMemo<LangContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>')
  return ctx
}
