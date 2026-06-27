"use client";

import {
  Home,
  CalendarPlus,
  CalendarCheck,
  Sparkles,
  Phone,
  ShieldCheck,
  Instagram,
  Facebook,
  Share2,
  Info,
  User,
  Languages,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { BrandLockup, SonaxBadge } from "@/components/brand/Logo";
import { useSettings } from "@/lib/use-settings";
import { useT, useLang } from "@/lib/use-lang";
import { toast } from "sonner";

export function NavMenu({ onNavigate }: { onNavigate: () => void }) {
  const setTab = useApp((s) => s.setTab);
  const setAdminMode = useApp((s) => s.setAdminMode);
  const settings = useSettings();
  const t = useT();
  const lang = useLang();
  const toggleLang = useApp((s) => s.toggleLang);

  const items = [
    { key: "home", label: t("home"), emoji: "🏠" },
    { key: "booking", label: t("booking"), emoji: "📅" },
    { key: "bookings", label: t("trackOrder"), emoji: "🔍" },
    { key: "services", label: t("services"), emoji: "🛠️" },
    { key: "bookings", label: t("bookings"), emoji: "📋" },
    { key: "about", label: t("about"), emoji: "🏢" },
    { key: "contact", label: t("contact"), emoji: "📞" },
  ] as const;

  const go = (k: typeof items[number]["key"]) => {
    setTab(k);
    onNavigate();
  };

  const shareApp = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Prestige Garage",
          text: "Prestige Garage - Premium Car Care",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(lang === "ar" ? "تم نسخ الرابط" : "Link copied");
      }
    } catch {
      /* user cancelled */
    }
    onNavigate();
  };

  return (
    <div className="drawer-compact flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-white/6 text-center">
        <BrandLockup crownSize={56} showTagline={false} />
        {/* Language toggle */}
        <div className="mt-3 flex justify-center">
          <button onClick={toggleLang} className="lang-toggle">
            <Languages size={13} />
            {lang === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </div>

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto prestige-scroll px-3 py-3 space-y-0.5">
        {items.map((it, i) => (
          <button
            key={i}
            onClick={() => go(it.key)}
            className="drawer-item-compact w-full text-start"
          >
            <span className="drawer-emoji">{it.emoji}</span>
            <span className="drawer-label">{it.label}</span>
          </button>
        ))}

        <div className="my-2 gold-divider" />

        <button onClick={shareApp} className="drawer-item-compact w-full text-start">
          <span className="drawer-emoji">📤</span>
          <span className="drawer-label">{t("shareApp")}</span>
        </button>

        <button
          onClick={() => {
            setAdminMode(true);
            onNavigate();
          }}
          className="drawer-item-compact w-full text-start"
        >
          <span className="drawer-emoji">
            <ShieldCheck size={18} className="text-[#ff4d6d]" />
          </span>
          <span className="drawer-label">{t("adminPanel")}</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/6 px-5 py-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          {settings.instagram && (
            <a href={settings.instagram} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition">
              <Instagram size={14} />
            </a>
          )}
          {settings.facebook && (
            <a href={settings.facebook} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition">
              <Facebook size={14} />
            </a>
          )}
        </div>
        <div className="flex items-center justify-center gap-2">
          <SonaxBadge size={36} />
          <span className="text-[9px] uppercase tracking-[0.18em] text-white/40 leading-tight">
            Powered by<br />SONAX
          </span>
        </div>
        <p className="mt-3 text-center text-[9px] text-white/25">
          Version 1.0.0 © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
