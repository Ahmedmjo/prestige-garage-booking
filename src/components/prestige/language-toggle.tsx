'use client'

import { useI18n } from '@/lib/i18n-context'
import { Languages } from 'lucide-react'
import { motion } from 'framer-motion'

export function LanguageToggle() {
  const { lang, toggleLang } = useI18n()

  return (
    <button
      onClick={toggleLang}
      className="relative flex items-center gap-1.5 px-3 h-10 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#DC143C]/30 transition-all text-sm font-medium text-gray-300 hover:text-white"
      title={lang === 'ar' ? 'Switch to English' : 'تبديل للعربية'}
    >
      <Languages size={16} />
      <span className="font-bold">{lang === 'ar' ? 'EN' : 'ع'}</span>
      {/* Active language indicator */}
      <motion.span
        layoutId="langIndicator"
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#DC143C]"
      />
    </button>
  )
}
