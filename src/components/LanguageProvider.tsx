"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Lang = "ar" | "en";

const LanguageContext = createContext<{
  lang: Lang;
  toggle: () => void;
}>({ lang: "ar", toggle: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");
  return (
    <LanguageContext.Provider
      value={{ lang, toggle: () => setLang((l) => (l === "ar" ? "en" : "ar")) }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * Renders Arabic or English text depending on the current toggle —
 * WITHOUT ever touching the page's dir="rtl". The outer layout position
 * never moves; only the words themselves change, so captions stay lined
 * up with the same spot on every cinematic video regardless of language.
 */
export function LangText({
  ar,
  en,
  as: As = "span",
  className,
}: {
  ar: string;
  en: string;
  as?: React.ElementType;
  className?: string;
}) {
  const { lang } = useLanguage();
  const text = lang === "ar" ? ar : en;
  return (
    <As className={className} dir={lang === "ar" ? "rtl" : "ltr"} style={{ unicodeBidi: "plaintext" }}>
      {text}
    </As>
  );
}

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, toggle } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggle}
      className={
        className ??
        "rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:border-[var(--cinema-crimson)]"
      }
      aria-label="Switch language"
    >
      {lang === "ar" ? "EN" : "عربي"}
    </button>
  );
}
