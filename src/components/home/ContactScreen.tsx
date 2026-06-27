"use client";

import { Phone, MessageCircle, MapPin, Mail, Instagram, Facebook } from "lucide-react";
import { BrandCrown, SonaxBadge } from "@/components/brand/Logo";
import { useSettings } from "@/lib/use-settings";
import { useT, useLang } from "@/lib/use-lang";
import { waLink, telLink } from "@/lib/phone";

export function ContactScreen() {
  const settings = useSettings();
  const t = useT();
  const lang = useLang();

  return (
    <div className="min-h-full bg-home-strong luxury-overlay pb-8">
      {/* Brand header */}
      <div className="px-5 pt-7 pb-4 text-center">
        <BrandCrown size={68} glow={false} />
        <h1 className="mt-2 text-lg font-extrabold text-white">
          <span className="crown-shine">PRESTIGE</span> GARAGE
        </h1>
        <p className="text-[10px] uppercase tracking-[0.28em] text-white/45 mt-1">
          {lang === "ar" ? settings.taglineAr : settings.tagline}
        </p>
      </div>

      {/* Info card (garage info) */}
      <div className="mx-5 rounded-3xl border border-white/8 bg-[#0f0f11] p-6 text-center">
        <div className="text-3xl mb-2">🏢</div>
        <h3 className="text-base font-extrabold text-white">Prestige Garage</h3>
        <p className="mt-1 text-xs text-white/55">
          {t("authorizedPartner")}
        </p>
        <div className="mt-3 inline-block rounded-full bg-[#DC143C]/12 border border-[#DC143C]/30 px-3 py-1 text-sm font-bold text-[#ff4d6d]">
          {t("workingHours")}
        </div>
        <p className="mt-1.5 text-[11px] text-white/50">{t("hoursDaily")}</p>
      </div>

      {/* 2x2 contact grid */}
      <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
        <a href={telLink(settings.phone)} className="contact-card-2x2">
          <div className="cc-icon" style={{ background: "rgba(220,20,60,0.12)" }}>
            <Phone size={20} className="text-[#DC143C]" />
          </div>
          <span className="cc-label">{t("callUs")}</span>
          <span className="cc-detail" dir="ltr">{settings.phone}</span>
        </a>

        <a
          href={waLink(settings.whatsapp)}
          target="_blank"
          rel="noreferrer"
          className="contact-card-2x2"
        >
          <div className="cc-icon" style={{ background: "rgba(37,211,102,0.12)" }}>
            <MessageCircle size={20} className="text-[#25D366]" />
          </div>
          <span className="cc-label">{t("whatsapp")}</span>
          <span className="cc-detail" dir="ltr">{settings.whatsapp}</span>
        </a>

        <a
          href="https://maps.app.goo.gl/"
          target="_blank"
          rel="noreferrer"
          className="contact-card-2x2"
        >
          <div className="cc-icon" style={{ background: "rgba(66,133,244,0.12)" }}>
            <MapPin size={20} className="text-[#4285F4]" />
          </div>
          <span className="cc-label">{t("location")}</span>
          <span className="cc-detail">{t("openMaps")}</span>
        </a>

        <a href="mailto:info@prestigegarage.eg" className="contact-card-2x2">
          <div className="cc-icon" style={{ background: "rgba(234,179,8,0.12)" }}>
            <Mail size={20} className="text-[#EAB308]" />
          </div>
          <span className="cc-label">{t("email")}</span>
          <span className="cc-detail">info@prestigegarage.eg</span>
        </a>
      </div>

      {/* Open in Google Maps button */}
      <div className="mx-5 mt-4">
        <a
          href="https://maps.app.goo.gl/"
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#DC143C] py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(220,20,60,0.6)] transition active:scale-[0.98]"
        >
          <MapPin size={17} />
          {t("openInMaps")}
        </a>
      </div>

      {/* Social */}
      <div className="mt-6 text-center">
        <p className="text-[13px] text-white/55 mb-3">@prestigegarage.eg</p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="https://instagram.com/prestigegarage.eg"
            target="_blank"
            rel="noreferrer"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#0f0f11] transition hover:border-[#E1306C]/50"
            style={{ color: "#E1306C" }}
          >
            <Instagram size={18} />
          </a>
          <a
            href="https://twitter.com/prestigegarage.eg"
            target="_blank"
            rel="noreferrer"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#0f0f11] transition hover:border-[#1DA1F2]/50"
            style={{ color: "#1DA1F2" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
            </svg>
          </a>
          <a
            href="https://snapchat.com/add/prestigegarage.eg"
            target="_blank"
            rel="noreferrer"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#0f0f11] transition hover:border-[#FFFC00]/50"
            style={{ color: "#FFFC00" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.5 14.5c-.4.1-1.7.6-2 1.4-.1.4-.3.5-.6.4-.3-.1-1-.3-2.9-.3s-2.6.2-2.9.3c-.3.1-.5 0-.6-.4-.3-.8-1.6-1.3-2-1.4-.1 0-.3-.1-.2-.3.4-.3 1.5-.7 1.9-1.4.5-.8.4-2-.1-2.8-.5-.8-.7-1.6-.4-2.4.5-1.2 1.9-2 3.3-2s2.8.8 3.3 2c.3.8.1 1.6-.4 2.4-.5.8-.6 2-.1 2.8.4.7 1.5 1.1 1.9 1.4.1.2 0 .3-.2.3z" />
            </svg>
          </a>
          <a
            href="https://tiktok.com/@prestigegarage.eg"
            target="_blank"
            rel="noreferrer"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#0f0f11] transition hover:border-white/50 text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.28a8.17 8.17 0 0 0 4.78 1.52V7.35a4.85 4.85 0 0 1-1.02-.66z" />
            </svg>
          </a>
        </div>
      </div>

      {/* SONAX footer */}
      <div className="mx-5 mt-6 flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-[#0f0f11] p-4">
        <SonaxBadge size={44} />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
          {settings.poweredBy}
        </p>
      </div>

      <p className="mt-5 text-center text-[10px] text-white/30">
        © {new Date().getFullYear()} Prestige Garage
      </p>
    </div>
  );
}
