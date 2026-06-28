"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Clock, Check, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJI,
  ICON_EMOJI,
  softColor,
  type ServiceCategory,
  type ServiceVariant,
} from "@/lib/types";
import { useSettings } from "@/lib/use-settings";
import { useT, useLang } from "@/lib/use-lang";
import { cn } from "@/lib/utils";

export function formatPrice(price: number, currencyAr: string) {
  return `${price.toLocaleString("ar-EG")} ${currencyAr}`;
}

export function formatDuration(min: number, lang: "ar" | "en" = "ar") {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (lang === "en") {
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
  if (h === 0) return `${m} دقيقة`;
  if (m === 0) return `${h} ساعة`;
  return `${h} ساعة ${m} دقيقة`;
}

export function ServicesScreen() {
  const services = useApp((s) => s.services);
  const loadServices = useApp((s) => s.loadServices);
  const selectService = useApp((s) => s.selectService);
  const selectVariant = useApp((s) => s.selectVariant);
  const setTab = useApp((s) => s.setTab);
  const selectedCategory = useApp((s) => s.selectedCategory);
  const setSelectedCategory = useApp((s) => s.setSelectedCategory);
  const settings = useSettings();
  const t = useT();
  const lang = useLang();

  const [activeCat, setActiveCat] = useState<ServiceCategory>(
    (selectedCategory as ServiceCategory) || "protection"
  );
  // drill-down: when a variant service is tapped, show ONLY its variants
  const [drillServiceId, setDrillServiceId] = useState<string | null>(null);
  const [localVariant, setLocalVariant] = useState<ServiceVariant | null>(null);

  // Sync when selectedCategory changes (e.g. navigating from home)
  useEffect(() => {
    if (selectedCategory) {
      setActiveCat(selectedCategory as ServiceCategory);
      setSelectedCategory(null); // consume it
    }
  }, [selectedCategory, setSelectedCategory]);

  useEffect(() => {
    if (services.length === 0) loadServices();
  }, [services.length, loadServices]);

  const filtered = services.filter((s) => s.category === activeCat);
  const drillService = drillServiceId
    ? services.find((s) => s.id === drillServiceId)
    : null;

  // ===== Drill-down view: show ONLY this service's variants =====
  if (drillService) {
    const color = softColor(drillService.color);
    return (
      <DrillDownVariantScreen
        service={drillService}
        selectedVariant={localVariant}
        onSelect={setLocalVariant}
        onBack={() => {
          setDrillServiceId(null);
          setLocalVariant(null);
        }}
        onBook={() => {
          selectService(drillService);
          selectVariant(localVariant);
          setTab("booking");
        }}
      />
    );
  }

  // ===== Normal services list =====
  const book = (s: (typeof services)[number]) => {
    if (s.hasVariants) {
      // drill down to variant screen
      setDrillServiceId(s.id);
      setLocalVariant(null);
    } else {
      selectService(s);
      selectVariant(null);
      setTab("booking");
    }
  };

  return (
    <div className={cn("min-h-full", `cat-bg-${activeCat}`)}>
      <div className="px-5 pt-6 pb-4">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-extrabold text-white"
        >
          {t("ourServices")}
        </motion.h2>
        <p className="mt-1 text-sm text-white/50">{t("servicesSub")}</p>
      </div>

      {/* Category tabs */}
      <div className="px-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map((cat) => {
            const active = cat === activeCat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition",
                  active
                    ? "bg-gradient-to-l from-[#a00f2c] via-[#DC143C] to-[#ff1f4a] text-white shadow-[0_6px_20px_-6px_rgba(220,20,60,0.6)]"
                    : "border border-white/10 bg-white/[0.03] text-white/65 hover:text-white"
                )}
              >
                {lang === "ar" ? CATEGORY_LABELS[cat].ar : CATEGORY_LABELS[cat].en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Services list — carbon-fiber cards with big emoji tiles + fluorescent borders */}
      <div className="mt-5 space-y-3 px-5 pb-8">
        {filtered.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center text-sm text-white/50">
            {t("noServices")}
          </div>
        )}
        {filtered.map((s, i) => {
          const color = softColor(s.color);
          // Pick an emoji for the service: prefer icon-based emoji, fall back to category emoji
          const emoji = ICON_EMOJI[s.icon || ""] || CATEGORY_EMOJI[s.category];
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="service-card-carbon fluorescent-border overflow-hidden rounded-2xl"
              style={
                {
                  "--card-tint": color.bg,
                  "--card-neon": color.ring,
                  "--card-neon-bright": color.ring,
                  "--neon-color": color.ring,
                  "--neon-glow": color.bg,
                  "--neon-bright": color.ring,
                } as React.CSSProperties
              }
            >
              <button
                onClick={() => book(s)}
                className="flex w-full items-center gap-3 p-4 text-start active:scale-[0.99] transition"
              >
                {/* LARGE emoji tile (56x56) — colored to match the service soft color */}
                <div
                  className="service-emoji-tile shrink-0"
                  style={
                    {
                      "--tile-bg": color.bg,
                      "--tile-ring": color.ring,
                      "--tile-glow": color.bg,
                    } as React.CSSProperties
                  }
                  aria-hidden
                >
                  <span style={{ fontSize: "28px", lineHeight: 1 }}>{emoji}</span>
                </div>

                {/* content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-white">
                        {lang === "ar" ? s.nameAr : s.name}
                      </h3>
                      {s.descriptionAr && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-white/50">
                          {lang === "ar" ? s.descriptionAr : s.description}
                        </p>
                      )}
                    </div>
                    {/* price / note */}
                    <div className="shrink-0 text-left">
                      {s.hasVariants ? (
                        <span className="price-note">
                          {s.priceNote || (lang === "ar" ? "اختر النوع" : "Tap for prices")}
                        </span>
                      ) : (
                        <span
                          className="text-sm font-extrabold"
                          style={{ color: color.icon }}
                        >
                          {formatPrice(s.price, settings.currencyAr)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-white/45">
                      <Clock size={11} />
                      {formatDuration(s.duration, lang)}
                    </span>
                    {s.hasVariants && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/55">
                        {s.variants.length} {lang === "ar" ? "أنواع" : "options"}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ Drill-down variant screen ============ */
function DrillDownVariantScreen({
  service,
  selectedVariant,
  onSelect,
  onBack,
  onBook,
}: {
  service: ReturnType<typeof useApp.getState>["services"][number];
  selectedVariant: ServiceVariant | null;
  onSelect: (v: ServiceVariant | null) => void;
  onBack: () => void;
  onBook: () => void;
}) {
  const settings = useSettings();
  const t = useT();
  const lang = useLang();
  const color = softColor(service.color);
  const variants = service.variants.filter((v) => v.isActive);

  return (
    <div
      className="variant-screen"
      style={{ ["--variant-tint" as string]: color.ring.replace("0.35", "0.18") }}
    >
      {/* Back bar */}
      <div className="px-4 pt-5 pb-2 flex items-center gap-3">
        <button
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70 hover:text-white transition"
        >
          {lang === "ar" ? <ChevronLeft size={18} /> : <ArrowRight size={18} />}
        </button>
        <p className="text-xs font-semibold text-white/60">
          {lang === "ar" ? "كل الخدمات" : "All services"}
        </p>
      </div>

      {/* Service hero header */}
      <div className="px-5 pt-3 pb-5 text-center">
        <div
          className="service-emoji-tile mx-auto"
          style={
            {
              width: "72px",
              height: "72px",
              "--tile-bg": color.bg,
              "--tile-ring": color.ring,
              "--tile-glow": color.bg,
            } as React.CSSProperties
          }
          aria-hidden
        >
          <span style={{ fontSize: "36px", lineHeight: 1 }}>
            {ICON_EMOJI[service.icon || ""] || CATEGORY_EMOJI[service.category]}
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-extrabold text-white">
          {lang === "ar" ? service.nameAr : service.name}
        </h2>
        {service.descriptionAr && (
          <p className="mt-1.5 text-xs text-white/55 max-w-xs mx-auto leading-relaxed">
            {lang === "ar" ? service.descriptionAr : service.description}
          </p>
        )}
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#DC143C]/30 bg-[#DC143C]/8 px-3 py-1">
          <span className="text-[11px] font-bold text-[#ff4d6d]">
            {service.priceNote || (lang === "ar" ? "اختر النوع" : "Choose type")}
          </span>
        </div>
      </div>

      {/* Variants — carbon-fiber panel with neon-accented options */}
      <div className="px-5 pb-6">
        <div className="variants-panel carbon-fiber">
          {variants.map((v, i) => {
            const active = selectedVariant?.id === v.id;
            return (
              <motion.button
                key={v.id}
                initial={{ opacity: 0, x: lang === "ar" ? 12 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelect(active ? null : v)}
                className={cn("variant-option w-full text-start", active && "selected")}
                style={
                  active
                    ? {
                        borderColor: color.ring,
                        background: `linear-gradient(135deg, ${color.bg} 0%, rgba(0,0,0,0.2) 100%)`,
                        boxShadow: `0 0 0 1px ${color.ring}, 0 0 14px ${color.ring}, inset 0 0 12px ${color.bg}`,
                      }
                    : undefined
                }
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full border-2 transition",
                      active ? "border-white/80 bg-white/15" : "border-white/20"
                    )}
                    style={active ? { borderColor: color.icon } : undefined}
                  >
                    {active && <Check size={13} className="text-white" />}
                  </span>
                  <span className="variant-name">{lang === "ar" ? v.nameAr : v.name}</span>
                </span>
                <span className="flex items-center gap-2">
                  {v.duration && (
                    <span className="text-[10px] text-white/40">
                      {formatDuration(v.duration, lang)}
                    </span>
                  )}
                  <span
                    className="variant-price"
                    style={{ color: color.icon }}
                  >
                    {formatPrice(v.price, settings.currencyAr)}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Book button */}
        <button
          onClick={onBook}
          disabled={!selectedVariant}
          className={cn(
            "mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition",
            selectedVariant
              ? "bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] text-white shadow-[0_8px_24px_-8px_rgba(220,20,60,0.6)] active:scale-[0.98]"
              : "cursor-not-allowed bg-white/5 text-white/30"
          )}
        >
          {selectedVariant ? (
            <>
              {t("bookThisService")} · {formatPrice(selectedVariant.price, settings.currencyAr)}
              <ChevronLeft size={16} />
            </>
          ) : (
            t("chooseTypeFirst")
          )}
        </button>
      </div>
    </div>
  );
}
