'use client'

import { useI18n } from '@/lib/i18n-context'
import { Languages } from 'lucide-react'

export function LanguageToggle() {
  const { lang, toggleLang } = useI18n()

  // Show "EN" when in Arabic (switch to English), "ع" when in English (switch to Arabic)
  const buttonLabel = lang === 'ar' ? 'EN' : 'ع'
  const title = lang === 'ar' ? 'Switch to English' : 'تبديل للعربية'

  return (
    <button
      onClick={toggleLang}
      className="relative flex items-center gap-1.5 px-3 h-10 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#DC143C]/30 text-sm font-medium text-gray-300 hover:text-white"
      style={{ transition: 'background-color 0.15s, border-color 0.15s, color 0.15s' }}
      title={title}
    >
      <Languages size={16} />
      <span className="font-bold">{buttonLabel}</span>
    </button>
  )
}
