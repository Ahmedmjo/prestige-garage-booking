"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  Clock,
  Car,
  Phone,
  Search,
  CalendarPlus,
  Loader2,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Tag,
  CarFront,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useSettings } from "@/lib/use-settings";
import { ServiceIcon } from "@/components/brand/ServiceIcon";
import { formatPrice } from "@/components/services/ServicesScreen";
import {
  STATUS_LABELS,
  WORKFLOW_STEPS,
  workflowProgress,
  type BookingItem,
  type BookingStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT, useLang } from "@/lib/use-lang";
import type { TranslationKey } from "@/lib/i18n";

type T = (key: TranslationKey) => string;

// Workflow stage colors (yellow → blue → orange → green)
const STAGE_COLORS: Record<
  BookingStatus,
  { dot: string; line: string; text: string; bg: string }
> = {
  pending: { dot: "#fbbf24", line: "rgba(251,191,36,0.5)", text: "#fbbf24", bg: "rgba(251,191,36,0.10)" },
  accepted: { dot: "#60a5fa", line: "rgba(96,165,250,0.5)", text: "#60a5fa", bg: "rgba(96,165,250,0.10)" },
  in_progress: { dot: "#fb923c", line: "rgba(251,146,60,0.5)", text: "#fb923c", bg: "rgba(251,146,60,0.10)" },
  completed: { dot: "#4ade80", line: "rgba(74,222,128,0.5)", text: "#4ade80", bg: "rgba(74,222,128,0.10)" },
  cancelled: { dot: "#9ca3af", line: "rgba(156,163,175,0.3)", text: "#9ca3af", bg: "rgba(156,163,175,0.10)" },
};

const STAGE_LABELS: Record<string, { ar: string; en: string }> = {
  pending: { ar: "قيد الانتظار", en: "Pending" },
  accepted: { ar: "تم القبول", en: "Accepted" },
  in_progress: { ar: "قيد التنفيذ", en: "In Progress" },
  completed: { ar: "مكتمل", en: "Completed" },
};

export function BookingsScreen() {
  const settings = useSettings();
  const t = useT();
  const lang = useLang();
  const myPhone = useApp((s) => s.myPhone);
  const setMyPhone = useApp((s) => s.setMyPhone);
  const myBookings = useApp((s) => s.myBookings);
  const loadMyBookings = useApp((s) => s.loadMyBookings);
  const setTab = useApp((s) => s.setTab);
  const selectService = useApp((s) => s.selectService);

  const [input, setInput] = useState(myPhone ?? "");
  const [loading, setLoading] = useState(false);

  const search = async (phone?: string) => {
    const p = (phone ?? input).trim();
    if (!p) return;
    setLoading(true);
    setMyPhone(p);
    await loadMyBookings(p);
    setLoading(false);
  };

  useEffect(() => {
    if (myPhone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void search(myPhone);
    }
  }, []);

  // ===== Smart reminders: bookings with expiryDate =====
  const reminders = useMemo(() => {
    return myBookings
      .filter(
        (b): b is BookingItem & { expiryDate: string } =>
          !!b.expiryDate && b.status !== "cancelled"
      )
      .map((b) => {
        const expiry = new Date(b.expiryDate);
        const now = new Date();
        const diffMs = expiry.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        let level: "expired" | "soon" | "ok";
        if (daysLeft < 0) level = "expired";
        else if (daysLeft <= 30) level = "soon";
        else level = "ok";
        return { booking: b, daysLeft, level };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [myBookings]);

  return (
    <div className="min-h-full px-5 pt-6 pb-8">
      <h2 className="text-2xl font-extrabold text-white">{t("myBookings")}</h2>
      <p className="mt-1 text-sm text-white/50">{t("trackBookings")}</p>

      {/* ===== Premium phone search ===== */}
      <div className="mt-5">
        <div className="glass-card-red flex items-center gap-2 rounded-2xl px-3.5 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#DC143C]/15 text-[#ff4d6d]">
            <Phone size={15} />
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === "ar" ? "01xxxxxxxxx" : "01xxxxxxxxx"}
            inputMode="tel"
            dir="ltr"
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none text-right"
          />
          <button
            onClick={() => search()}
            disabled={loading || !input.trim()}
            className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] text-white shadow-[0_6px_18px_-6px_rgba(220,20,60,0.6)] disabled:opacity-40 transition active:scale-95 btn-shimmer"
            aria-label={lang === "ar" ? "بحث" : "Search"}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
          </button>
        </div>
      </div>

      {/* ===== Smart Reminders section ===== */}
      {myPhone && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative grid h-8 w-8 place-items-center rounded-xl bg-[#DC143C]/15 border border-[#DC143C]/30">
              <Bell size={16} className="text-[#ff4d6d]" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#ff4d6d] animate-pulse" />
            </div>
            <h3 className="text-sm font-extrabold text-white">
              {t("smartReminders")}
            </h3>
            {reminders.length > 0 && (
              <span className="rounded-full bg-[#DC143C]/15 border border-[#DC143C]/30 px-2 py-0.5 text-[10px] font-bold text-[#ff4d6d]">
                {reminders.length}
              </span>
            )}
          </div>

          {reminders.length === 0 ? (
            <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-white/40">
                <Bell size={16} />
              </div>
              <p className="text-xs text-white/50">{t("noReminders")}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {reminders.map(({ booking, daysLeft, level }) => (
                <ReminderCard
                  key={booking.id}
                  booking={booking}
                  daysLeft={daysLeft}
                  level={level}
                  t={t}
                  lang={lang}
                  onBook={() => {
                    if (booking.service) selectService(booking.service);
                    setTab("booking");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Admin Notes (Garage Notices) — prominent glowing banners ===== */}
      {myBookings.some((b) => (b as BookingItem & { adminNote?: string | null }).adminNote) && (
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative grid h-8 w-8 place-items-center rounded-xl bg-[#fbbf24]/15 border border-[#fbbf24]/30">
              <Bell size={16} className="text-[#fbbf24]" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#fbbf24] animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
            </div>
            <h3 className="text-sm font-extrabold text-[#fbbf24]">
              {lang === "ar" ? "تنبيهات الورشة" : "Garage Notices"}
            </h3>
          </div>
          {myBookings
            .filter((b) => (b as BookingItem & { adminNote?: string | null }).adminNote)
            .map((b) => {
              const note = (b as BookingItem & { adminNote?: string | null }).adminNote!;
              return (
                <motion.div
                  key={`note-${b.id}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.04))",
                    border: "1.5px solid rgba(251,191,36,0.35)",
                    boxShadow: "0 0 20px rgba(251,191,36,0.12), inset 0 0 12px rgba(251,191,36,0.05)",
                  }}
                >
                  {/* Animated color-pulsing glow strip at top */}
                  <div
                    className="absolute top-0 inset-x-0 h-0.5 animate-pulse"
                    style={{
                      background: "linear-gradient(90deg, transparent, #fbbf24, transparent)",
                      boxShadow: "0 0 10px rgba(251,191,36,0.6)",
                    }}
                  />
                  <div className="flex items-start gap-3 p-4">
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                      style={{
                        background: "rgba(251,191,36,0.15)",
                        border: "1px solid rgba(251,191,36,0.35)",
                        boxShadow: "0 0 10px rgba(251,191,36,0.2), inset 0 0 8px rgba(251,191,36,0.08)",
                      }}
                    >
                      <Bell size={18} style={{ color: "#fbbf24" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-extrabold text-[#fbbf24] uppercase tracking-wider">
                          {lang === "ar" ? "تنبيه من الورشة" : "Garage Notice"}
                        </span>
                        {b.service && (
                          <span className="text-[9px] font-semibold text-white/40">
                            · {b.service.nameAr}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] font-medium text-white/90 leading-relaxed">
                        {note}
                      </p>
                      {b.expiryDate && (
                        <p className="mt-1.5 text-[10px] text-[#fbbf24]/70">
                          {lang === "ar" ? "تاريخ الانتهاء:" : "Expires:"} {b.expiryDate.slice(0, 10)}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      {/* ===== Bookings list ===== */}
      {myBookings.length > 0 ? (
        <div className="mt-6 space-y-3">
          <div className="mb-1 flex items-center gap-2">
            <CalendarCheck size={15} className="text-[#ff4d6d]" />
            <h3 className="text-sm font-bold text-white/85">
              {lang === "ar" ? `حجوزاتك (${myBookings.length})` : `Your bookings (${myBookings.length})`}
            </h3>
          </div>
          {myBookings.map((b, i) => {
            const status = b.status as BookingStatus;
            const s = b.service;
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card overflow-hidden rounded-2xl"
              >
                {/* Header with ref code + status badge */}
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
                  <span
                    className="text-[11px] font-bold tracking-wider text-white/55"
                    dir="ltr"
                  >
                    {b.refCode}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{
                      background: STAGE_COLORS[status].bg,
                      color: STAGE_COLORS[status].text,
                      border: `1px solid ${STAGE_COLORS[status].line}`,
                    }}
                  >
                    {STATUS_LABELS[status][lang]}
                  </span>
                </div>

                <div className="p-4">
                  {/* Service info */}
                  {s && (
                    <div className="flex items-center gap-3">
                      <div
                        className="grid h-10 w-10 place-items-center rounded-xl bg-[#DC143C]/12"
                        style={{ border: `1px solid ${STAGE_COLORS[status].line}` }}
                      >
                        <ServiceIcon
                          name={s.icon}
                          size={18}
                          className="text-[#ff4d6d]"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {s.nameAr}
                        </p>
                        {b.variantName && (
                          <p className="flex items-center gap-1 text-[11px] font-semibold text-[#ff4d6d]">
                            <Tag size={10} />
                            {b.variantName}
                          </p>
                        )}
                        <p className="text-xs text-[#ff4d6d]">
                          {formatPrice(b.totalPrice, settings.currencyAr)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mini horizontal tracking line */}
                  <MiniTracker status={status} t={t} lang={lang} />

                  {/* Info grid */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <Info icon={<CalendarCheck size={13} />} label={t("stepDate")} value={b.date} />
                    <Info icon={<Clock size={13} />} label={t("chooseTime")} value={b.time} />
                    <Info icon={<Car size={13} />} label={t("carModel")} value={b.carModel || b.carBrand || "—"} />
                  </div>

                  {/* Car type + brand chips */}
                  {(b.carType || b.carBrand) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {b.carType && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/8 px-2 py-0.5 text-[10px] font-semibold text-white/65">
                          <CarFront size={10} />
                          {t(b.carType as TranslationKey)}
                        </span>
                      )}
                      {b.carBrand && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/8 px-2 py-0.5 text-[10px] font-semibold text-white/65">
                          <Car size={10} />
                          {b.carBrand}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expiry badge */}
                  {b.expiryDate && (
                    <ExpiryBadge
                      expiryDate={b.expiryDate}
                      t={t}
                      lang={lang}
                    />
                  )}

                  {/* Admin note — message from garage to customer */}
                  {(b as BookingItem & { adminNote?: string | null }).adminNote && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="reminder-badge mt-3"
                    >
                      <div className="reminder-icon-ring">
                        <Bell size={16} className="text-[#fbbf24]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-extrabold text-[#fbbf24] mb-0.5">
                          {lang === "ar" ? "تنبيه من الورشة" : "Garage Notice"}
                        </p>
                        <p className="text-[11px] text-white/80 leading-relaxed">
                          {(b as BookingItem & { adminNote?: string | null }).adminNote}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        myPhone &&
        !loading && (
          <div className="mt-10 flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white/5">
              <CalendarCheck size={28} className="text-white/30" />
            </div>
            <p className="mt-3 text-sm text-white/55">{t("noBookings")}</p>
            <button
              onClick={() => setTab("booking")}
              className="mt-4 flex items-center gap-1.5 rounded-2xl bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] px-5 py-2.5 text-xs font-bold text-white active:scale-[0.98] transition btn-shimmer"
            >
              <CalendarPlus size={15} />
              {lang === "ar" ? "احجز الآن" : "Book Now"}
            </button>
          </div>
        )
      )}

      {!myPhone && (
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white/5">
            <Phone size={28} className="text-white/30" />
          </div>
          <p className="mt-3 text-sm text-white/55">
            {lang === "ar" ? "أدخل رقم هاتفك لعرض حجوزاتك" : "Enter your phone to view bookings"}
          </p>
        </div>
      )}
    </div>
  );
}

// ===== Mini horizontal tracker (4 dots) =====
function MiniTracker({
  status,
  t,
  lang,
}: {
  status: BookingStatus;
  t: T;
  lang: "ar" | "en";
}) {
  const currentIndex = workflowProgress(status);
  const isCancelled = status === "cancelled";

  return (
    <div className="mt-3.5">
      <div className="flex items-center">
        {WORKFLOW_STEPS.map((st, i) => {
          const color = STAGE_COLORS[st];
          const isCurrent = !isCancelled && i === currentIndex;
          const isPast = !isCancelled && i < currentIndex;
          const isFuture = !isCancelled && i > currentIndex;
          const isLast = i === WORKFLOW_STEPS.length - 1;

          return (
            <div
              key={st}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "rounded-full transition-all",
                    isCurrent ? "h-4 w-4" : "h-2.5 w-2.5"
                  )}
                  style={{
                    background:
                      isCancelled || isFuture
                        ? "rgba(255,255,255,0.12)"
                        : color.dot,
                    boxShadow: isCurrent
                      ? `0 0 0 3px ${color.bg}, 0 0 10px ${color.line}`
                      : isPast
                        ? `0 0 0 1px ${color.bg}`
                        : "none",
                  }}
                />
                <span
                  className={cn(
                    "text-[8.5px] font-bold transition",
                    isCurrent
                      ? "text-white"
                      : isPast
                        ? "text-white/55"
                        : "text-white/30"
                  )}
                  style={isCurrent ? { color: color.text } : undefined}
                >
                  {STAGE_LABELS[st][lang]}
                </span>
              </div>
              {!isLast && (
                <div
                  className="mx-1 h-0.5 flex-1 rounded-full transition"
                  style={{
                    background:
                      isPast || isCurrent
                        ? `linear-gradient(90deg, ${color.line}, ${STAGE_COLORS[WORKFLOW_STEPS[i + 1]].line})`
                        : "rgba(255,255,255,0.10)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== Reminder card =====
// Uses .reminder-alert-expired / .reminder-alert-soon / .reminder-alert-ok CSS classes
// for color-coded backgrounds + borders + inset glows.
function ReminderCard({
  booking,
  daysLeft,
  level,
  t,
  lang,
  onBook,
}: {
  booking: BookingItem;
  daysLeft: number;
  level: "expired" | "soon" | "ok";
  t: T;
  lang: "ar" | "en";
  onBook: () => void;
}) {
  const config = {
    expired: {
      alertClass: "reminder-alert-expired",
      icon: <AlertTriangle size={16} className="text-[#f87171]" />,
      iconBg: "rgba(239,68,68,0.18)",
      iconBorder: "rgba(239,68,68,0.35)",
      title: lang === "ar" ? "منتهي! احجز الآن لتجنب الضرر" : "Expired! Book now to avoid damage",
      titleColor: "#f87171",
      daysColor: "#f87171",
      showBookNow: true,
    },
    soon: {
      alertClass: "reminder-alert-soon",
      icon: <Clock3 size={16} className="text-[#fbbf24]" />,
      iconBg: "rgba(245,158,11,0.18)",
      iconBorder: "rgba(245,158,11,0.35)",
      title:
        lang === "ar"
          ? `ينتهي قريباً — ${daysLeft} ${t("daysLeft")}`
          : `Expires soon — ${daysLeft} ${t("daysLeft")}`,
      titleColor: "#fbbf24",
      daysColor: "#fbbf24",
      showBookNow: true,
    },
    ok: {
      alertClass: "reminder-alert-ok",
      icon: <CheckCircle2 size={16} className="text-[#4ade80]" />,
      iconBg: "rgba(34,197,94,0.15)",
      iconBorder: "rgba(34,197,94,0.30)",
      title:
        lang === "ar"
          ? `ساري — ${daysLeft} ${t("daysLeft")}`
          : `Valid — ${daysLeft} ${t("daysLeft")}`,
      titleColor: "#4ade80",
      daysColor: "#4ade80",
      showBookNow: false,
    },
  }[level];

  const s = booking.service;
  const formattedExpiry = new Date(booking.expiryDate!).toLocaleDateString(
    lang === "ar" ? "ar-EG" : "en-GB",
    { year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl p-3.5", config.alertClass)}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ background: config.iconBg, border: `1px solid ${config.iconBorder}` }}
        >
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-extrabold leading-tight"
            style={{ color: config.titleColor }}
          >
            {config.title}
          </p>
          {s && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="truncate text-[12px] font-bold text-white">
                {s.nameAr}
              </span>
              {booking.variantName && (
                <>
                  <Tag size={10} className="shrink-0 text-[#ff4d6d]" />
                  <span className="shrink-0 text-[10px] font-bold text-[#ff4d6d]">
                    {booking.variantName}
                  </span>
                </>
              )}
            </div>
          )}
          <div className="mt-1 flex items-center gap-2 text-[10px] text-white/55">
            <span className="font-semibold" dir="ltr">
              {formattedExpiry}
            </span>
            <span className="text-white/30">·</span>
            <span className="font-bold" style={{ color: config.daysColor }}>
              {daysLeft < 0
                ? lang === "ar"
                  ? `منتهي منذ ${Math.abs(daysLeft)} يوم`
                  : `Expired ${Math.abs(daysLeft)}d ago`
                : `${daysLeft} ${t("daysLeft")}`}
            </span>
          </div>
        </div>
        {config.showBookNow && (
          <button
            onClick={onBook}
            className="shrink-0 rounded-xl bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] px-3 py-2 text-[10px] font-extrabold text-white shadow-[0_4px_14px_-4px_rgba(220,20,60,0.6)] active:scale-95 transition btn-shimmer"
          >
            {lang === "ar" ? "احجز الآن" : "Book Now"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ===== Expiry badge =====
function ExpiryBadge({
  expiryDate,
  t,
  lang,
}: {
  expiryDate: string;
  t: T;
  lang: "ar" | "en";
}) {
  const daysLeft = Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpired = daysLeft < 0;
  const isSoon = daysLeft >= 0 && daysLeft <= 30;
  const color = isExpired ? "#f87171" : isSoon ? "#fbbf24" : "#4ade80";
  const bg = isExpired
    ? "rgba(239,68,68,0.10)"
    : isSoon
      ? "rgba(251,191,36,0.10)"
      : "rgba(74,222,128,0.10)";
  const border = isExpired
    ? "rgba(239,68,68,0.30)"
    : isSoon
      ? "rgba(251,191,36,0.30)"
      : "rgba(74,222,128,0.30)";

  return (
    <div
      className="mt-3 flex items-center justify-between rounded-xl px-3 py-2"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-white/65">
        <Clock3 size={11} style={{ color }} />
        {t("serviceExpiry")}
      </span>
      <span className="text-[11px] font-bold" style={{ color }}>
        {isExpired
          ? t("expired")
          : `${daysLeft} ${t("daysLeft")}`}
      </span>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] py-2">
      <span className="flex items-center justify-center gap-1 text-[9px] text-white/40">
        <span className="text-[#ff4d6d]">{icon}</span>
        {label}
      </span>
      <p
        className="mt-0.5 text-[11px] font-semibold text-white truncate"
        dir="ltr"
      >
        {value}
      </p>
    </div>
  );
}
