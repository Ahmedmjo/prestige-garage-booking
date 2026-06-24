'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, type Lang, type TranslationKey } from '@/lib/i18n'

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: TranslationKey) => string
  dir: 'rtl' | 'ltr'
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage synchronously to avoid hydration mismatch
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prestige-lang') as Lang | null
      if (saved === 'ar' || saved === 'en') return saved
    }
    return 'ar'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('prestige-lang', lang)
      document.documentElement.lang = lang
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    }
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)
  const toggleLang = () => setLangState(prev => prev === 'ar' ? 'en' : 'ar')
  const t = (key: TranslationKey) => translations[lang][key] || key
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t, dir }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
