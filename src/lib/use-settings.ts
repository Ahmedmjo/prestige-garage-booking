"use client";

import { useApp } from "./store";
import { useEffect } from "react";
import type { SiteSettings } from "./types";

const FALLBACK: SiteSettings = {
  brandName: "Prestige Garage",
  brandNameAr: "بريستيج جاراج",
  tagline: "Premium Car Care",
  taglineAr: "العناية الفاخرة بالسيارات",
  bornLine: "Born in Germany. Mastered in Egypt.",
  poweredBy: "AUTHORIZED SONAX DEALER",
  phone: "+201000000000",
  whatsapp: "+201000000000",
  address: "Cairo, Egypt",
  addressAr: "القاهرة، مصر",
  workingHours: "Sat - Thu: 10:00 AM - 10:00 PM",
  workingHoursAr: "السبت - الخميس: ١٠:٠٠ ص - ١٠:٠٠ م",
  instagram: "https://instagram.com",
  facebook: "https://facebook.com",
  tiktok: "https://tiktok.com",
  adminPin: "1234",
  currency: "EGP",
  currencyAr: "ج.م",
  leadTimeHours: "2",
  slotDurationMin: "60",
  aboutAr: "وجهة مصر الرائدة للعناية الفاخرة بالسيارات. نجمع بين التكنولوجيا الألمانية والحرفية المتخصصة لتحقيق نتائج لا مثيل لها لسيارتك.",
  aboutEn: "Egypt's premier destination for luxury car care. We combine German technology with expert craftsmanship to deliver unmatched results for your vehicle.",
};

export function useSettings(): SiteSettings {
  const settings = useApp((s) => s.settings);
  const loadSettings = useApp((s) => s.loadSettings);
  useEffect(() => {
    if (!settings) loadSettings();
  }, [settings, loadSettings]);
  return settings ?? FALLBACK;
}
