"use client";

import { useApp } from "./store";
import { t, type TranslationKey, type Lang } from "./i18n";
import { useEffect } from "react";

export function useLang(): Lang {
  return useApp((s) => s.lang);
}

export function useT() {
  const lang = useApp((s) => s.lang);
  return (key: TranslationKey) => t(key, lang);
}

/** Hook to set the <html> dir/lang attributes when language changes */
export function useLangEffect() {
  const lang = useApp((s) => s.lang);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
  }, [lang]);
}
