"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Car,
  User,
  Phone,
  FileText,
  CheckCircle2,
  Loader2,
  Crown,
  Tag,
  CarFront,
  Search,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useSettings } from "@/lib/use-settings";
import { ServiceIcon } from "@/components/brand/ServiceIcon";
import { VariantSelector } from "@/components/booking/VariantSelector";
import {
  formatPrice,
  formatDuration,
} from "@/components/services/ServicesScreen";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  softColor,
  WORKFLOW_STEPS,
  STATUS_LABELS,
  type ServiceCategory,
  type ServiceItem,
  type BookingItem,
  type BookingStatus,
} from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT, useLang } from "@/lib/use-lang";
import { waLink } from "@/lib/phone";
import type { TranslationKey } from "@/lib/i18n";

type T = (key: TranslationKey) => string;

// 4 steps if no variant: service → date → details → confirm
// 5 steps if variant: service → variant → date → details → confirm
function buildSteps(hasVariant: boolean, t: T) {
  return hasVariant
    ? [t("stepService"), t("stepType"), t("stepDate"), t("stepDetails"), t("stepConfirm")]
    : [t("stepService"), t("stepDate"), t("stepDetails"), t("stepConfirm")];
}

// generate next 14 days
function useDays() {
  return useMemo(() => {
    const days: { key: string; label: string; dayNum: string; month: string }[] = [];
    const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        key,
        label: i === 0 ? "اليوم" : i === 1 ? "غداً" : dayNames[d.getDay()],
        dayNum: String(d.getDate()).padStart(2, "0"),
        month: monthNames[d.getMonth()],
      });
    }
    return days;
  }, []);
}

// Workflow stage color map (yellow → blue → orange → green)
const STAGE_COLORS: Record<BookingStatus, { dot: string; ring: string; line: string; text: string; bg: string }> = {
  pending: { dot: "#fbbf24", ring: "rgba(251,191,36,0.30)", line: "rgba(251,191,36,0.45)", text: "#fbbf24", bg: "rgba(251,191,36,0.10)" },
  accepted: { dot: "#60a5fa", ring: "rgba(96,165,250,0.30)", line: "rgba(96,165,250,0.45)", text: "#60a5fa", bg: "rgba(96,165,250,0.10)" },
  in_progress: { dot: "#fb923c", ring: "rgba(251,146,60,0.30)", line: "rgba(251,146,60,0.45)", text: "#fb923c", bg: "rgba(251,146,60,0.10)" },
  completed: { dot: "#4ade80", ring: "rgba(74,222,128,0.30)", line: "rgba(74,222,128,0.45)", text: "#4ade80", bg: "rgba(74,222,128,0.10)" },
  cancelled: { dot: "#9ca3af", ring: "rgba(156,163,175,0.30)", line: "rgba(156,163,175,0.30)", text: "#9ca3af", bg: "rgba(156,163,175,0.10)" },
};

// Car type options — big clear emoji per type
const CAR_TYPES = [
  { key: "sedan", labelKey: "sedan", emoji: "🚗" },
  { key: "suv", labelKey: "suv", emoji: "🚙" },
  { key: "largeSuv", labelKey: "largeSuv", emoji: "🚐" },
] as const;

export function BookingScreen() {
  const settings = useSettings();
  const t = useT();
  const lang = useLang();
  const services = useApp((s) => s.services);
  const loadServices = useApp((s) => s.loadServices);
  const selected = useApp((s) => s.selectedService);
  const selectService = useApp((s) => s.selectService);
  const selectedVariant = useApp((s) => s.selectedVariant);
  const selectVariant = useApp((s) => s.selectVariant);
  const setLastBooking = useApp((s) => s.setLastBooking);
  const setTab = useApp((s) => s.setTab);
  const setMyPhone = useApp((s) => s.setMyPhone);
  const myPhone = useApp((s) => s.myPhone);

  const hasVariant = !!selected?.hasVariants;
  const steps = useMemo(() => buildSteps(hasVariant, t), [hasVariant, t]);
  const [step, setStep] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    carModel: "",
    carPlate: "",
    notes: "",
  });
  const [carType, setCarType] = useState<"sedan" | "suv" | "largeSuv" | null>(null);
  const [carBrand, setCarBrand] = useState<string | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<BookingItem | null>(null);

  // live slot availability
  const [slots, setSlots] = useState<
    { time: string; remaining: number; capacity: number; full: boolean }[]
  >([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const days = useDays();

  useEffect(() => {
    if (services.length === 0) loadServices();
  }, [services.length, loadServices]);

  // fetch car brands once
  useEffect(() => {
    fetch("/api/car-brands")
      .then((r) => r.json())
      .then((d) => setBrands(d.brands || []))
      .catch(() => setBrands([]));
  }, []);

  // fetch available slots when date changes (or when entering the date step)
  const fetchSlots = async (d: string) => {
    setSlotsLoading(true);
    try {
      const cat = selected?.category || "other";
      const res = await fetch(`/api/slots?date=${d}&category=${cat}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  // reset step when service changes
  useEffect(() => {
    setStep(0);
  }, [selected?.id]);

  // group services by category for selection
  const grouped = useMemo(() => {
    const g: Record<string, ServiceItem[]> = {};
    for (const s of services) {
      if (!g[s.category]) g[s.category] = [];
      g[s.category].push(s);
    }
    return g;
  }, [services]);

  // effective price + duration
  const effPrice = selectedVariant ? selectedVariant.price : selected?.price ?? 0;
  const effDuration =
    selectedVariant?.duration && selectedVariant.duration > 0
      ? selectedVariant.duration
      : selected?.duration ?? 60;

  // step indices depend on whether variant step exists
  const variantStepIdx = hasVariant ? 1 : -1;
  const dateStepIdx = hasVariant ? 2 : 1;
  const detailsStepIdx = hasVariant ? 3 : 2;

  // fetch slots when entering the date step or changing date
  useEffect(() => {
    if (date && step === dateStepIdx) {
      setTime(null);
      fetchSlots(date);
    }
  }, [date, step]);

  const canNext =
    (step === 0 && selected) ||
    (step === variantStepIdx && selectedVariant) ||
    (step === dateStepIdx && date && time) ||
    (step === detailsStepIdx &&
      form.customerName &&
      form.phone &&
      form.carModel &&
      carType &&
      carBrand);

  // prefill phone if we already know it
  useEffect(() => {
    if (myPhone && !form.phone) {
      setForm((f) => ({ ...f, phone: myPhone }));
    }
  }, [myPhone, form.phone]);

  const submit = async () => {
    if (!selected || !date || !time) return;
    if (hasVariant && !selectedVariant) return;
    if (!carType || !carBrand) {
      toast.error(lang === "ar" ? "الرجاء اختيار نوع وماركة السيارة" : "Please select car type and brand");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          carModel: form.carModel,
          carPlate: form.carPlate,
          carType,
          carBrand,
          serviceId: selected.id,
          variantId: selectedVariant?.id ?? null,
          date,
          time,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "تعذر تأكيد الحجز، حاول مرة أخرى");
        return;
      }
      setMyPhone(form.phone);
      setLastBooking(data.booking);
      setDone(data.booking);
      setStep(steps.length - 1);
      toast.success(lang === "ar" ? "تم تأكيد حجزك بنجاح!" : "Booking confirmed!");
    } catch {
      toast.error(lang === "ar" ? "حدث خطأ بالشبكة، حاول مرة أخرى" : "Network error, try again");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Confirmation screen =====
  if (done) {
    return (
      <BookingConfirmed
        booking={done}
        onDone={() => {
          setDone(null);
          setStep(0);
          setDate(null);
          setTime(null);
          setCarType(null);
          setCarBrand(null);
          setForm({
            customerName: "",
            phone: "",
            carModel: "",
            carPlate: "",
            notes: "",
          });
          setTab("bookings");
        }}
      />
    );
  }

  return (
    <div className="min-h-full px-5 pt-6 pb-8">
      <h2 className="text-2xl font-extrabold text-white">{t("bookAppointment")}</h2>
      <p className="mt-1 text-sm text-white/50">
        {lang === "ar" ? `في ${steps.length} ${t("stepsSimple")}` : `${steps.length} ${t("stepsSimple")}`}
      </p>

      {/* Stepper */}
      <div className="mt-5 flex items-center">
        {steps.map((label, i) => (
          <div key={i} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition",
                  i < step && "bg-[#DC143C] text-white",
                  i === step &&
                    "bg-[#DC143C] text-white shadow-[0_0_0_4px_rgba(220,20,60,0.18)]",
                  i > step &&
                    "border border-white/15 bg-white/[0.02] text-white/40"
                )}
              >
                {i < step ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  i === step ? "text-white" : "text-white/40"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1 rounded-full",
                  i < step ? "bg-[#DC143C]" : "bg-white/10"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* ===== Step: Service select ===== */}
      {step === 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-6 space-y-5"
        >
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="glass-card-red flex items-center gap-3 rounded-2xl p-3">
                <div
                  className="grid h-11 w-11 place-items-center rounded-xl border"
                  style={{
                    borderColor: softColor(selected.color).ring,
                    background: softColor(selected.color).bg,
                  }}
                >
                  <ServiceIcon
                    name={selected.icon}
                    size={20}
                    color={softColor(selected.color).icon}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {selected.nameAr}
                  </p>
                  <p className="text-xs text-[#ff4d6d]">
                    {selected.hasVariants
                      ? selected.priceNote || t("chooseType")
                      : formatPrice(selected.price, settings.currencyAr)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    selectService(null);
                  }}
                  className="text-[11px] text-white/50 hover:text-white"
                >
                  {t("change")}
                </button>
              </div>

              {/* INLINE Next button — appears immediately below selected service */}
              <button
                onClick={() => canNext && setStep(1)}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition",
                  "bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] text-white shadow-[0_8px_24px_-8px_rgba(220,20,60,0.6)] active:scale-[0.98] btn-shimmer"
                )}
              >
                {t("next")}
                <ChevronLeft size={16} />
              </button>
            </motion.div>
          )}

          {(Object.keys(grouped) as ServiceCategory[]).map((cat) => (
            <div key={cat}>
              <div className="mb-2 flex items-center gap-2">
                {cat === "detailing" && (
                  <Crown size={14} className="text-[#ff4d6d]" />
                )}
                <h3 className="text-sm font-bold text-white/85">
                  {CATEGORY_LABELS[cat][lang]}
                </h3>
                <span className="text-[10px] text-white/35">
                  {grouped[cat].length}
                </span>
              </div>
              <div className="space-y-2">
                {grouped[cat].map((s) => {
                  const active = selected?.id === s.id;
                  const color = softColor(s.color);
                  return (
                    <button
                      key={s.id}
                      onClick={() => selectService(s)}
                      className={cn(
                        "booking-select-box flex w-full items-center gap-3 p-3 text-right active:scale-[0.99]",
                        active && "selected"
                      )}
                    >
                      <div
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border"
                        style={{ borderColor: color.ring, background: color.bg }}
                      >
                        <ServiceIcon name={s.icon} size={18} color={color.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {s.nameAr}
                        </p>
                        <p className="text-[11px] font-semibold text-white/55">
                          {s.hasVariants
                            ? `${s.variants.length} ${t("options")}`
                            : formatDuration(s.duration, lang)}
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-[#ff4d6d]">
                        {s.hasVariants
                          ? s.priceNote || t("chooseType")
                          : formatPrice(s.price, settings.currencyAr)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ===== Step: Variant select ===== */}
      {step === variantStepIdx && selected && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-6"
        >
          <div className="glass-card-red mb-4 flex items-center gap-3 rounded-2xl p-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-xl border"
              style={{
                borderColor: softColor(selected.color).ring,
                background: softColor(selected.color).bg,
              }}
            >
              <ServiceIcon
                name={selected.icon}
                size={20}
                color={softColor(selected.color).icon}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {selected.nameAr}
              </p>
              <p className="text-xs text-white/50">
                {lang === "ar" ? "اختر النوع المناسب" : "Choose the right type"}
              </p>
            </div>
          </div>

          <VariantSelector
            service={selected}
            selectedVariant={selectedVariant}
            onSelect={selectVariant}
            variant="full"
          />

          <p className="mt-3 text-[11px] text-white/40">
            {lang === "ar"
              ? "اختر النوع لإكمال الحجز. يمكنك تغيير الاختيار في أي وقت."
              : "Select a type to continue. You can change it anytime."}
          </p>
        </motion.div>
      )}

      {/* ===== Step: Date & Time ===== */}
      {step === dateStepIdx && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-6 space-y-5"
        >
          <div>
            <div className="mb-2 flex items-center gap-2">
              <CalendarIcon size={16} className="text-[#ff4d6d]" />
              <h3 className="text-sm font-bold text-white/85">{t("chooseDay")}</h3>
            </div>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {days.map((d) => {
                const active = date === d.key;
                return (
                  <button
                    key={d.key}
                    onClick={() => setDate(d.key)}
                    className={cn(
                      "booking-select-box flex w-16 shrink-0 flex-col items-center gap-0.5 py-3",
                      active && "selected"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-bold",
                        active ? "text-[#ff4d6d]" : "text-white/55"
                      )}
                    >
                      {d.label}
                    </span>
                    <span
                      className={cn(
                        "text-lg font-extrabold",
                        active ? "text-white" : "text-white/85"
                      )}
                    >
                      {d.dayNum}
                    </span>
                    <span className="text-[9px] font-semibold text-white/50">
                      {d.month}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Clock size={16} className="text-[#ff4d6d]" />
              <h3 className="text-sm font-bold text-white/85">{t("chooseTime")}</h3>
              {selected?.category === "wash" && (
                <span className="rounded-full bg-[#25D366]/12 border border-[#25D366]/30 px-2 py-0.5 text-[9px] font-bold text-[#25D366]">
                  {lang === "ar" ? "سيارتان/موعد" : "2 cars/slot"}
                </span>
              )}
            </div>
            {slotsLoading ? (
              <div className="flex h-16 items-center justify-center">
                <Loader2 size={18} className="animate-spin text-[#ff4d6d]" />
              </div>
            ) : slots.length === 0 ? (
              <p className="rounded-xl bg-white/[0.03] py-4 text-center text-xs text-white/50">
                {t("noSlotsAvailable")}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => {
                  const active = time === slot.time;
                  const disabled = slot.full;
                  return (
                    <button
                      key={slot.time}
                      onClick={() => !disabled && setTime(slot.time)}
                      disabled={disabled}
                      className={cn(
                        "booking-select-box relative py-2.5 text-xs font-bold text-white/85",
                        active && "selected text-white",
                        disabled && "cursor-not-allowed opacity-40"
                      )}
                      dir="ltr"
                    >
                      {slot.time}
                      {!active && slot.capacity > 0 && slot.capacity > 1 && (
                        <span
                          className={cn(
                            "absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[8px] font-bold",
                            disabled
                              ? "bg-[#ef4444] text-white"
                              : "bg-[#25D366] text-black"
                          )}
                        >
                          {slot.remaining}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ===== Step: Customer & car details ===== */}
      {step === detailsStepIdx && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-6 space-y-4"
        >
          {/* Car type selector — big emoji + label using .car-type-box */}
          <div>
            <span className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-white/70">
              <span className="text-[#ff4d6d]">
                <Car size={15} />
              </span>
              {t("carType")}
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {CAR_TYPES.map((ct) => {
                const active = carType === ct.key;
                return (
                  <button
                    key={ct.key}
                    type="button"
                    onClick={() => setCarType(ct.key)}
                    className={cn(
                      "car-type-box active:scale-[0.97]",
                      active && "selected"
                    )}
                  >
                    <span className="car-type-emoji" aria-hidden>
                      {ct.emoji}
                    </span>
                    <span className="car-type-label">
                      {t(ct.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Car brand — searchable Select dropdown */}
          <div>
            <span className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-white/70">
              <span className="text-[#ff4d6d]">
                <CarFront size={15} />
              </span>
              {t("carBrand")}
            </span>
            <Select value={carBrand ?? undefined} onValueChange={setCarBrand}>
              <SelectTrigger
                className={cn(
                  "booking-select-box h-12 w-full px-3.5 text-sm font-bold",
                  carBrand ? "selected text-white" : "text-white/50"
                )}
              >
                <SelectValue placeholder={t("selectBrand")} />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto bg-popover text-white">
                {brands.map((b) => (
                  <SelectItem
                    key={b}
                    value={b}
                    className="text-sm font-semibold text-white/85 focus:bg-[#DC143C]/12 focus:text-white"
                  >
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Field label={t("name")} icon={<User size={15} />}>
            <input
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
              placeholder={lang === "ar" ? "مثال: أحمد محمد" : "e.g. Ahmed Mohamed"}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
          </Field>
          <Field label={t("phone")} icon={<Phone size={15} />}>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="01xxxxxxxxx"
              inputMode="tel"
              dir="ltr"
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none text-right"
            />
          </Field>
          <Field label={t("carModel")} icon={<Car size={15} />}>
            <input
              value={form.carModel}
              onChange={(e) => setForm({ ...form, carModel: e.target.value })}
              placeholder={lang === "ar" ? "مثال: BMW 520i 2023" : "e.g. BMW 520i 2023"}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
          </Field>
          <Field label={t("carPlate")} icon={<Car size={15} />}>
            <input
              value={form.carPlate}
              onChange={(e) => setForm({ ...form, carPlate: e.target.value })}
              placeholder="ABC 1234"
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none text-right"
              dir="ltr"
            />
          </Field>
          <Field label={t("notes")} icon={<FileText size={15} />}>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={
                lang === "ar"
                  ? "أي تفاصيل إضافية تريد إخبارنا بها..."
                  : "Any extra details you want to share..."
              }
              rows={3}
              className="w-full resize-none bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
          </Field>

          {/* summary with variant */}
          {selected && date && time && (
            <div className="glass-card-red rounded-2xl p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#ff4d6d]">
                {t("summary")}
              </p>
              <div className="space-y-1.5 text-xs text-white/75">
                <Row label={t("stepService")} value={selected.nameAr} />
                {selectedVariant && (
                  <Row
                    label={t("stepType")}
                    value={selectedVariant.nameAr}
                    highlight
                  />
                )}
                {carType && (
                  <Row label={t("carType")} value={t(carType)} />
                )}
                {carBrand && <Row label={t("carBrand")} value={carBrand} />}
                <Row
                  label={t("stepDate")}
                  value={
                    days.find((d) => d.key === date)?.dayNum +
                      " " +
                      days.find((d) => d.key === date)?.month || date
                  }
                />
                <Row label={t("chooseTime")} value={time} />
                <Row label={t("duration")} value={formatDuration(effDuration, lang)} />
                <div className="my-2 gold-divider" />
                <Row
                  label={t("total")}
                  value={formatPrice(effPrice, settings.currencyAr)}
                  highlight
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ===== Navigation buttons (NOT shown at step 0 — Next is inline there) ===== */}
      {step > 0 && step < steps.length - 1 && (
        <div className="mt-7 flex gap-3">
          {/* Back button visible at every step except step 0 */}
          {step > 0 && (
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="flex items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-semibold text-white/75 hover:bg-white/[0.06] transition"
            >
              <ChevronRight size={16} />
              {t("prev")}
            </button>
          )}
          {step < detailsStepIdx && (
            <button
              onClick={() => canNext && setStep((s) => s + 1)}
              disabled={!canNext}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-3.5 text-sm font-bold transition",
                canNext
                  ? "bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] text-white shadow-[0_8px_24px_-8px_rgba(220,20,60,0.6)] active:scale-[0.98] btn-shimmer"
                  : "cursor-not-allowed bg-white/5 text-white/30"
              )}
            >
              {t("next")}
              <ChevronLeft size={16} />
            </button>
          )}
          {step === detailsStepIdx && (
            <button
              onClick={submit}
              disabled={!canNext || submitting}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition",
                canNext && !submitting
                  ? "bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] text-white shadow-[0_8px_24px_-8px_rgba(220,20,60,0.6)] active:scale-[0.98] btn-shimmer"
                  : "cursor-not-allowed bg-white/5 text-white/30"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {lang === "ar" ? "جاري التأكيد..." : "Confirming..."}
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {t("confirmBooking")}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-white/70">
        <span className="text-[#ff4d6d]">{icon}</span>
        {label}
      </span>
      <div className="premium-card px-3.5 py-3 transition-all focus-within:border-[#DC143C]/60 focus-within:!translate-y-0">
        {children}
      </div>
    </label>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">{label}</span>
      <span
        className={cn(
          "font-semibold",
          highlight ? "text-[#ff4d6d] text-base" : "text-white"
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ===== Vertical tracking line component =====
function VerticalTracker({
  currentStatus,
  t,
  lang,
}: {
  currentStatus: BookingStatus;
  t: T;
  lang: "ar" | "en";
}) {
  const currentIndex = WORKFLOW_STEPS.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  const stepLabels: Record<string, string> = {
    pending: t("stepPending"),
    accepted: t("stepAccepted"),
    in_progress: t("stepInProgress"),
    completed: t("stepCompleted"),
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#DC143C]/12 text-[#ff4d6d]">
          <Search size={14} />
        </span>
        <h3 className="text-sm font-bold text-white">{t("bookingTracker")}</h3>
      </div>

      <div className="relative ps-2">
        {WORKFLOW_STEPS.map((status, i) => {
          const color = STAGE_COLORS[status];
          const isCurrent = !isCancelled && i === currentIndex;
          const isPast = !isCancelled && i < currentIndex;
          const isFuture = !isCancelled && i > currentIndex;
          const isLast = i === WORKFLOW_STEPS.length - 1;

          return (
            <div key={status} className="relative flex gap-3.5 pb-5 last:pb-0">
              {/* Vertical connecting line */}
              {!isLast && (
                <div
                  className="absolute top-5 bottom-0 start-[15px] w-0.5"
                  style={{
                    background: isPast
                      ? `linear-gradient(180deg, ${color.line}, ${STAGE_COLORS[WORKFLOW_STEPS[i + 1]].line})`
                      : "rgba(255,255,255,0.08)",
                  }}
                />
              )}

              {/* Dot */}
              <div className="relative z-10 shrink-0">
                <div
                  className={cn(
                    "grid place-items-center rounded-full transition-all",
                    isCurrent ? "h-8 w-8" : "h-6 w-6"
                  )}
                  style={{
                    background: isCurrent || isPast ? color.bg : "rgba(255,255,255,0.03)",
                    border: `2px solid ${isCurrent || isPast ? color.dot : "rgba(255,255,255,0.12)"}`,
                    boxShadow: isCurrent ? `0 0 0 4px ${color.ring}` : "none",
                  }}
                >
                  {isPast ? (
                    <CheckCircle2 size={14} style={{ color: color.dot }} />
                  ) : (
                    <span
                      className={cn(
                        "rounded-full",
                        isCurrent ? "h-2.5 w-2.5" : "h-1.5 w-1.5"
                      )}
                      style={{
                        background: isCurrent || isPast ? color.dot : "rgba(255,255,255,0.18)",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Label */}
              <div className="flex-1 pt-0.5">
                <p
                  className={cn(
                    "text-sm font-bold transition",
                    isCurrent
                      ? "text-white"
                      : isPast
                        ? "text-white/65"
                        : "text-white/35"
                  )}
                  style={isCurrent ? { color: color.text } : undefined}
                >
                  {stepLabels[status]}
                </p>
                {isCurrent && (
                  <p className="mt-0.5 text-[10px] text-white/40">
                    {lang === "ar" ? "المرحلة الحالية" : "Current stage"}
                  </p>
                )}
                {isPast && (
                  <p className="mt-0.5 text-[10px] text-white/30">
                    {lang === "ar" ? "مكتملة" : "Done"}
                  </p>
                )}
                {isFuture && (
                  <p className="mt-0.5 text-[10px] text-white/25">
                    {lang === "ar" ? "قادم" : "Upcoming"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isCancelled && (
        <div className="mt-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/25 p-3 text-center">
          <p className="text-xs font-bold text-[#f87171]">
            {STATUS_LABELS.cancelled[lang]}
          </p>
        </div>
      )}
    </div>
  );
}

function BookingConfirmed({
  booking,
  onDone,
}: {
  booking: BookingItem;
  onDone: () => void;
}) {
  const settings = useSettings();
  const s = booking.service;
  const t = useT();
  const lang = useLang();

  // Format date to readable Arabic
  const formatDateAr = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
      const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
    } catch { return dateStr; }
  };

  return (
    <div className="min-h-full px-5 pt-8 pb-8">
      {/* Success animation */}
      <div className="flex flex-col items-center mb-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-[#DC143C]/20 blur-xl scale-150 animate-pulse" />
          <div className="relative grid h-20 w-20 place-items-center rounded-full bg-[#DC143C]/15 border border-[#DC143C]/30">
            <CheckCircle2 size={40} className="text-[#ff4d6d]" />
          </div>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-2xl font-extrabold text-white"
        >
          {t("bookingConfirmed")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-1 text-center text-sm text-white/50 px-4"
        >
          {lang === "ar"
            ? "سنتواصل معك لتأكيد الموعد"
            : "We'll contact you to confirm your appointment"}
        </motion.p>
      </div>

      {/* Luxury receipt card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="booking-result-hero"
      >
        {/* Ref code */}
        <div className="text-center mb-5">
          <span className="text-[9px] uppercase tracking-[0.3em] text-white/40">
            {t("refCode")}
          </span>
          <p className="text-2xl font-black tracking-[0.12em] text-[#ff4d6d] mt-0.5" dir="ltr">
            {booking.refCode}
          </p>
        </div>

        {/* Date + Time pill — THE STAR */}
        <div className="flex justify-center mb-5">
          <div className="booking-datetime-pill">
            <div className="text-center">
              <div className="booking-time-big" dir="ltr">{booking.time}</div>
              <div className="booking-date-label">
                {lang === "ar" ? "الوقت" : "Time"}
              </div>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div className="text-center">
              <div className="text-sm font-extrabold text-white leading-tight">
                {lang === "ar" ? formatDateAr(booking.date) : booking.date}
              </div>
              <div className="booking-date-label">
                {lang === "ar" ? "التاريخ" : "Date"}
              </div>
            </div>
          </div>
        </div>

        {/* Divider with notch */}
        <div className="booking-ticket-divider">
          <div className="booking-ticket-notch" />
          <div className="booking-ticket-notch" />
          <div className="booking-ticket-notch" />
        </div>

        {/* Service info */}
        {s && (
          <div className="flex items-center gap-3 mb-4">
            <div
              className="grid h-11 w-11 place-items-center rounded-xl border flex-shrink-0"
              style={{
                borderColor: softColor(s.color).ring,
                background: softColor(s.color).bg,
              }}
            >
              <ServiceIcon
                name={s.icon}
                size={20}
                color={softColor(s.color).icon}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{s.nameAr}</p>
              {booking.variantName && (
                <p className="flex items-center gap-1 text-xs font-semibold text-[#ff4d6d]">
                  <Tag size={11} />
                  {booking.variantName}
                </p>
              )}
            </div>
            <span className="text-sm font-black text-[#ff4d6d]">
              {formatPrice(booking.totalPrice, settings.currencyAr)}
            </span>
          </div>
        )}

        {/* Details rows */}
        <div className="space-y-2 rounded-xl bg-white/[0.03] border border-white/8 p-3">
          {[
            { label: t("name"), value: booking.customerName },
            { label: t("carModel"), value: booking.carModel },
            booking.carBrand ? { label: t("carBrand"), value: booking.carBrand } : null,
            booking.carType ? { label: t("carType"), value: booking.carType } : null,
            booking.carPlate ? { label: "لوحة السيارة", value: booking.carPlate } : null,
          ].filter(Boolean).map((row, idx) => row && (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">{row.label}</span>
              <span className="text-[11px] font-semibold text-white/85">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Second divider */}
        <div className="booking-ticket-divider mt-4">
          <div className="booking-ticket-notch" />
          <div className="booking-ticket-notch" />
          <div className="booking-ticket-notch" />
        </div>

        {/* Workflow tracker */}
        <div className="mt-2">
          <VerticalTracker currentStatus={booking.status} t={t} lang={lang} />
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-4 flex gap-3"
      >
        <a
          href={waLink(settings.whatsapp, lang === "ar"
              ? `مرحباً، حجزت موعد برمز ${booking.refCode}`
              : `Hello, I booked an appointment with ref ${booking.refCode}`)}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] py-3.5 text-xs font-semibold text-white/80 hover:bg-white/[0.06] transition text-center"
        >
          {t("whatsappContact")}
        </a>
        <button
          onClick={onDone}
          className="flex-1 rounded-2xl bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] py-3.5 text-xs font-bold text-white active:scale-[0.98] transition btn-shimmer"
        >
          {t("myBookings")}
        </button>
      </motion.div>
    </div>
  );
}
