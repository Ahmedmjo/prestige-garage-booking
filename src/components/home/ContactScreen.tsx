"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Phone,
  MessageCircle,
  MapPin,
  Mail,
  Instagram,
  Facebook,
  ChevronDown,
  Navigation,
  Play,
  Link2,
} from "lucide-react";
import { BrandCrown, SonaxBadge } from "@/components/brand/Logo";
import { useSettings } from "@/lib/use-settings";
import { useApp } from "@/lib/store";
import { useT, useLang } from "@/lib/use-lang";
import { waLink, telLink } from "@/lib/phone";
import { branchColor } from "@/lib/branch-colors";
import type { BranchItem } from "@/lib/types";

// Branch.mapUrl may carry packed media as JSON {map,image,video} from older admin
// versions. We NEVER render that JSON as an <a href> — it would freeze mobile
// browsers. This helper extracts only a safe http(s):// map URL.
function safeMapHref(mapUrl: string | null | undefined): string {
  if (!mapUrl) return "";
  const trimmed = mapUrl.trim();
  if (!trimmed) return "";
  // JSON-packed media — extract only the .map field
  if (trimmed.startsWith("{")) {
    try {
      const obj = JSON.parse(trimmed) as { map?: unknown };
      const m = typeof obj.map === "string" ? obj.map.trim() : "";
      return isWebUrl(m) ? m : "";
    } catch {
      return ""; // corrupt JSON — drop it (NEVER fall through to render as URL)
    }
  }
  return isWebUrl(trimmed) ? trimmed : "";
}

function isWebUrl(s: string): boolean {
  return s.startsWith("http://") || s.startsWith("https://");
}

/* ─── Electronic Addresses dropdown ───
   Collapsible list of online contact channels: email, Instagram,
   Facebook, TikTok, Snapchat, Twitter. Each link opens in a new tab.
   Renders only when at least one channel has a non-empty value. */
function ElectronicAddressesDropdown({
  settings,
  lang,
}: {
  settings: ReturnType<typeof useSettings>;
  lang: "ar" | "en";
}) {
  const [expanded, setExpanded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Click-outside + Escape to collapse
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const node = sectionRef.current;
      if (node && !node.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  type Channel = {
    key: string;
    label: string;
    labelEn: string;
    href: string;
    icon: React.ReactNode;
    tint: string;
    color: string;
  };

  const channels: Channel[] = [
    {
      key: "email",
      label: "البريد الإلكتروني",
      labelEn: "Email",
      href: settings.email ? `mailto:${settings.email}` : "",
      icon: <Mail size={16} />,
      tint: "rgba(234,179,8,0.14)",
      color: "#EAB308",
    },
    {
      key: "instagram",
      label: "إنستجرام",
      labelEn: "Instagram",
      href: settings.instagram || "",
      icon: <Instagram size={16} />,
      tint: "rgba(225,48,108,0.14)",
      color: "#E1306C",
    },
    {
      key: "facebook",
      label: "فيسبوك",
      labelEn: "Facebook",
      href: settings.facebook || "",
      icon: <Facebook size={16} />,
      tint: "rgba(24,119,242,0.14)",
      color: "#1877F2",
    },
    {
      key: "tiktok",
      label: "تيك توك",
      labelEn: "TikTok",
      href: settings.tiktok || "",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.28a8.17 8.17 0 0 0 4.78 1.52V7.35a4.85 4.85 0 0 1-1.02-.66z" />
        </svg>
      ),
      tint: "rgba(255,255,255,0.10)",
      color: "#ffffff",
    },
    {
      key: "snapchat",
      label: "سناب شات",
      labelEn: "Snapchat",
      href: settings.snapchat || "",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.5 14.5c-.4.1-1.7.6-2 1.4-.1.4-.3.5-.6.4-.3-.1-1-.3-2.9-.3s-2.6.2-2.9.3c-.3.1-.5 0-.6-.4-.3-.8-1.6-1.3-2-1.4-.1 0-.3-.1-.2-.3.4-.3 1.5-.7 1.9-1.4.5-.8.4-2-.1-2.8-.5-.8-.7-1.6-.4-2.4.5-1.2 1.9-2 3.3-2s2.8.8 3.3 2c.3.8.1 1.6-.4 2.4-.5.8-.6 2-.1 2.8.4.7 1.5 1.1 1.9 1.4.1.2 0 .3-.2.3z" />
        </svg>
      ),
      tint: "rgba(255,252,0,0.14)",
      color: "#FFFC00",
    },
    {
      key: "twitter",
      label: "إكس (تويتر)",
      labelEn: "X (Twitter)",
      href: settings.twitter || "",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      tint: "rgba(255,255,255,0.10)",
      color: "#ffffff",
    },
  ];

  const visible = channels.filter((c) => c.href);
  if (visible.length === 0) return null;

  return (
    <div ref={sectionRef} className="mx-5 mt-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="electronic-addresses-list"
        className="group flex w-full items-center justify-between rounded-2xl border border-white/8 bg-[#0f0f11] px-4 py-3.5 text-start transition hover:border-[#DC143C]/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC143C]/55"
      >
        <span className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-full"
            style={{
              background: "rgba(220,20,60,0.12)",
              border: "1px solid rgba(220,20,60,0.30)",
            }}
            aria-hidden
          >
            <Link2 size={15} className="text-[#ff4d6d]" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold text-white">
              {lang === "ar" ? "العناوين الإلكترونية" : "Electronic Addresses"}
            </span>
            <span className="text-[10px] text-white/45">
              {expanded
                ? lang === "ar"
                  ? "اضغط للطي"
                  : "Tap to collapse"
                : lang === "ar"
                  ? "اضغط لعرض كل الروابط"
                  : "Tap to view all links"}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-[#DC143C]/12 border border-[#DC143C]/30 px-2 py-0.5 text-[10px] font-bold text-[#ff4d6d]">
            {visible.length}
          </span>
          <ChevronDown
            size={16}
            className={`text-white/55 transition-transform duration-300 ${
              expanded ? "rotate-180" : "rotate-0"
            }`}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id="electronic-addresses-list"
            role="list"
            key="electronic-addresses-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ul className="mt-2.5 flex flex-col gap-2">
              {visible.map((c) => (
                <li key={c.key} role="listitem">
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-white/8 bg-[#0f0f11] px-3.5 py-3 transition hover:border-[#DC143C]/35 hover:bg-white/[0.03] active:scale-[0.99]"
                  >
                    <span
                      className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full"
                      style={{ background: c.tint, color: c.color }}
                      aria-hidden
                    >
                      {c.icon}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="text-[13px] font-bold text-white">
                        {lang === "ar" ? c.label : c.labelEn}
                      </span>
                      <span
                        className="truncate text-[10px] text-white/45"
                        dir="ltr"
                      >
                        {c.href.replace(/^mailto:/, "")}
                      </span>
                    </span>
                    <ChevronDown
                      size={14}
                      className="-rotate-90 flex-shrink-0 text-white/35"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ContactScreen() {
  const settings = useSettings();
  const t = useT();
  const lang = useLang();

  // Branches are loaded once at the app root (see src/app/page.tsx) — just read them.
  const branches = useApp((s) => s.branches);
  const activeBranches = branches.filter((b) => b.isActive);

  // Collapsible state for the new branches map section
  const [expanded, setExpanded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Click-outside (and Escape) to collapse
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const node = sectionRef.current;
      if (node && !node.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

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

        <a href={`mailto:${settings.email}`} className="contact-card-2x2">
          <div className="cc-icon" style={{ background: "rgba(234,179,8,0.12)" }}>
            <Mail size={20} className="text-[#EAB308]" />
          </div>
          <span className="cc-label">{t("email")}</span>
          <span className="cc-detail" dir="ltr">{settings.email}</span>
        </a>
      </div>

      {/* ============================================================
          ELECTRONIC ADDRESSES — collapsible dropdown with all
          online contact channels (email + social links)
          ============================================================ */}
      <ElectronicAddressesDropdown settings={settings} lang={lang} />

      {/* ============================================================
          BRANCHES — single large map icon, expands to a vertical list
          ============================================================ */}
      <div ref={sectionRef} className="mx-5 mt-5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="branches-list"
          className="group flex w-full flex-col items-center rounded-3xl border border-white/8 bg-[#0f0f11] px-5 py-6 text-center transition hover:border-[#DC143C]/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC143C]/55"
        >
          {/* Large 80x80 circular MapPin with pulse rings */}
          <div className="map-pulse-ring relative grid h-20 w-20 place-items-center rounded-full">
            {/* Solid crimson disc */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 35%, rgba(220,20,60,0.30) 0%, rgba(220,20,60,0.10) 55%, transparent 75%)",
                border: "1.5px solid rgba(220,20,60,0.55)",
                boxShadow:
                  "inset 0 0 18px rgba(220,20,60,0.35), 0 0 22px rgba(220,20,60,0.25)",
              }}
              aria-hidden
            />
            {/* MapPin icon (bobs gently) */}
            <div className="map-icon-bob relative z-10 grid place-items-center">
              <MapPin size={34} className="text-[#ff4d6d]" strokeWidth={2.2} />
            </div>
          </div>

          {/* Label + chevron row */}
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-sm font-extrabold text-white">
              {t("ourBranches")}
            </span>
            <span className="rounded-full bg-[#DC143C]/12 border border-[#DC143C]/30 px-2 py-0.5 text-[10px] font-bold text-[#ff4d6d]">
              {activeBranches.length}
            </span>
            <ChevronDown
              size={16}
              className={`text-white/55 transition-transform duration-300 ${
                expanded ? "rotate-180" : "rotate-0"
              }`}
            />
          </div>
          <p className="mt-1 text-[11px] text-white/45">
            {expanded
              ? lang === "ar"
                ? "اضغط للطي"
                : "Tap to collapse"
              : lang === "ar"
                ? "اضغط لعرض كل الفروع"
                : "Tap to view all branches"}
          </p>
        </button>

        {/* Expanded branch list */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id="branches-list"
              role="list"
              key="branches-list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              {activeBranches.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-white/8 bg-[#0f0f11] px-4 py-6 text-center text-xs text-white/50">
                  {lang === "ar" ? "لا توجد فروع حالياً" : "No branches available"}
                </div>
              ) : (
                <ul className="mt-3 flex flex-col gap-2.5">
                  {activeBranches.map((b: BranchItem, idx: number) => {
                    const color = branchColor(idx);
                    const name = lang === "ar" ? b.nameAr : b.name;
                    const rawAddress =
                      lang === "ar"
                        ? b.addressAr || b.address || ""
                        : b.address || "";
                    const address = rawAddress || "—";
                    // Build a SAFE map href — never trust mapUrl blindly.
                    // Falls back to a Google Maps search of the branch address.
                    const mapHref =
                      safeMapHref(b.mapUrl) ||
                      (rawAddress
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            rawAddress,
                          )}`
                        : "");
                    return (
                      <li
                        key={b.id}
                        role="listitem"
                        className="branch-row rounded-2xl border border-white/8 bg-[#0f0f11] p-3.5"
                        style={{ borderLeft: `3px solid ${color.dot}` }}
                      >
                        {/* Top row: dot + name + map link */}
                        <div className="flex items-start gap-3">
                          <span
                            className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{
                              background: color.dot,
                              boxShadow: `0 0 8px ${color.ring}`,
                            }}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-extrabold text-white">
                              {name}
                            </h4>
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/55">
                              {address}
                            </p>
                          </div>
                          {mapHref && (
                            <a
                              href={mapHref}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={t("visitBranch")}
                              className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-[#DC143C]/45 hover:text-[#ff4d6d] active:scale-95"
                              style={{ touchAction: "manipulation" }}
                              title={lang === "ar" ? "افتح الموقع" : "Open location"}
                            >
                              <Navigation size={15} />
                            </a>
                          )}
                        </div>

                        {/* Bottom row: call + WhatsApp pills */}
                        {b.phone && (
                          <div className="mt-3 flex items-center gap-2 border-t border-white/8 pt-3">
                            <a
                              href={telLink(b.phone)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold text-[#ff4d6d] transition active:scale-[0.98]"
                              style={{
                                background: "rgba(220,20,60,0.12)",
                                border: "1px solid rgba(220,20,60,0.28)",
                              }}
                              dir="ltr"
                            >
                              <Phone size={13} />
                              <span className="truncate">{b.phone}</span>
                            </a>
                            <a
                              href={waLink(
                                b.phone,
                                lang === "ar"
                                  ? `مرحباً، أرغب في الاستفسار عن فرع ${name}`
                                  : `Hello, I'd like to inquire about the ${name} branch`,
                              )}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={t("whatsapp")}
                              className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl transition active:scale-95"
                              style={{
                                background: "rgba(37,211,102,0.12)",
                                border: "1px solid rgba(37,211,102,0.28)",
                                color: "#25D366",
                              }}
                            >
                              <MessageCircle size={15} />
                            </a>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
