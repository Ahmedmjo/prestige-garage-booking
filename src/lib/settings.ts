import { db } from "./db";
import type { SiteSettings } from "./types";

const DEFAULTS: SiteSettings = {
  brandName: "Prestige Garage",
  brandNameAr: "بريستيج جاراج",
  tagline: "Premium Car Care",
  taglineAr: "العناية الفاخرة بالسيارات",
  bornLine: "صُنع في ألمانيا .. أُتقن في مصر",
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

export async function getSettings(): Promise<SiteSettings> {
  try {
    const rows = await db.setting.findMany();
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return { ...DEFAULTS, ...map };
  } catch {
    return DEFAULTS;
  }
}

export async function getSetting(key: keyof SiteSettings): Promise<string> {
  const s = await getSettings();
  return s[key] ?? DEFAULTS[key] ?? "";
}
