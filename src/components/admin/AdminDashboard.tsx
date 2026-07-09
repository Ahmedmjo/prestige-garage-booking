"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  LogOut,
  Tags,
  CalendarDays,
  Settings as SettingsIcon,
  Plus,
  Save,
  Trash2,
  Power,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Clock,
  Layers,
  ChevronDown,
  Users,
  Search,
  Phone,
  Car,
  MapPin,
  Building,
  List as ListIcon,
  Table as TableIcon,
  Play,
  CalendarClock,
  ExternalLink,
  Pencil,
  Bell,
  Percent,
  BarChart,
  Tag,
  Image as ImageIcon,
  Video,
  TrendingUp,
  Wallet,
  CalendarRange,
  MessageSquare,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useSettings } from "@/lib/use-settings";
import { waLink, telLink } from "@/lib/phone";
import {
  adminFetchServices,
  adminUpdateService,
  adminCreateService,
  adminDeleteService,
  adminFetchBookings,
  adminUpdateBookingStatus,
  adminUpdateBookingExpiry,
  adminUpdateBookingNote,
  adminDeleteBooking,
  adminUpdateSettings,
  adminCreateVariant,
  adminUpdateVariant,
  adminDeleteVariant,
  adminFetchCustomers,
  adminDeleteCustomer,
  adminFetchBranches,
  adminCreateBranch,
  adminUpdateBranch,
  adminDeleteBranch,
  adminFetchOffers,
  adminCreateOffer,
  adminUpdateOffer,
  adminDeleteOffer,
  adminFetchReport,
} from "@/lib/api";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  CATEGORY_LABELS,
  DETAILING_SUBS,
  STATUS_LABELS,
  workflowProgress,
  softColor,
  type ServiceCategory,
  type DetailingSub,
  type BookingStatus,
  type ServiceVariant,
} from "@/lib/types";
import type {
  ServiceItem,
  BookingItem,
  BranchItem,
  SiteSettings,
} from "@/lib/types";
import { ServiceIcon } from "@/components/brand/ServiceIcon";
import { BrandCrown } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

type Tab =
  | "services"
  | "variants"
  | "bookings"
  | "customers"
  | "branches"
  | "offers"
  | "reports"
  | "settings";

export function AdminDashboard() {
  const setAdminMode = useApp((s) => s.setAdminMode);
  const setAdminPin = useApp((s) => s.setAdminPin);
  const adminPin = useApp((s) => s.adminPin)!;
  const [tab, setTab] = useState<Tab>("services");

  const logout = () => {
    setAdminPin(null);
    setAdminMode(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-background/92 backdrop-blur-xl pt-safe">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <BrandCrown size={26} glow={false} />
            <div className="leading-tight">
              <p className="text-xs font-extrabold text-white">
                <span className="crown-shine">PRESTIGE</span> ADMIN
              </p>
              <p className="text-[9px] text-white/40">لوحة التحكم</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell pin={adminPin} onOpenBookings={() => setTab("bookings")} />
            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition"
            >
              <LogOut size={13} />
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* tabs */}
      <div className="sticky top-14 z-20 border-b border-white/8 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-8">
          {([
            { key: "services", label: "الخدمات", icon: Tags },
            { key: "variants", label: "الأنواع", icon: Layers },
            { key: "bookings", label: "الحجوزات", icon: CalendarDays },
            { key: "customers", label: "العملاء", icon: Users },
            { key: "branches", label: "الفروع", icon: MapPin },
            { key: "offers", label: "العروض", icon: Percent },
            { key: "reports", label: "التقارير", icon: BarChart },
            { key: "settings", label: "الإعدادات", icon: SettingsIcon },
          ] as { key: Tab; label: string; icon: typeof Tags }[]).map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[8px] font-semibold transition",
                  active ? "text-[#ff4d6d]" : "text-white/50"
                )}
              >
                <Icon size={14} strokeWidth={active ? 2.4 : 2} />
                {t.label}
                {active && (
                  <span className="absolute bottom-0 h-0.5 w-6 rounded-full bg-[#DC143C] shadow-[0_0_8px_rgba(220,20,60,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-md px-4 py-4">
        {tab === "services" && <ServicesManager pin={adminPin} />}
        {tab === "variants" && <VariantsManager pin={adminPin} />}
        {tab === "bookings" && <BookingsManager pin={adminPin} />}
        {tab === "customers" && <CustomersManager pin={adminPin} />}
        {tab === "branches" && <BranchesManager pin={adminPin} />}
        {tab === "offers" && <OffersManager pin={adminPin} />}
        {tab === "reports" && <ReportsManager pin={adminPin} />}
        {tab === "settings" && <SettingsManager pin={adminPin} />}
      </main>
    </div>
  );
}

/* ============ NOTIFICATION BELL — pending bookings poller ============ */
function NotificationBell({
  pin,
  onOpenBookings,
}: {
  pin: string;
  onOpenBookings: () => void;
}) {
  const [count, setCount] = useState(0);
  // Lazy init from localStorage — avoids synchronous setState in effect
  const [seen, setSeen] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("adminNotificationsLastSeen");
  });

  useEffect(() => {
    let active = true;

    const fetchCount = async () => {
      const lastSeen =
        (typeof window !== "undefined" &&
          localStorage.getItem("adminNotificationsLastSeen")) ||
        "";
      try {
        const url = `/api/admin/notifications${
          lastSeen ? `?lastSeen=${encodeURIComponent(lastSeen)}` : ""
        }`;
        const res = await fetch(url, { headers: { "x-admin-pin": pin } });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        const newCount: number = data.count ?? 0;
        setCount(newCount);
      } catch {
        // ignore network errors silently
      }
    };

    void fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pin]);

  const handleClick = async () => {
    // Navigate to bookings tab so admin can see pending bookings
    onOpenBookings();
    // Mark all current notifications as seen (PUT updates server-side lastSeen + localStorage)
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "x-admin-pin": pin },
      });
      if (res.ok) {
        const data = await res.json();
        const now: string = data.lastSeen || new Date().toISOString();
        localStorage.setItem("adminNotificationsLastSeen", now);
        setSeen(true);
        setCount(0);
      }
    } catch {
      // ignore network errors silently
    }
  };

  const showRedBadge = count > 0;
  const showGreenDot = !showRedBadge && seen;

  return (
    <button
      onClick={handleClick}
      className="notification-bell relative flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] p-2 text-white/70 hover:text-white hover:bg-white/[0.06] transition"
      aria-label={showRedBadge ? `${count} new pending bookings` : "Notifications"}
    >
      <Bell size={16} />
      {showRedBadge && (
        <span className="notification-badge">
          {count > 99 ? "99+" : count}
        </span>
      )}
      {showGreenDot && <span className="notification-dot-green" />}
    </button>
  );
}

/* ============ SERVICES MANAGER (prices!) ============ */
function ServicesManager({ pin }: { pin: string }) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<
    Record<string, { price: string; duration: string; nameAr: string; isActive: boolean }>
  >({});
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"list" | "table">("list");
  const [sortBy, setSortBy] = useState<"category" | "newest">("category");

  const load = async () => {
    const data = await adminFetchServices(pin);
    setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const startEdit = (s: ServiceItem) => {
    setEditing((e) => ({
      ...e,
      [s.id]: {
        price: String(s.price),
        duration: String(s.duration),
        nameAr: s.nameAr,
        isActive: s.isActive,
      },
    }));
  };

  const save = async (s: ServiceItem) => {
    const ed = editing[s.id];
    if (!ed) return;
    setSaving(s.id);
    const ok = await adminUpdateService(pin, s.id, {
      price: Number(ed.price),
      duration: Number(ed.duration),
      nameAr: ed.nameAr,
      isActive: ed.isActive,
    });
    setSaving(null);
    if (ok) {
      toast.success("تم تحديث السعر بنجاح");
      setEditing((e) => {
        const n = { ...e };
        delete n[s.id];
        return n;
      });
      load();
    } else {
      toast.error("فشل التحديث");
    }
  };

  const remove = async (s: ServiceItem) => {
    if (!confirm(`حذف خدمة "${s.nameAr}"؟`)) return;
    const ok = await adminDeleteService(pin, s.id);
    if (ok) {
      toast.success("تم الحذف");
      load();
    } else toast.error("فشل الحذف");
  };

  const toggleActive = async (s: ServiceItem) => {
    const ok = await adminUpdateService(pin, s.id, { isActive: !s.isActive });
    if (ok) {
      toast.success(s.isActive ? "تم الإخفاء" : "تم التفعيل");
      load();
    }
  };

  // group by category
  const grouped: Record<string, ServiceItem[]> = {};
  for (const s of services) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#ff4d6d]" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat label="إجمالي الخدمات" value={String(services.length)} />
        <Stat
          label="مفعّلة"
          value={String(services.filter((s) => s.isActive).length)}
        />
        <Stat
          label="الديتيلنج"
          value={String(
            services.filter((s) => s.category === "detailing").length
          )}
        />
      </div>

      {/* view toggle */}
      <div className="mb-3 flex items-center gap-1 rounded-xl border border-white/8 bg-white/[0.02] p-1">
        <button
          onClick={() => setView("list")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold transition",
            view === "list"
              ? "bg-[#DC143C] text-white shadow-[0_4px_12px_-4px_rgba(220,20,60,0.6)]"
              : "text-white/60 hover:text-white"
          )}
        >
          <ListIcon size={13} /> قائمة
        </button>
        <button
          onClick={() => setView("table")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold transition",
            view === "table"
              ? "bg-[#DC143C] text-white shadow-[0_4px_12px_-4px_rgba(220,20,60,0.6)]"
              : "text-white/60 hover:text-white"
          )}
        >
          <TableIcon size={13} /> جدول
        </button>
      </div>

      {/* sort selector for table view */}
      {view === "table" && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[10px] font-semibold text-white/45">ترتيب:</span>
          <button
            onClick={() => setSortBy("category")}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold transition",
              sortBy === "category"
                ? "bg-[#DC143C]/15 text-[#ff4d6d] border border-[#DC143C]/30"
                : "border border-white/10 bg-white/[0.03] text-white/55"
            )}
          >
            حسب القسم
          </button>
          <button
            onClick={() => setSortBy("newest")}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold transition",
              sortBy === "newest"
                ? "bg-[#DC143C]/15 text-[#ff4d6d] border border-[#DC143C]/30"
                : "border border-white/10 bg-white/[0.03] text-white/55"
            )}
          >
            الأحدث
          </button>
        </div>
      )}

      <button
        onClick={() => setAdding(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#DC143C]/40 bg-[#DC143C]/5 py-3 text-xs font-bold text-[#ff4d6d] hover:bg-[#DC143C]/10 transition"
      >
        <Plus size={16} />
        إضافة خدمة جديدة
      </button>

      {view === "table" ? (
        <ServicesTableView
          services={services}
          grouped={grouped}
          sortBy={sortBy}
          onEdit={startEdit}
          onToggle={toggleActive}
          onDelete={remove}
        />
      ) : (
        (Object.keys(grouped) as ServiceCategory[]).map((cat) => (
          <div key={cat} className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                {CATEGORY_LABELS[cat].ar}
              </h3>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                {grouped[cat].length}
              </span>
            </div>
            <div className="space-y-2">
              {grouped[cat].map((s) => {
                const ed = editing[s.id];
                const isEditing = !!ed;
                return (
                  <motion.div
                    key={s.id}
                    layout
                    className={cn(
                      "rounded-2xl border p-3 transition",
                      s.isActive
                        ? "border-white/8 bg-white/[0.02]"
                        : "border-white/5 bg-white/[0.01] opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#DC143C]/10">
                        <ServiceIcon
                          name={s.icon}
                          size={16}
                          className="text-[#ff4d6d]"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            value={ed.nameAr}
                            onChange={(e) =>
                              setEditing((p) => ({
                                ...p,
                                [s.id]: { ...p[s.id], nameAr: e.target.value },
                              }))
                            }
                            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm font-bold text-white focus:border-[#DC143C]/50 focus:outline-none"
                          />
                        ) : (
                          <p className="truncate text-sm font-bold text-white">
                            {s.nameAr}
                          </p>
                        )}
                        {s.subCategory && (
                          <p className="text-[10px] text-white/40">
                            {DETAILING_SUBS[s.subCategory as DetailingSub]?.ar ||
                              s.subCategory}
                          </p>
                        )}
                      </div>
                      {!isEditing && (
                        <span className="text-sm font-extrabold text-[#ff4d6d]">
                          {s.price}
                        </span>
                      )}
                    </div>

                    {isEditing && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <label className="block">
                          <span className="text-[10px] text-white/45">
                            السعر (ج.م)
                          </span>
                          <input
                            type="number"
                            value={ed.price}
                            onChange={(e) =>
                              setEditing((p) => ({
                                ...p,
                                [s.id]: { ...p[s.id], price: e.target.value },
                              }))
                            }
                            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] text-white/45">
                            المدة (دقيقة)
                          </span>
                          <input
                            type="number"
                            value={ed.duration}
                            onChange={(e) =>
                              setEditing((p) => ({
                                ...p,
                                [s.id]: { ...p[s.id], duration: e.target.value },
                              }))
                            }
                            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
                          />
                        </label>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => save(s)}
                            disabled={saving === s.id}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#DC143C] py-2 text-xs font-bold text-white disabled:opacity-50 transition active:scale-95"
                          >
                            {saving === s.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Save size={13} />
                            )}
                            حفظ
                          </button>
                          <button
                            onClick={() =>
                              setEditing((e) => {
                                const n = { ...e };
                                delete n[s.id];
                                return n;
                              })
                            }
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white transition"
                          >
                            إلغاء
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(s)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white/80 hover:bg-white/[0.08] transition"
                          >
                            تعديل السعر
                          </button>
                          <button
                            onClick={() => toggleActive(s)}
                            title={s.isActive ? "إخفاء" : "تفعيل"}
                            className={cn(
                              "grid h-8 w-8 place-items-center rounded-lg border transition",
                              s.isActive
                                ? "border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366]"
                                : "border-white/10 bg-white/5 text-white/40"
                            )}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => remove(s)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#f87171] transition active:scale-90"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {adding && (
        <AddServiceModal
          pin={pin}
          onClose={() => setAdding(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}

/* ============ SERVICES TABLE VIEW (grouped) ============ */
function ServicesTableView({
  services,
  grouped,
  sortBy,
  onEdit,
  onToggle,
  onDelete,
}: {
  services: ServiceItem[];
  grouped: Record<string, ServiceItem[]>;
  sortBy: "category" | "newest";
  onEdit: (s: ServiceItem) => void;
  onToggle: (s: ServiceItem) => void;
  onDelete: (s: ServiceItem) => void;
}) {
  type ServiceRow = ServiceItem & { createdAt?: string };

  // Ordered categories list (matches defined order)
  const orderedCats: ServiceCategory[] = [
    "protection",
    "thermal",
    "detailing",
    "polish",
    "wash",
    "extra",
  ];

  // For "newest" sort: flat list sorted by createdAt desc (fallback to sortOrder)
  if (sortBy === "newest") {
    const rows = [...services].sort((a, b) => {
      const aRow = a as ServiceRow;
      const bRow = b as ServiceRow;
      const aT = aRow.createdAt ? new Date(aRow.createdAt).getTime() : 0;
      const bT = bRow.createdAt ? new Date(bRow.createdAt).getTime() : 0;
      return bT - aT;
    });

    return (
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="px-3 py-2 border-b border-white/8 bg-white/[0.03]">
          <p className="text-[11px] font-bold text-white/70">
            ترتيب حسب الأحدث ({rows.length})
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-white/45 text-[10px]">الخدمة</TableHead>
              <TableHead className="text-white/45 text-[10px]">السعر</TableHead>
              <TableHead className="text-white/45 text-[10px]">المدة</TableHead>
              <TableHead className="text-white/45 text-[10px] text-center">
                فعّال
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => {
              const row = s as ServiceRow;
              return (
                <TableRow
                  key={s.id}
                  className="border-white/6 hover:bg-white/[0.02]"
                >
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#DC143C]/10">
                        <ServiceIcon
                          name={s.icon}
                          size={12}
                          className="text-[#ff4d6d]"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold text-white">
                          {s.nameAr}
                        </p>
                        <p className="text-[9px] text-white/40">
                          {CATEGORY_LABELS[s.category].ar}
                          {row.createdAt
                            ? ` · ${new Date(row.createdAt).toLocaleDateString("ar-EG")}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[11px] font-bold text-[#ff4d6d]">
                    {s.price.toLocaleString("ar-EG")}
                  </TableCell>
                  <TableCell className="text-[10px] text-white/60">
                    {s.duration} د
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "inline-block h-2 w-2 rounded-full",
                        s.isActive ? "bg-[#4ade80]" : "bg-white/20"
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Grouped by category view
  return (
    <div className="space-y-3">
      {orderedCats
        .filter((c) => grouped[c]?.length)
        .map((cat) => {
          const rows = grouped[cat];
          const totalValue = rows.reduce((sum, s) => sum + s.price, 0);
          const color = softColor(
            cat === "protection"
              ? "green"
              : cat === "thermal"
              ? "orange"
              : cat === "detailing"
              ? "purple"
              : cat === "polish"
              ? "yellow"
              : cat === "wash"
              ? "blue"
              : "gray"
          );
          return (
            <div
              key={cat}
              className="glass-card overflow-hidden rounded-2xl"
            >
              {/* category header */}
              <div
                className="flex items-center justify-between px-3 py-2 border-b border-white/8"
                style={{ background: color.bg }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: color.icon }}
                  />
                  <h4 className="text-[12px] font-bold text-white">
                    {CATEGORY_LABELS[cat].ar}
                  </h4>
                </div>
                <span className="text-[10px] font-semibold text-white/55">
                  {rows.length} خدمة
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-white/45 text-[10px]">
                      الخدمة
                    </TableHead>
                    <TableHead className="text-white/45 text-[10px]">
                      السعر
                    </TableHead>
                    <TableHead className="text-white/45 text-[10px]">
                      المدة
                    </TableHead>
                    <TableHead className="text-white/45 text-[10px] text-center">
                      فعّال
                    </TableHead>
                    <TableHead className="text-white/45 text-[10px] text-center">
                      إجراء
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => {
                    const row = s as ServiceRow;
                    return (
                      <TableRow
                        key={s.id}
                        className="border-white/6 hover:bg-white/[0.02]"
                      >
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#DC143C]/10">
                              <ServiceIcon
                                name={s.icon}
                                size={12}
                                className="text-[#ff4d6d]"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-bold text-white">
                                {s.nameAr}
                              </p>
                              {row.createdAt && (
                                <p className="text-[9px] text-white/35">
                                  {new Date(row.createdAt).toLocaleDateString(
                                    "ar-EG"
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[11px] font-bold text-[#ff4d6d]">
                          {s.price.toLocaleString("ar-EG")}
                        </TableCell>
                        <TableCell className="text-[10px] text-white/60">
                          {s.duration} د
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "inline-block h-2 w-2 rounded-full",
                              s.isActive ? "bg-[#4ade80]" : "bg-white/20"
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEdit(s)}
                              title="تعديل"
                              className="grid h-6 w-6 place-items-center rounded border border-white/10 bg-white/5 text-white/70 hover:text-white transition"
                            >
                              <Pencil size={10} />
                            </button>
                            <button
                              onClick={() => onToggle(s)}
                              title={s.isActive ? "إخفاء" : "تفعيل"}
                              className={cn(
                                "grid h-6 w-6 place-items-center rounded border transition",
                                s.isActive
                                  ? "border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366]"
                                  : "border-white/10 bg-white/5 text-white/40"
                              )}
                            >
                              <Power size={10} />
                            </button>
                            <button
                              onClick={() => onDelete(s)}
                              title="حذف"
                              className="grid h-6 w-6 place-items-center rounded border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#f87171] transition"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* summary row */}
                  <TableRow className="border-t border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                    <TableCell className="py-2">
                      <span className="text-[10px] font-bold text-white/70">
                        إجمالي القسم
                      </span>
                    </TableCell>
                    <TableCell className="text-[11px] font-extrabold text-[#ff4d6d]">
                      {totalValue.toLocaleString("ar-EG")}
                    </TableCell>
                    <TableCell className="text-[10px] text-white/50">
                      {rows.reduce((n, s) => n + s.duration, 0)} د
                    </TableCell>
                    <TableCell className="text-center text-[10px] text-white/50">
                      {rows.filter((s) => s.isActive).length}/{rows.length}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          );
        })}
    </div>
  );
}

function AddServiceModal({
  pin,
  onClose,
  onCreated,
}: {
  pin: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    category: "detailing" as ServiceCategory,
    subCategory: "" as string,
    price: "",
    duration: "60",
    icon: "Sparkles",
    color: "purple",
    hasVariants: false,
    priceNote: "",
    descriptionAr: "",
  });
  const [saving, setSaving] = useState(false);

  const icons = [
    "Crown",
    "Sofa",
    "Triangle",
    "CircleDot",
    "Cog",
    "Droplets",
    "Car",
    "Shield",
    "ShieldCheck",
    "Sparkles",
    "Lightbulb",
    "Armchair",
    "Wind",
    "Brush",
    "Gem",
  ];
  const colors = [
    { key: "blue", label: "أزرق" },
    { key: "yellow", label: "أصفر" },
    { key: "green", label: "أخضر" },
    { key: "purple", label: "بنفسجي" },
    { key: "orange", label: "برتقالي" },
    { key: "gray", label: "رمادي" },
  ];

  const submit = async () => {
    if (!form.name) {
      toast.error("الاسم مطلوب");
      return;
    }
    if (!form.hasVariants && !form.price) {
      toast.error("السعر مطلوب للخدمات بدون أنواع");
      return;
    }
    setSaving(true);
    const ok = await adminCreateService(pin, {
      name: form.name,
      nameAr: form.nameAr || form.name,
      category: form.category,
      subCategory:
        form.category === "detailing" ? form.subCategory || null : null,
      price: Number(form.price) || 0,
      duration: Number(form.duration),
      icon: form.icon,
      color: form.color,
      hasVariants: form.hasVariants,
      priceNote: form.hasVariants
        ? form.priceNote || "اختر النوع"
        : form.priceNote || null,
      descriptionAr: form.descriptionAr,
    });
    setSaving(false);
    if (ok) {
      toast.success("تمت إضافة الخدمة");
      onCreated();
      onClose();
    } else toast.error("فشل الإضافة");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto prestige-scroll rounded-t-3xl border border-white/10 bg-background p-5 pb-safe"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">إضافة خدمة جديدة</h3>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white"
          >
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <Input
            label="الاسم (إنجليزي)"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />
          <Input
            label="الاسم (عربي)"
            value={form.nameAr}
            onChange={(v) => setForm({ ...form, nameAr: v })}
          />

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-white/55">
              القسم
            </span>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as ServiceCategory,
                  subCategory: "",
                })
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
            >
              {(Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map((c) => (
                <option key={c} value={c} className="bg-background">
                  {CATEGORY_LABELS[c].ar}
                </option>
              ))}
            </select>
          </label>

          {form.category === "detailing" && (
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-white/55">
                القسم الفرعي للديتيلنج
              </span>
              <select
                value={form.subCategory}
                onChange={(e) =>
                  setForm({ ...form, subCategory: e.target.value })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
              >
                <option value="" className="bg-background">
                  — بدون —
                </option>
                {(Object.keys(DETAILING_SUBS) as DetailingSub[]).map((sub) => (
                  <option key={sub} value={sub} className="bg-background">
                    {DETAILING_SUBS[sub].ar}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="السعر (ج.م)"
              type="number"
              value={form.price}
              onChange={(v) => setForm({ ...form, price: v })}
            />
            <Input
              label="المدة (دقيقة)"
              type="number"
              value={form.duration}
              onChange={(v) => setForm({ ...form, duration: v })}
            />
          </div>

          <Input
            label="الوصف (عربي)"
            value={form.descriptionAr}
            onChange={(v) => setForm({ ...form, descriptionAr: v })}
            textarea
          />

          <div>
            <span className="mb-1.5 block text-[11px] font-semibold text-white/55">
              الأيقونة
            </span>
            <div className="flex flex-wrap gap-2">
              {icons.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setForm({ ...form, icon: ic })}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg border transition",
                    form.icon === ic
                      ? "border-[#DC143C]/60 bg-[#DC143C]/12 text-[#ff4d6d]"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  )}
                >
                  <ServiceIcon name={ic} size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* color picker */}
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold text-white/55">
              اللون
            </span>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setForm({ ...form, color: c.key })}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition",
                    form.color === c.key
                      ? "border-[#DC143C]/60 bg-[#DC143C]/10 text-white"
                      : "border-white/10 bg-white/5 text-white/60"
                  )}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: softColor(c.key).icon }}
                  />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* hasVariants toggle */}
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div>
              <span className="text-sm font-semibold text-white">
                خدمة بأنواع (Variants)
              </span>
              <p className="text-[10px] text-white/45">
                مثال: نانو سيراميك (٣/٥/٨ سنوات)، درع Prestige (Crown/Elite/Luxury)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, hasVariants: !form.hasVariants })}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition",
                form.hasVariants ? "bg-[#DC143C]" : "bg-white/15"
              )}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                style={{
                  insetInlineStart: form.hasVariants
                    ? "calc(100% - 22px)"
                    : "2px",
                }}
              />
            </button>
          </label>

          {form.hasVariants && (
            <Input
              label="ملاحظة السعر (مثال: اختر النوع / اختر المدة)"
              value={form.priceNote}
              onChange={(v) => setForm({ ...form, priceNote: v })}
            />
          )}
          {form.hasVariants && (
            <div className="glass-card-red rounded-xl p-3 text-[11px] text-white/70">
              ملاحظة: بعد إضافة الخدمة، اذهب لتبويب «الأنواع» لإضافة الأنواع والأسعار.
            </div>
          )}
        </div>

        <button
          onClick={submit}
          disabled={saving}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] py-3 text-sm font-bold text-white disabled:opacity-50 transition active:scale-[0.98]"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          إضافة الخدمة
        </button>
      </motion.div>
    </div>
  );
}

/* ============ VARIANTS MANAGER (الأنواع) ============ */
function VariantsManager({ pin }: { pin: string }) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<
    Record<string, { nameAr: string; price: string; duration: string }>
  >({});
  const [saving, setSaving] = useState<string | null>(null);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState({
    name: "",
    nameAr: "",
    price: "",
    duration: "",
  });

  const load = async () => {
    const data = await adminFetchServices(pin);
    // sort so variant services appear first
    data.sort((a, b) => Number(b.hasVariants) - Number(a.hasVariants));
    setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const variantServices = services.filter(
    (s) => s.hasVariants || s.variants.length > 0
  );

  const startEditVariant = (v: ServiceVariant) => {
    setEditing((e) => ({
      ...e,
      [v.id]: {
        nameAr: v.nameAr,
        price: String(v.price),
        duration: v.duration ? String(v.duration) : "",
      },
    }));
  };

  const saveVariant = async (v: ServiceVariant) => {
    const ed = editing[v.id];
    if (!ed) return;
    setSaving(v.id);
    const ok = await adminUpdateVariant(pin, v.id, {
      nameAr: ed.nameAr,
      price: Number(ed.price),
      duration: ed.duration ? Number(ed.duration) : null,
    });
    setSaving(null);
    if (ok) {
      toast.success("تم تحديث النوع");
      setEditing((e) => {
        const n = { ...e };
        delete n[v.id];
        return n;
      });
      load();
    } else toast.error("فشل التحديث");
  };

  const deleteVariant = async (v: ServiceVariant) => {
    if (!confirm(`حذف النوع "${v.nameAr}"؟`)) return;
    const ok = await adminDeleteVariant(pin, v.id);
    if (ok) {
      toast.success("تم الحذف");
      load();
    } else toast.error("فشل الحذف");
  };

  const addVariant = async (serviceId: string) => {
    if (!newVariant.name || !newVariant.price) {
      toast.error("الاسم والسعر مطلوبان");
      return;
    }
    setSaving(`new-${serviceId}`);
    const created = await adminCreateVariant(pin, {
      serviceId,
      name: newVariant.name,
      nameAr: newVariant.nameAr || newVariant.name,
      price: Number(newVariant.price),
      duration: newVariant.duration ? Number(newVariant.duration) : undefined,
    });
    setSaving(null);
    if (created) {
      toast.success("تمت إضافة النوع");
      setNewVariant({ name: "", nameAr: "", price: "", duration: "" });
      setAddingFor(null);
      load();
    } else toast.error("فشل الإضافة");
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#ff4d6d]" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="glass-card-red mb-4 flex items-center gap-2 rounded-2xl p-3">
        <Layers size={14} className="text-[#ff4d6d]" />
        <p className="text-[11px] text-white/70">
          إدارة أنواع الخدمات (الأنواع) والأسعار — كل شيء قابل للتعديل.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Stat label="خدمات بأنواع" value={String(variantServices.length)} />
        <Stat
          label="إجمالي الأنواع"
          value={String(
            variantServices.reduce((n, s) => n + s.variants.length, 0)
          )}
        />
      </div>

      {variantServices.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-white/50">
          لا توجد خدمات بأنواع حالياً. فعّل &quot;hasVariants&quot; عند إضافة خدمة.
        </div>
      )}

      <div className="space-y-3">
        {variantServices.map((s) => {
          const isOpen = expanded === s.id;
          const color = softColor(s.color);
          return (
            <div key={s.id} className="glass-card overflow-hidden rounded-2xl">
              {/* service header (accordion) */}
              <button
                onClick={() => setExpanded(isOpen ? null : s.id)}
                className="flex w-full items-center gap-3 p-3 text-right transition hover:bg-white/[0.03]"
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
                  <p className="text-[10px] text-white/45">
                    {s.variants.length} أنواع
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  className={cn(
                    "text-white/40 transition",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {/* variants list */}
              {isOpen && (
                <div className="border-t border-white/8 p-3 space-y-2">
                  {s.variants.map((v) => {
                    const ed = editing[v.id];
                    const isEditing = !!ed;
                    return (
                      <div
                        key={v.id}
                        className="rounded-xl border border-white/8 bg-white/[0.02] p-2.5"
                      >
                        {isEditing ? (
                          <>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <label className="block">
                                <span className="text-[10px] text-white/45">
                                  الاسم (عربي)
                                </span>
                                <input
                                  value={ed.nameAr}
                                  onChange={(e) =>
                                    setEditing((p) => ({
                                      ...p,
                                      [v.id]: {
                                        ...p[v.id],
                                        nameAr: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
                                />
                              </label>
                              <label className="block">
                                <span className="text-[10px] text-white/45">
                                  السعر (ج.م)
                                </span>
                                <input
                                  type="number"
                                  value={ed.price}
                                  onChange={(e) =>
                                    setEditing((p) => ({
                                      ...p,
                                      [v.id]: {
                                        ...p[v.id],
                                        price: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
                                />
                              </label>
                            </div>
                            <label className="block mb-2">
                              <span className="text-[10px] text-white/45">
                                المدة (دقيقة) — اختياري
                              </span>
                              <input
                                type="number"
                                value={ed.duration}
                                onChange={(e) =>
                                  setEditing((p) => ({
                                    ...p,
                                    [v.id]: {
                                      ...p[v.id],
                                      duration: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="مثال: 180"
                                className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
                              />
                            </label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveVariant(v)}
                                disabled={saving === v.id}
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#DC143C] py-2 text-xs font-bold text-white disabled:opacity-50 transition active:scale-95"
                              >
                                {saving === v.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Save size={13} />
                                )}
                                حفظ
                              </button>
                              <button
                                onClick={() =>
                                  setEditing((e) => {
                                    const n = { ...e };
                                    delete n[v.id];
                                    return n;
                                  })
                                }
                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white transition"
                              >
                                إلغاء
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white">
                                {v.nameAr}
                              </p>
                              <p className="text-[10px] text-white/45">
                                {v.duration
                                  ? `${v.duration} دقيقة`
                                  : "بدون مدة محددة"}
                              </p>
                            </div>
                            <span className="text-sm font-extrabold text-[#ff4d6d]">
                              {v.price.toLocaleString("ar-EG")}
                            </span>
                            <button
                              onClick={() => startEditVariant(v)}
                              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-white/80 hover:bg-white/[0.08] transition"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => deleteVariant(v)}
                              className="grid h-7 w-7 place-items-center rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#f87171] transition active:scale-90"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* add variant */}
                  {addingFor === s.id ? (
                    <div className="rounded-xl border border-dashed border-[#DC143C]/40 bg-[#DC143C]/5 p-2.5">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          value={newVariant.name}
                          onChange={(e) =>
                            setNewVariant({ ...newVariant, name: e.target.value })
                          }
                          placeholder="الاسم (إنجليزي)"
                          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
                        />
                        <input
                          value={newVariant.nameAr}
                          onChange={(e) =>
                            setNewVariant({
                              ...newVariant,
                              nameAr: e.target.value,
                            })
                          }
                          placeholder="الاسم (عربي)"
                          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="number"
                          value={newVariant.price}
                          onChange={(e) =>
                            setNewVariant({
                              ...newVariant,
                              price: e.target.value,
                            })
                          }
                          placeholder="السعر (ج.م)"
                          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
                        />
                        <input
                          type="number"
                          value={newVariant.duration}
                          onChange={(e) =>
                            setNewVariant({
                              ...newVariant,
                              duration: e.target.value,
                            })
                          }
                          placeholder="المدة (دقيقة)"
                          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addVariant(s.id)}
                          disabled={saving === `new-${s.id}`}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#DC143C] py-2 text-xs font-bold text-white disabled:opacity-50 transition active:scale-95"
                        >
                          {saving === `new-${s.id}` ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Plus size={13} />
                          )}
                          إضافة
                        </button>
                        <button
                          onClick={() => {
                            setAddingFor(null);
                            setNewVariant({
                              name: "",
                              nameAr: "",
                              price: "",
                              duration: "",
                            });
                          }}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white transition"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingFor(s.id);
                        setNewVariant({
                          name: "",
                          nameAr: "",
                          price: "",
                          duration: "",
                        });
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-2 text-[11px] font-semibold text-white/60 hover:border-[#DC143C]/40 hover:text-[#ff4d6d] transition"
                    >
                      <Plus size={13} />
                      إضافة نوع جديد
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ BOOKINGS MANAGER (workflow) ============ */
const WORKFLOW_STAGES: {
  key: BookingStatus;
  label: string;
  color: string;
}[] = [
  { key: "pending", label: "قيد الانتظار", color: "#d4af37" },
  { key: "accepted", label: "مقبول", color: "#60a5fa" },
  { key: "in_progress", label: "قيد التنفيذ", color: "#fb923c" },
  { key: "completed", label: "مكتمل", color: "#4ade80" },
];

function statusPillClass(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/35";
    case "accepted":
      return "bg-[#60a5fa]/15 text-[#60a5fa] border border-[#60a5fa]/35";
    case "in_progress":
      return "bg-[#fb923c]/15 text-[#fb923c] border border-[#fb923c]/35";
    case "completed":
      return "bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/35";
    case "cancelled":
      return "bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/35";
    default:
      return "bg-white/10 text-white/60 border border-white/15";
  }
}

function WorkflowProgress({ status }: { status: BookingStatus }) {
  if (status === "cancelled") {
    return (
      <div className="my-2.5 rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-3 py-1.5 text-center">
        <span className="text-[11px] font-bold text-[#f87171]">
          ✗ تم الإلغاء
        </span>
      </div>
    );
  }

  const currentIdx = workflowProgress(status);

  return (
    <div className="my-3">
      <div className="flex items-center gap-1">
        {WORKFLOW_STAGES.map((stage, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;
          const fillColor = isCurrent
            ? stage.color
            : isPast
            ? `${stage.color}80`
            : "rgba(255,255,255,0.06)";
          return (
            <Fragment key={stage.key}>
              <div className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="h-1.5 w-full rounded-full transition-all"
                  style={{
                    background: fillColor,
                    boxShadow: isCurrent
                      ? `0 0 6px ${stage.color}`
                      : "none",
                  }}
                />
                <span
                  className="text-[8.5px] font-bold leading-none transition-colors"
                  style={{
                    color: isCurrent
                      ? stage.color
                      : isFuture
                      ? "rgba(255,255,255,0.3)"
                      : "rgba(255,255,255,0.5)",
                  }}
                >
                  {stage.label}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function BookingsManager({ pin }: { pin: string }) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expiryEditing, setExpiryEditing] = useState<string | null>(null);
  const [expiryValue, setExpiryValue] = useState<string>("");
  const [savingExpiry, setSavingExpiry] = useState<string | null>(null);
  const [noteEditing, setNoteEditing] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState<string>("");
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    const data = (await adminFetchBookings(pin, filter)) as BookingItem[];
    setBookings(data);
    setLoading(false);
  };

  // Initial load + reload whenever the status filter changes.
  useEffect(() => {
    // `load` is async (setState happens after an await, not synchronously),
    // but the lint rule's static analysis can't see through the call.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [filter]);

  // Keep the latest `load` in a ref so the polling interval (set up once) can
  // always invoke the current closure without being re-created on every render.
  // The ref is updated inside an effect (never during render) per React rules.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  // Auto-refresh bookings every 15s + when the tab becomes visible again.
  //
  // This is what makes "the admin sees every booking immediately" true in
  // practice: a customer can submit a booking at any moment, and without
  // polling the admin would only discover it by manually switching filters or
  // reloading the page. With this interval, new bookings surface within 15s
  // with zero admin interaction.
  useEffect(() => {
    const POLL_MS = 15000;
    const interval = setInterval(() => {
      void loadRef.current();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadRef.current();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const setStatus = async (b: BookingItem, status: BookingStatus) => {
    setUpdatingId(b.id);
    const ok = await adminUpdateBookingStatus(pin, b.id, status);
    setUpdatingId(null);
    if (ok) {
      toast.success("تم تحديث الحالة");
      load();
    } else toast.error("فشل التحديث");
  };

  const remove = async (b: BookingItem) => {
    if (!confirm(`حذف الحجز ${b.refCode}؟`)) return;
    const ok = await adminDeleteBooking(pin, b.id);
    if (ok) {
      toast.success("تم الحذف");
      load();
    }
  };

  const openExpiryEditor = (b: BookingItem) => {
    setExpiryEditing(b.id);
    setExpiryValue(b.expiryDate ? b.expiryDate.slice(0, 10) : "");
  };

  const saveExpiry = async (b: BookingItem) => {
    setSavingExpiry(b.id);
    const ok = await adminUpdateBookingExpiry(
      pin,
      b.id,
      expiryValue || null
    );
    setSavingExpiry(null);
    if (ok) {
      toast.success("تم تحديد تاريخ الانتهاء");
      setExpiryEditing(null);
      load();
    } else toast.error("فشل التحديث");
  };

  const openNoteEditor = (b: BookingItem) => {
    setNoteEditing(b.id);
    setNoteValue((b as BookingItem & { adminNote?: string | null }).adminNote || "");
  };

  const saveNote = async (b: BookingItem) => {
    setSavingNote(b.id);
    const ok = await adminUpdateBookingNote(pin, b.id, noteValue || null);
    setSavingNote(null);
    if (ok) {
      toast.success("تم حفظ التنبيه للعميل");
      setNoteEditing(null);
      load();
    } else toast.error("فشل الحفظ");
  };

  const filters = [
    { key: "all", label: "الكل" },
    { key: "pending", label: "قيد الانتظار" },
    { key: "accepted", label: "مقبول" },
    { key: "in_progress", label: "قيد التنفيذ" },
    { key: "completed", label: "مكتمل" },
    { key: "cancelled", label: "ملغي" },
  ];

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = bookings.filter((b) => b.date === today).length;
  const revenue = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="pb-6">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="إجمالي" value={String(bookings.length)} />
        <Stat label="اليوم" value={String(todayCount)} />
        <Stat label="الإيرادات" value={`${revenue.toLocaleString("ar-EG")}`} />
      </div>

      {pendingCount > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#d4af37]/25 bg-[#d4af37]/8 px-3 py-2">
          <Clock size={13} className="text-[#d4af37]" />
          <p className="text-[11px] font-semibold text-[#d4af37]">
            لديك {pendingCount} حجز بانتظار القبول
          </p>
        </div>
      )}

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
              filter === f.key
                ? "bg-[#DC143C] text-white"
                : "border border-white/10 bg-white/[0.03] text-white/60"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 size={22} className="animate-spin text-[#ff4d6d]" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-white/50">
          لا توجد حجوزات
        </div>
      ) : (
        <div className="space-y-2.5">
          {bookings.map((b) => {
            const s = b.service;
            const status = b.status as BookingStatus;
            const isUpdating = updatingId === b.id;
            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden rounded-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/8 px-3.5 py-2">
                  <span
                    className="text-[10px] font-bold text-white/55"
                    dir="ltr"
                  >
                    {b.refCode}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-bold",
                      statusPillClass(status)
                    )}
                  >
                    {STATUS_LABELS[status].ar}
                  </span>
                </div>
                <div className="p-3.5">
                  {s && (
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#DC143C]/10">
                        <ServiceIcon
                          name={s.icon}
                          size={15}
                          className="text-[#ff4d6d]"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {s.nameAr}
                        </p>
                        {b.variantName && (
                          <p className="text-[10px] font-semibold text-[#ff4d6d]">
                            النوع: {b.variantName}
                          </p>
                        )}
                        <p className="text-xs text-[#ff4d6d]">
                          {b.totalPrice.toLocaleString("ar-EG")} ج.م
                        </p>
                      </div>
                    </div>
                  )}

                  {/* workflow progress bar */}
                  <WorkflowProgress status={status} />

                  <div className="space-y-1 text-[11px] text-white/70">
                    <div className="flex justify-between">
                      <span className="text-white/40">الاسم</span>
                      <span>{b.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">الهاتف</span>
                      <span dir="ltr">{b.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">السيارة</span>
                      <span className="text-left">
                        {/* carModel is optional — join only the non-empty parts with " · " */}
                        {[b.carModel, b.carBrand, b.carType, b.carPlate]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                    </div>
                    {/* Notes shown immediately after car info */}
                    {b.notes && (
                      <div className="mt-1 rounded-lg border border-[#fbbf24]/20 bg-[#fbbf24]/5 px-2.5 py-1.5">
                        <div className="flex items-start gap-1.5">
                          <MessageSquare size={10} className="mt-0.5 shrink-0 text-[#fbbf24]" />
                          <span className="text-[10.5px] text-[#fbbf24]/90 leading-relaxed">{b.notes}</span>
                        </div>
                      </div>
                    )}
                    {b.branch && (
                      <div className="flex justify-between">
                        <span className="text-white/40">الفرع</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={10} className="text-[#ff4d6d]" />
                          {b.branch.nameAr || b.branch.name}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/40">الموعد</span>
                      <span dir="ltr">
                        {b.date} · {b.time}
                      </span>
                    </div>
                    {b.acceptedAt && (
                      <div className="flex justify-between">
                        <span className="text-white/40">القبول</span>
                        <span dir="ltr" className="text-[10px]">
                          {new Date(b.acceptedAt).toLocaleString("ar-EG")}
                        </span>
                      </div>
                    )}
                    {b.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-white/40">الإكمال</span>
                        <span dir="ltr" className="text-[10px]">
                          {new Date(b.completedAt).toLocaleString("ar-EG")}
                        </span>
                      </div>
                    )}
                    {b.expiryDate && expiryEditing !== b.id && (
                      <div className="flex justify-between">
                        <span className="text-white/40">ينتهي في</span>
                        <span dir="ltr" className="text-[10px] text-[#4ade80]">
                          {b.expiryDate.slice(0, 10)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* expiry date editor (for completed bookings) */}
                  {status === "completed" && expiryEditing === b.id && (
                    <div className="mt-3 rounded-xl border border-[#DC143C]/30 bg-[#DC143C]/5 p-3">
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-white/55">
                          تاريخ الانتهاء
                        </span>
                        <input
                          type="date"
                          value={expiryValue}
                          onChange={(e) => setExpiryValue(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
                        />
                      </label>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => saveExpiry(b)}
                          disabled={savingExpiry === b.id}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#DC143C] py-2 text-[11px] font-bold text-white disabled:opacity-50 transition active:scale-95"
                        >
                          {savingExpiry === b.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Save size={12} />
                          )}
                          حفظ التاريخ
                        </button>
                        <button
                          onClick={() => setExpiryEditing(null)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/60 hover:text-white transition"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  {/* admin note editor — message shown to customer in their profile */}
                  {noteEditing === b.id && (
                    <div className="mt-3 rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/5 p-3">
                      <label className="block">
                        <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-[#fbbf24]">
                          <Bell size={10} />
                          رسالة تنبيه للعميل (تظهر في ملف حجزه)
                        </span>
                        <textarea
                          value={noteValue}
                          onChange={(e) => setNoteValue(e.target.value)}
                          placeholder="مثال: البروتيكشن وشك على الانتهاء، ننصح بتجديده قبل ٣٠ يوم"
                          rows={3}
                          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white placeholder:text-white/30 focus:border-[#fbbf24]/50 focus:outline-none"
                        />
                      </label>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => saveNote(b)}
                          disabled={savingNote === b.id}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#fbbf24] py-2 text-[11px] font-bold text-black disabled:opacity-50 transition active:scale-95"
                        >
                          {savingNote === b.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Save size={12} />
                          )}
                          حفظ التنبيه
                        </button>
                        <button
                          onClick={() => setNoteEditing(null)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/60 hover:text-white transition"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  {/* show existing adminNote preview */}
                  {(b as BookingItem & { adminNote?: string | null }).adminNote && noteEditing !== b.id && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#fbbf24]/20 bg-[#fbbf24]/5 px-2.5 py-2">
                      <Bell size={11} className="mt-0.5 shrink-0 text-[#fbbf24]" />
                      <p className="flex-1 text-[10px] text-[#fbbf24]/90 leading-relaxed">
                        {(b as BookingItem & { adminNote?: string | null }).adminNote}
                      </p>
                    </div>
                  )}

                  {/* status actions */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {isUpdating && (
                      <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] text-white/60">
                        <Loader2 size={11} className="animate-spin" />
                        جارٍ التحديث...
                      </div>
                    )}

                    {!isUpdating && status === "pending" && (
                      <>
                        <button
                          onClick={() => setStatus(b, "accepted")}
                          className="flex items-center gap-1 rounded-lg bg-[#60a5fa]/12 border border-[#60a5fa]/30 px-2.5 py-1.5 text-[10px] font-bold text-[#60a5fa] transition active:scale-95"
                        >
                          <CheckCircle2 size={12} /> قبول
                        </button>
                        <button
                          onClick={() => setStatus(b, "cancelled")}
                          className="flex items-center gap-1 rounded-lg bg-[#ef4444]/12 border border-[#ef4444]/30 px-2.5 py-1.5 text-[10px] font-bold text-[#f87171] transition active:scale-95"
                        >
                          <XCircle size={12} /> رفض
                        </button>
                      </>
                    )}

                    {!isUpdating && status === "accepted" && (
                      <button
                        onClick={() => setStatus(b, "in_progress")}
                        className="flex items-center gap-1 rounded-lg bg-[#fb923c]/12 border border-[#fb923c]/30 px-2.5 py-1.5 text-[10px] font-bold text-[#fb923c] transition active:scale-95"
                      >
                        <Play size={12} /> بدء التنفيذ
                      </button>
                    )}

                    {!isUpdating && status === "in_progress" && (
                      <button
                        onClick={() => setStatus(b, "completed")}
                        className="flex items-center gap-1 rounded-lg bg-[#4ade80]/12 border border-[#4ade80]/30 px-2.5 py-1.5 text-[10px] font-bold text-[#4ade80] transition active:scale-95"
                      >
                        <CheckCircle2 size={12} /> إكمال
                      </button>
                    )}

                    {!isUpdating && status === "completed" && (
                      <span className="flex items-center gap-1 rounded-lg bg-[#4ade80]/12 border border-[#4ade80]/30 px-2.5 py-1.5 text-[10px] font-bold text-[#4ade80]">
                        <CheckCircle2 size={12} /> ✓ مكتمل
                      </span>
                    )}

                    {!isUpdating && status === "cancelled" && (
                      <span className="flex items-center gap-1 rounded-lg bg-[#f87171]/12 border border-[#f87171]/30 px-2.5 py-1.5 text-[10px] font-bold text-[#f87171]">
                        <XCircle size={12} /> ملغي
                      </span>
                    )}

                    {!isUpdating &&
                      status === "completed" &&
                      expiryEditing !== b.id && (
                        <button
                          onClick={() => openExpiryEditor(b)}
                          className="flex items-center gap-1 rounded-lg bg-[#DC143C]/12 border border-[#DC143C]/30 px-2.5 py-1.5 text-[10px] font-bold text-[#ff4d6d] transition active:scale-95"
                        >
                          <CalendarClock size={12} /> تحديد تاريخ الانتهاء
                        </button>
                      )}

                    {/* Admin note button — available on any completed booking */}
                    {!isUpdating && status === "completed" && noteEditing !== b.id && (
                      <button
                        onClick={() => openNoteEditor(b)}
                        className="flex items-center gap-1 rounded-lg bg-[#fbbf24]/12 border border-[#fbbf24]/30 px-2.5 py-1.5 text-[10px] font-bold text-[#fbbf24] transition active:scale-95"
                      >
                        <Bell size={12} />
                        {(b as BookingItem & { adminNote?: string | null }).adminNote
                          ? "تعديل التنبيه"
                          : "إضافة تنبيه للعميل"}
                      </button>
                    )}

                    <a
                      href={waLink(b.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-[#25D366]/12 border border-[#25D366]/30 px-2.5 py-1.5 text-[10px] font-bold text-[#25D366] transition active:scale-95 mr-auto"
                    >
                      <ArrowRight size={12} className="rotate-180" /> واتساب
                    </a>
                    <button
                      onClick={() => remove(b)}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-[#f87171] transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ CUSTOMERS MANAGER (العملاء) ============ */
interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  carModel: string | null;
  carPlate: string | null;
  bookingsCount: number;
  lastVisit: string | null;
  createdAt: string;
  _count?: { bookings: number };
}
function CustomersManager({ pin }: { pin: string }) {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    const data = (await adminFetchCustomers(
      pin,
      query || undefined
    )) as CustomerRow[];
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const remove = async (c: CustomerRow) => {
    if (!confirm(`حذف العميل "${c.name}"؟`)) return;
    const ok = await adminDeleteCustomer(pin, c.id);
    if (ok) {
      toast.success("تم حذف العميل");
      load();
    } else toast.error("فشل الحذف");
  };

  return (
    <div className="pb-6">
      <div className="glass-card-red mb-4 flex items-center gap-2 rounded-2xl p-3">
        <Users size={14} className="text-[#ff4d6d]" />
        <p className="text-[11px] text-white/70">
          قاعدة بيانات العملاء — يُسحب الاسم والهاتف ونوع السيارة ورقمها تلقائياً عند الحجز.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Stat label="إجمالي العملاء" value={String(customers.length)} />
        <Stat
          label="عملاء عائدون"
          value={String(customers.filter((c) => c.bookingsCount > 1).length)}
        />
      </div>

      {/* search */}
      <div className="glass-card mb-4 flex items-center gap-2 rounded-2xl px-3.5 py-2.5">
        <Search size={16} className="text-white/40" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLoading(true);
          }}
          placeholder="بحث بالاسم أو الهاتف أو السيارة..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 size={22} className="animate-spin text-[#ff4d6d]" />
        </div>
      ) : customers.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-white/50">
          لا يوجد عملاء بعد
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto prestige-scroll pr-1">
          {customers.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card overflow-hidden rounded-2xl"
            >
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#DC143C] to-[#a00f2c] text-sm font-extrabold text-white">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {c.name}
                      </p>
                      <p
                        className="flex items-center gap-1 text-[11px] text-white/55"
                        dir="ltr"
                      >
                        <Phone size={10} className="text-[#ff4d6d]" />
                        {c.phone}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#DC143C]/12 border border-[#DC143C]/25 px-2 py-0.5 text-[10px] font-bold text-[#ff4d6d]">
                    {c.bookingsCount || c._count?.bookings || 0} حجز
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {c.carModel && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                      <Car size={12} className="text-white/40" />
                      <span className="truncate text-[11px] text-white/70">
                        {c.carModel}
                      </span>
                    </div>
                  )}
                  {c.carPlate && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                      <span className="text-[10px] text-white/40">رقم:</span>
                      <span
                        className="text-[11px] font-semibold text-white"
                        dir="ltr"
                      >
                        {c.carPlate}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-white/40">
                    {c.lastVisit
                      ? `آخر زيارة: ${c.lastVisit}`
                      : "عميل جديد"}
                  </span>
                  <div className="flex gap-1.5">
                    <a
                      href={waLink(c.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-2.5 py-1 text-[10px] font-bold text-[#25D366] transition active:scale-95"
                    >
                      واتساب
                    </a>
                    <a
                      href={telLink(c.phone)}
                      className="rounded-lg border border-[#DC143C]/30 bg-[#DC143C]/10 px-2.5 py-1 text-[10px] font-bold text-[#ff4d6d] transition active:scale-95"
                    >
                      اتصال
                    </a>
                    <button
                      onClick={() => remove(c)}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#f87171] transition active:scale-90"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ BRANCH MEDIA HELPERS ============ */
// Use the shared helpers from @/lib/branch-media so the admin and customer
// views always agree on how mapUrl is parsed.
import {
  parseBranchMedia,
  packBranchMedia,
  type BranchMedia,
} from "@/lib/branch-media";

/* ============ BRANCHES MANAGER ============ */
function BranchesManager({ pin }: { pin: string }) {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, {
    name: string;
    nameAr: string;
    address: string;
    addressAr: string;
    phone: string;
    mapUrl: string;
    imageUrl: string;
    videoUrl: string;
    isActive: boolean;
  }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const data = await adminFetchBranches(pin);
    setBranches(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const startEdit = (b: BranchItem) => {
    const media = parseBranchMedia(b.mapUrl);
    setEditing((e) => ({
      ...e,
      [b.id]: {
        name: b.name,
        nameAr: b.nameAr,
        address: b.address || "",
        addressAr: b.addressAr || "",
        phone: b.phone || "",
        mapUrl: media.map,
        imageUrl: media.image,
        videoUrl: media.video,
        isActive: b.isActive,
      },
    }));
  };

  const save = async (b: BranchItem) => {
    const ed = editing[b.id];
    if (!ed) return;
    if (!ed.name && !ed.nameAr) {
      toast.error("اسم الفرع مطلوب");
      return;
    }
    setSaving(b.id);
    const packedMapUrl = packBranchMedia(ed.mapUrl, ed.imageUrl, ed.videoUrl);
    const ok = await adminUpdateBranch(pin, b.id, {
      name: ed.name,
      nameAr: ed.nameAr || ed.name,
      address: ed.address || null,
      addressAr: ed.addressAr || null,
      phone: ed.phone || null,
      mapUrl: packedMapUrl,
      isActive: ed.isActive,
    });
    setSaving(null);
    if (ok) {
      toast.success("تم تحديث الفرع");
      setEditing((e) => {
        const n = { ...e };
        delete n[b.id];
        return n;
      });
      load();
    } else toast.error("فشل التحديث");
  };

  const remove = async (b: BranchItem) => {
    if (!confirm(`حذف فرع "${b.nameAr || b.name}"؟`)) return;
    const ok = await adminDeleteBranch(pin, b.id);
    if (ok) {
      toast.success("تم حذف الفرع");
      load();
    } else toast.error("فشل الحذف");
  };

  const toggleActive = async (b: BranchItem) => {
    const ok = await adminUpdateBranch(pin, b.id, { isActive: !b.isActive });
    if (ok) {
      toast.success(b.isActive ? "تم الإخفاء" : "تم التفعيل");
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#ff4d6d]" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="glass-card-red mb-4 flex items-center gap-2 rounded-2xl p-3">
        <Building size={14} className="text-[#ff4d6d]" />
        <p className="text-[11px] text-white/70">
          إدارة فروع بريستيج جاراج — أضف وعدّل الفروع وعناوينها وروابط الخرائط.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Stat label="إجمالي الفروع" value={String(branches.length)} />
        <Stat
          label="فروع مفعّلة"
          value={String(branches.filter((b) => b.isActive).length)}
        />
      </div>

      <button
        onClick={() => setAdding(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#DC143C]/40 bg-[#DC143C]/5 py-3 text-xs font-bold text-[#ff4d6d] hover:bg-[#DC143C]/10 transition"
      >
        <Plus size={16} />
        إضافة فرع جديد
      </button>

      {branches.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-white/50">
          لا توجد فروع بعد. اضغط «إضافة فرع جديد» للبدء.
        </div>
      )}

      <div className="space-y-3">
        {branches.map((b) => {
          const ed = editing[b.id];
          const isEditing = !!ed;
          return (
            <motion.div
              key={b.id}
              layout
              className={cn(
                "glass-card overflow-hidden rounded-2xl border transition",
                b.isActive ? "border-white/8" : "border-white/5 opacity-60"
              )}
            >
              <div className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#DC143C]/10">
                    <MapPin size={16} className="text-[#ff4d6d]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={ed.nameAr}
                          onChange={(e) =>
                            setEditing((p) => ({
                              ...p,
                              [b.id]: { ...p[b.id], nameAr: e.target.value },
                            }))
                          }
                          placeholder="الاسم (عربي)"
                          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm font-bold text-white focus:border-[#DC143C]/50 focus:outline-none"
                        />
                        <input
                          value={ed.name}
                          onChange={(e) =>
                            setEditing((p) => ({
                              ...p,
                              [b.id]: { ...p[b.id], name: e.target.value },
                            }))
                          }
                          placeholder="الاسم (إنجليزي)"
                          dir="ltr"
                          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="truncate text-sm font-bold text-white">
                          {b.nameAr || b.name}
                        </p>
                        {b.name && b.nameAr && b.name !== b.nameAr && (
                          <p
                            className="truncate text-[10px] text-white/45"
                            dir="ltr"
                          >
                            {b.name}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold",
                        b.isActive
                          ? "bg-[#4ade80]/12 text-[#4ade80] border border-[#4ade80]/30"
                          : "bg-white/8 text-white/50 border border-white/15"
                      )}
                    >
                      {b.isActive ? "مفعّل" : "مخفي"}
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <input
                      value={ed.addressAr}
                      onChange={(e) =>
                        setEditing((p) => ({
                          ...p,
                          [b.id]: { ...p[b.id], addressAr: e.target.value },
                        }))
                      }
                      placeholder="العنوان (عربي)"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                    />
                    <input
                      value={ed.address}
                      onChange={(e) =>
                        setEditing((p) => ({
                          ...p,
                          [b.id]: { ...p[b.id], address: e.target.value },
                        }))
                      }
                      placeholder="العنوان (إنجليزي)"
                      dir="ltr"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                    />
                    <input
                      value={ed.phone}
                      onChange={(e) =>
                        setEditing((p) => ({
                          ...p,
                          [b.id]: { ...p[b.id], phone: e.target.value },
                        }))
                      }
                      placeholder="رقم الهاتف"
                      dir="ltr"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                    />
                    <input
                      value={ed.mapUrl}
                      onChange={(e) =>
                        setEditing((p) => ({
                          ...p,
                          [b.id]: { ...p[b.id], mapUrl: e.target.value },
                        }))
                      }
                      placeholder="رابط الخريطة (Google Maps)"
                      dir="ltr"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                    />
                    <div className="rounded-md border border-white/8 bg-white/[0.02] p-2 space-y-2">
                      <p className="text-[10px] font-bold text-white/55 flex items-center gap-1">
                        <ImageIcon size={11} className="text-[#ff4d6d]" />
                        ميديا الفرع (اختياري)
                      </p>
                      <p className="text-[9px] leading-relaxed text-white/40">
                        تظهر الميديا للعميل في صفحة «تواصل معنا» ضمن قائمة الفروع —
                        أيقونة الفرع تفتح الميديا بملء الشاشة، وزر الموقع يفتح الخريطة.
                        للفيديو استخدم رابط Google Drive أو YouTube (للتجنب مشاكل حجم الرفع).
                      </p>
                      <MediaInputField
                        label="صورة الفرع"
                        value={ed.imageUrl}
                        onChange={(v) => setEditing((p) => ({ ...p, [b.id]: { ...p[b.id], imageUrl: v } }))}
                        mediaType="image"
                      pin={pin}
                      
                      />
                      <MediaInputField
                        label="فيديو الفرع"
                        value={ed.videoUrl}
                        onChange={(v) => setEditing((p) => ({ ...p, [b.id]: { ...p[b.id], videoUrl: v } }))}
                        mediaType="video"
                      pin={pin}
                      
                      />
                    </div>

                    <label className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                      <span className="text-[11px] font-semibold text-white/70">
                        تفعيل الفرع
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditing((p) => ({
                            ...p,
                            [b.id]: { ...p[b.id], isActive: !p[b.id].isActive },
                          }))
                        }
                        className={cn(
                          "relative h-5 w-10 shrink-0 rounded-full transition",
                          ed.isActive ? "bg-[#DC143C]" : "bg-white/15"
                        )}
                      >
                        <span
                          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                          style={{
                            insetInlineStart: ed.isActive
                              ? "calc(100% - 18px)"
                              : "2px",
                          }}
                        />
                      </button>
                    </label>

                    <div className="flex gap-2">
                      <button
                        onClick={() => save(b)}
                        disabled={saving === b.id}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#DC143C] py-2 text-xs font-bold text-white disabled:opacity-50 transition active:scale-95"
                      >
                        {saving === b.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Save size={13} />
                        )}
                        حفظ
                      </button>
                      <button
                        onClick={() =>
                          setEditing((e) => {
                            const n = { ...e };
                            delete n[b.id];
                            return n;
                          })
                        }
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white transition"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const media = parseBranchMedia(b.mapUrl);
                      return (media.image || media.video) ? (
                        <div className="mt-2 overflow-hidden rounded-lg border border-white/8">
                          {media.image ? (
                            <img
                              src={media.image}
                              alt={b.nameAr || b.name}
                              className="h-24 w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-16 items-center justify-center gap-2 bg-white/[0.03] text-[11px] text-white/55">
                              <Video size={14} className="text-[#ff4d6d]" />
                              فيديو مرفق
                            </div>
                          )}
                          {media.video && (
                            <a
                              href={media.video}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1 bg-[#DC143C]/8 py-1.5 text-[10px] font-bold text-[#ff4d6d] hover:bg-[#DC143C]/15 transition"
                              dir="ltr"
                            >
                              <Video size={11} /> تشغيل الفيديو
                            </a>
                          )}
                        </div>
                      ) : null;
                    })()}
                    {(b.addressAr || b.address) && (
                      <p className="mt-2 text-[11px] text-white/65 leading-relaxed">
                        {b.addressAr || b.address}
                      </p>
                    )}
                    {b.phone && (
                      <p
                        className="mt-1 flex items-center gap-1 text-[11px] text-white/55"
                        dir="ltr"
                      >
                        <Phone size={10} className="text-[#ff4d6d]" />
                        {b.phone}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => startEdit(b)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white/80 hover:bg-white/[0.08] transition"
                      >
                        <Pencil size={12} /> تعديل
                      </button>
                      <button
                        onClick={() => toggleActive(b)}
                        title={b.isActive ? "إخفاء" : "تفعيل"}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg border transition",
                          b.isActive
                            ? "border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366]"
                            : "border-white/10 bg-white/5 text-white/40"
                        )}
                      >
                        <Power size={14} />
                      </button>
                      {parseBranchMedia(b.mapUrl).map && (
                        <a
                          href={parseBranchMedia(b.mapUrl).map}
                          target="_blank"
                          rel="noreferrer"
                          title="فتح الخريطة"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-[#60a5fa]/30 bg-[#60a5fa]/10 text-[#60a5fa] transition"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => remove(b)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#f87171] transition active:scale-90"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {adding && (
        <AddBranchModal
          pin={pin}
          onClose={() => setAdding(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}

function AddBranchModal({
  pin,
  onClose,
  onCreated,
}: {
  pin: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    address: "",
    addressAr: "",
    phone: "",
    mapUrl: "",
    imageUrl: "",
    videoUrl: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name && !form.nameAr) {
      toast.error("اسم الفرع مطلوب");
      return;
    }
    setSaving(true);
    const packedMapUrl = packBranchMedia(form.mapUrl, form.imageUrl, form.videoUrl);
    const ok = await adminCreateBranch(pin, {
      name: form.name || form.nameAr,
      nameAr: form.nameAr || form.name,
      address: form.address || null,
      addressAr: form.addressAr || null,
      phone: form.phone || null,
      mapUrl: packedMapUrl,
      isActive: true,
    });
    setSaving(false);
    if (ok) {
      toast.success("تمت إضافة الفرع");
      onCreated();
      onClose();
    } else toast.error("فشل الإضافة");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto prestige-scroll rounded-t-3xl border border-white/10 bg-background p-5 pb-safe"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <MapPin size={16} className="text-[#ff4d6d]" /> إضافة فرع جديد
          </h3>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white"
          >
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <Input
            label="اسم الفرع (عربي)"
            value={form.nameAr}
            onChange={(v) => setForm({ ...form, nameAr: v })}
          />
          <Input
            label="اسم الفرع (إنجليزي)"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />
          <Input
            label="العنوان (عربي)"
            value={form.addressAr}
            onChange={(v) => setForm({ ...form, addressAr: v })}
            textarea
          />
          <Input
            label="العنوان (إنجليزي)"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            textarea
          />
          <Input
            label="رقم الهاتف"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          <Input
            label="رابط الخريطة (Google Maps)"
            value={form.mapUrl}
            onChange={(v) => setForm({ ...form, mapUrl: v })}
          />
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 space-y-2">
            <p className="text-[11px] font-bold text-white/55 flex items-center gap-1">
              <ImageIcon size={12} className="text-[#ff4d6d]" />
              ميديا الفرع (اختياري)
            </p>
            <p className="text-[9px] leading-relaxed text-white/40">
              تظهر الميديا للعميل في صفحة «تواصل معنا» ضمن قائمة الفروع —
              أيقونة الفرع تفتح الميديا بملء الشاشة، وزر الموقع يفتح الخريطة.
              للفيديو استخدم رابط Google Drive أو YouTube (للتجنب مشاكل حجم الرفع).
            </p>
            <MediaInputField
              label="صورة الفرع"
              value={form.imageUrl}
              onChange={(v) => setForm({ ...form, imageUrl: v })}
              mediaType="image"
                      pin={pin}
            
                      />
            <MediaInputField
              label="فيديو الفرع (MP4، Drive، رابط)"
              value={form.videoUrl}
              onChange={(v) => setForm({ ...form, videoUrl: v })}
              mediaType="video"
                      pin={pin}
            
                      />
          </div>
        </div>

        <button
          onClick={submit}
          disabled={saving}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] py-3 text-sm font-bold text-white disabled:opacity-50 transition active:scale-[0.98]"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          إضافة الفرع
        </button>
      </motion.div>
    </div>
  );
}

/* ============ OFFERS MANAGER ============ */
type OfferItem = {
  id: string;
  title: string;
  titleAr: string;
  description: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  discountPct: number | null;
  oldPrice: number | null;
  newPrice: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
};

function OffersManager({ pin }: { pin: string }) {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const data = (await adminFetchOffers(pin)) as OfferItem[];
    setOffers(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const toggleActive = async (o: OfferItem) => {
    const ok = await adminUpdateOffer(pin, o.id, { isActive: !o.isActive });
    if (ok) {
      toast.success(o.isActive ? "تم إخفاء العرض" : "تم تفعيل العرض");
      load();
    } else toast.error("فشل التحديث");
  };

  const remove = async (o: OfferItem) => {
    if (!confirm(`حذف عرض "${o.titleAr || o.title}"؟`)) return;
    const ok = await adminDeleteOffer(pin, o.id);
    if (ok) {
      toast.success("تم حذف العرض");
      load();
    } else toast.error("فشل الحذف");
  };

  const startEdit = (o: OfferItem) => {
    setEditingId(o.id);
    setEditForm({
      title: o.title,
      titleAr: o.titleAr,
      description: o.description || "",
      descriptionAr: o.descriptionAr || "",
      imageUrl: o.imageUrl || "",
      videoUrl: (o as { videoUrl?: string | null }).videoUrl || "",
      discountPct: o.discountPct != null ? String(o.discountPct) : "",
      oldPrice: o.oldPrice != null ? String(o.oldPrice) : "",
      newPrice: o.newPrice != null ? String(o.newPrice) : "",
      startDate: o.startDate,
      endDate: o.endDate,
      sortOrder: String(o.sortOrder || 0),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (o: OfferItem) => {
    if (!editForm.title && !editForm.titleAr) {
      toast.error("عنوان العرض مطلوب");
      return;
    }
    if (!editForm.startDate || !editForm.endDate) {
      toast.error("تاريخا البداية والنهاية مطلوبان");
      return;
    }
    setSavingId(o.id);
    const ok = await adminUpdateOffer(pin, o.id, {
      title: editForm.title,
      titleAr: editForm.titleAr || editForm.title,
      description: editForm.description || null,
      descriptionAr: editForm.descriptionAr || null,
      imageUrl: editForm.imageUrl || null,
      videoUrl: editForm.videoUrl || null,
      discountPct: editForm.discountPct ? Number(editForm.discountPct) : null,
      oldPrice: editForm.oldPrice ? Number(editForm.oldPrice) : null,
      newPrice: editForm.newPrice ? Number(editForm.newPrice) : null,
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      sortOrder: Number(editForm.sortOrder) || 0,
    });
    setSavingId(null);
    if (ok) {
      toast.success("تم تحديث العرض");
      cancelEdit();
      load();
    } else toast.error("فشل التحديث");
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#ff4d6d]" />
      </div>
    );
  }

  const activeCount = offers.filter((o) => o.isActive).length;

  return (
    <div className="pb-6">
      <div className="glass-card-red mb-4 flex items-center gap-2 rounded-2xl p-3">
        <Percent size={14} className="text-[#ff4d6d]" />
        <p className="text-[11px] text-white/70">
          إدارة العروض الخاصة — أضف وعدّل عروض الخصم وأوقاتها وحالتها.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Stat label="إجمالي العروض" value={String(offers.length)} />
        <Stat label="عروض مفعّلة" value={String(activeCount)} />
      </div>

      <button
        onClick={() => setAdding(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#DC143C]/40 bg-[#DC143C]/5 py-3 text-xs font-bold text-[#ff4d6d] hover:bg-[#DC143C]/10 transition"
      >
        <Plus size={16} />
        إضافة عرض جديد
      </button>

      {offers.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-white/50">
          لا توجد عروض بعد. اضغط «إضافة عرض جديد» للبدء.
        </div>
      )}

      <div className="space-y-3">
        {offers.map((o) => {
          const isEditing = editingId === o.id;
          const now = new Date().toISOString().slice(0, 10);
          const isExpired = o.endDate < now;
          const isUpcoming = o.startDate > now;
          return (
            <motion.div
              key={o.id}
              layout
              className={cn(
                "glass-card overflow-hidden rounded-2xl border transition",
                o.isActive ? "border-white/8" : "border-white/5 opacity-60"
              )}
            >
              <div className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#DC143C]/10">
                    <Tag size={16} className="text-[#ff4d6d]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={editForm.titleAr ?? ""}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, titleAr: e.target.value }))
                          }
                          placeholder="العنوان (عربي)"
                          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm font-bold text-white focus:border-[#DC143C]/50 focus:outline-none"
                        />
                        <input
                          value={editForm.title ?? ""}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, title: e.target.value }))
                          }
                          placeholder="العنوان (إنجليزي)"
                          dir="ltr"
                          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="truncate text-sm font-bold text-white">
                          {o.titleAr || o.title}
                        </p>
                        {o.title && o.titleAr && o.title !== o.titleAr && (
                          <p className="truncate text-[10px] text-white/45" dir="ltr">
                            {o.title}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-bold",
                          o.isActive
                            ? "bg-[#4ade80]/12 text-[#4ade80] border border-[#4ade80]/30"
                            : "bg-white/8 text-white/50 border border-white/15"
                        )}
                      >
                        {o.isActive ? "مفعّل" : "مخفي"}
                      </span>
                      {isExpired && (
                        <span className="rounded-full bg-[#f87171]/12 px-2 py-0.5 text-[8px] font-bold text-[#f87171] border border-[#f87171]/30">
                          منتهي
                        </span>
                      )}
                      {isUpcoming && !isExpired && (
                        <span className="rounded-full bg-[#fbbf24]/12 px-2 py-0.5 text-[8px] font-bold text-[#fbbf24] border border-[#fbbf24]/30">
                          قادم
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={editForm.descriptionAr ?? ""}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, descriptionAr: e.target.value }))
                      }
                      placeholder="الوصف (عربي)"
                      rows={2}
                      className="w-full resize-none rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                    />
                    <textarea
                      value={editForm.description ?? ""}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, description: e.target.value }))
                      }
                      placeholder="الوصف (إنجليزي)"
                      rows={2}
                      dir="ltr"
                      className="w-full resize-none rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                    />
                    <MediaInputField
                      label="صورة العرض"
                      value={editForm.imageUrl ?? ""}
                      onChange={(v) => setEditForm((p) => ({ ...p, imageUrl: v }))}
                      mediaType="image"
                      pin={pin}
                    
                      />
                    <MediaInputField
                      label="فيديو إعلاني (اختياري)"
                      value={editForm.videoUrl ?? ""}
                      onChange={(v) => setEditForm((p) => ({ ...p, videoUrl: v }))}
                      mediaType="video"
                      pin={pin}
                    
                      />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={editForm.discountPct ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, discountPct: e.target.value }))
                        }
                        type="number"
                        min="0"
                        max="100"
                        placeholder="خصم %"
                        className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                      />
                      <input
                        value={editForm.oldPrice ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, oldPrice: e.target.value }))
                        }
                        type="number"
                        min="0"
                        placeholder="سعر قديم"
                        className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                      />
                      <input
                        value={editForm.newPrice ?? ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, newPrice: e.target.value }))
                        }
                        type="number"
                        min="0"
                        placeholder="سعر جديد"
                        className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-white/55">
                          تاريخ البداية
                        </span>
                        <input
                          value={editForm.startDate ?? ""}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, startDate: e.target.value }))
                          }
                          type="date"
                          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-white/55">
                          تاريخ النهاية
                        </span>
                        <input
                          value={editForm.endDate ?? ""}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, endDate: e.target.value }))
                          }
                          type="date"
                          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
                        />
                      </label>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => saveEdit(o)}
                        disabled={savingId === o.id}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#DC143C] py-2 text-xs font-bold text-white disabled:opacity-50 transition active:scale-95"
                      >
                        {savingId === o.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Save size={13} />
                        )}
                        حفظ
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white transition"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {o.descriptionAr && (
                      <p className="mt-2 text-[11px] text-white/65 leading-relaxed line-clamp-2">
                        {o.descriptionAr}
                      </p>
                    )}
                    {o.imageUrl && (
                      <div className="mt-2 overflow-hidden rounded-lg border border-white/8">
                        <img
                          src={o.imageUrl}
                          alt={o.titleAr || o.title}
                          className="h-28 w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {o.discountPct != null && (
                        <span className="rounded-full bg-[#DC143C]/15 px-2 py-0.5 text-[10px] font-bold text-[#ff4d6d] border border-[#DC143C]/30">
                          خصم {o.discountPct}%
                        </span>
                      )}
                      {o.oldPrice != null && o.newPrice != null && (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/70 border border-white/10">
                          <span className="line-through text-white/40">
                            {o.oldPrice}
                          </span>{" "}
                          → <span className="text-[#4ade80]">{o.newPrice}</span>
                        </span>
                      )}
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/55 border border-white/10">
                        {o.startDate} ← {o.endDate}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => startEdit(o)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white/80 hover:bg-white/[0.08] transition"
                      >
                        <Pencil size={12} /> تعديل
                      </button>
                      <button
                        onClick={() => toggleActive(o)}
                        title={o.isActive ? "إخفاء" : "تفعيل"}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg border transition",
                          o.isActive
                            ? "border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366]"
                            : "border-white/10 bg-white/5 text-white/40"
                        )}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => remove(o)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#f87171] transition active:scale-90"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {adding && (
        <AddOfferModal
          pin={pin}
          onClose={() => setAdding(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}

function AddOfferModal({
  pin,
  onClose,
  onCreated,
}: {
  pin: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const inMonth = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  const [form, setForm] = useState({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    imageUrl: "",
    videoUrl: "",
    discountPct: "",
    oldPrice: "",
    newPrice: "",
    startDate: today,
    endDate: inMonth,
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.title && !form.titleAr) {
      toast.error("عنوان العرض مطلوب");
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error("تاريخا البداية والنهاية مطلوبان");
      return;
    }
    setSaving(true);
    const ok = await adminCreateOffer(pin, {
      title: form.title || form.titleAr,
      titleAr: form.titleAr || form.title,
      description: form.description || null,
      descriptionAr: form.descriptionAr || null,
      imageUrl: form.imageUrl || null,
      videoUrl: form.videoUrl || null,
      discountPct: form.discountPct ? Number(form.discountPct) : null,
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      newPrice: form.newPrice ? Number(form.newPrice) : null,
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: true,
    });
    setSaving(false);
    if (ok) {
      toast.success("تمت إضافة العرض");
      onCreated();
      onClose();
    } else toast.error("فشل الإضافة");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[88vh] overflow-y-auto prestige-scroll rounded-t-3xl border border-white/10 bg-background p-5 pb-safe"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <Percent size={16} className="text-[#ff4d6d]" /> إضافة عرض جديد
          </h3>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white"
          >
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <Input
            label="عنوان العرض (عربي)"
            value={form.titleAr}
            onChange={(v) => setForm({ ...form, titleAr: v })}
          />
          <Input
            label="عنوان العرض (إنجليزي)"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
          />
          <Input
            label="الوصف (عربي)"
            value={form.descriptionAr}
            onChange={(v) => setForm({ ...form, descriptionAr: v })}
            textarea
          />
          <Input
            label="الوصف (إنجليزي)"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            textarea
          />
          <MediaInputField
            label="صورة العرض"
            value={form.imageUrl}
            onChange={(v) => setForm({ ...form, imageUrl: v })}
            mediaType="image"
                      pin={pin}
          
                      />
          <MediaInputField
            label="فيديو إعلاني (اختياري — يعمل بدون صوت، يشغّل بالضغط)"
            value={form.videoUrl}
            onChange={(v) => setForm({ ...form, videoUrl: v })}
            mediaType="video"
                      pin={pin}
          
                      />
          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-white/55">
                خصم %
              </span>
              <input
                type="number"
                min="0"
                max="100"
                value={form.discountPct}
                onChange={(e) =>
                  setForm({ ...form, discountPct: e.target.value })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-white/55">
                سعر قديم
              </span>
              <input
                type="number"
                min="0"
                value={form.oldPrice}
                onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-white/55">
                سعر جديد
              </span>
              <input
                type="number"
                min="0"
                value={form.newPrice}
                onChange={(e) => setForm({ ...form, newPrice: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-white/55">
                تاريخ البداية
              </span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-white/55">
                تاريخ النهاية
              </span>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
              />
            </label>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={saving}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] py-3 text-sm font-bold text-white disabled:opacity-50 transition active:scale-[0.98]"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          إضافة العرض
        </button>
      </motion.div>
    </div>
  );
}

/* ============ REPORTS MANAGER ============ */
type ReportBooking = {
  id: string;
  refCode: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  status: string;
  totalPrice: number;
  service?: { name: string; nameAr: string; category: string } | null;
  variantName?: string | null;
};

type ReportSummary = {
  totalBookings: number;
  totalRevenue: number;
  completedCount: number;
  pendingCount: number;
  inProgressCount: number;
};

type ReportData = {
  type: string;
  bookings: ReportBooking[];
  summary: ReportSummary;
  byService: { name: string; nameAr: string; count: number; revenue: number }[];
  byCategory: { category: string; count: number; revenue: number }[];
  byDate: { date: string; count: number; revenue: number }[];
};

function ReportsManager({ pin }: { pin: string }) {
  const [mode, setMode] = useState<"daily" | "monthly" | "financial">("daily");
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    const params =
      mode === "daily" ? { date } : { month };
    const res = (await adminFetchReport(pin, mode, params)) as ReportData | null;
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchReport();
  }, [mode, date, month]);

  const fmtMoney = (n: number) => {
    const v = Math.round(n);
    return v.toLocaleString("en-US");
  };

  const modes: { key: typeof mode; label: string; icon: typeof BarChart }[] = [
    { key: "daily", label: "يومي", icon: CalendarDays },
    { key: "monthly", label: "شهري", icon: CalendarRange },
    { key: "financial", label: "مالي", icon: Wallet },
  ];

  const summary = data?.summary;
  const bookings = data?.bookings ?? [];
  const byDate = data?.byDate ?? [];
  const byService = data?.byService ?? [];
  const byCategory = data?.byCategory ?? [];

  return (
    <div className="pb-6">
      <div className="glass-card-red mb-4 flex items-center gap-2 rounded-2xl p-3">
        <BarChart size={14} className="text-[#ff4d6d]" />
        <p className="text-[11px] text-white/70">
          تقارير الحجوزات والإيرادات — يومي وشهرري ومالي.
        </p>
      </div>

      {/* mode toggle */}
      <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.02] p-1">
        {modes.map((m) => {
          const Icon = m.icon;
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold transition",
                active
                  ? "bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] text-white shadow-[0_4px_12px_rgba(220,20,60,0.25)]"
                  : "text-white/55 hover:text-white"
              )}
            >
              <Icon size={13} />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* picker */}
      <div className="mb-3">
        {mode === "daily" ? (
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-white/55">
              اختر التاريخ
            </span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
            />
          </label>
        ) : (
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-white/55">
              اختر الشهر
            </span>
            <input
              type="month"
              value={month}
              max={currentMonth}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
            />
          </label>
        )}
      </div>

      {loading && (
        <div className="flex h-32 items-center justify-center">
          <Loader2 size={22} className="animate-spin text-[#ff4d6d]" />
        </div>
      )}

      {!loading && data && summary && (
        <>
          {/* summary cards */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="glass-card rounded-xl p-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-[#ff4d6d]" />
                <p className="text-[9px] text-white/45">إجمالي الحجوزات</p>
              </div>
              <p className="mt-1 text-lg font-extrabold text-white">
                {summary.totalBookings}
              </p>
            </div>
            <div className="glass-card rounded-xl p-3 ring-1 ring-[#DC143C]/25">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-[#4ade80]" />
                <p className="text-[9px] text-white/45">إجمالي الإيرادات</p>
              </div>
              <p className="mt-1 text-lg font-extrabold text-[#4ade80]">
                {fmtMoney(summary.totalRevenue)}
                <span className="ms-1 text-[10px] text-white/45">ج.م</span>
              </p>
            </div>
            <div className="glass-card rounded-xl p-2.5 text-center">
              <p className="text-sm font-extrabold text-[#4ade80]">
                {summary.completedCount}
              </p>
              <p className="text-[9px] text-white/45">مكتملة</p>
            </div>
            <div className="glass-card rounded-xl p-2.5 text-center">
              <p className="text-sm font-extrabold text-[#fbbf24]">
                {summary.pendingCount}
              </p>
              <p className="text-[9px] text-white/45">قيد الانتظار</p>
            </div>
          </div>

          {/* ===== DAILY ===== */}
          {mode === "daily" && (
            <div className="glass-card overflow-hidden rounded-2xl">
              <div className="px-3 py-2 border-b border-white/8 bg-white/[0.03]">
                <p className="text-[11px] font-bold text-white/70">
                  حجوزات يوم {date} ({bookings.length})
                </p>
              </div>
              {bookings.length === 0 ? (
                <p className="p-6 text-center text-xs text-white/40">
                  لا توجد حجوزات في هذا اليوم.
                </p>
              ) : (
                <div className="overflow-x-auto prestige-scroll">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>المرجع</th>
                        <th>العميل</th>
                        <th>الخدمة</th>
                        <th>السعر</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id}>
                          <td className="font-mono text-[10px] text-white/60">
                            {b.refCode}
                          </td>
                          <td className="font-semibold">
                            {b.customerName}
                            <span className="block text-[9px] text-white/40" dir="ltr">
                              {b.time}
                            </span>
                          </td>
                          <td>
                            {b.service?.nameAr || b.service?.name || "—"}
                            {b.variantName && (
                              <span className="block text-[9px] text-[#ff4d6d]">
                                {b.variantName}
                              </span>
                            )}
                          </td>
                          <td className="font-bold text-[#4ade80]">
                            {fmtMoney(b.totalPrice)}
                          </td>
                          <td>
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                                b.status === "completed" &&
                                  "bg-[#4ade80]/12 text-[#4ade80]",
                                b.status === "pending" &&
                                  "bg-[#fbbf24]/12 text-[#fbbf24]",
                                b.status === "accepted" &&
                                  "bg-[#60a5fa]/12 text-[#60a5fa]",
                                b.status === "in_progress" &&
                                  "bg-[#fb923c]/12 text-[#fb923c]",
                                b.status === "cancelled" &&
                                  "bg-[#f87171]/12 text-[#f87171]"
                              )}
                            >
                              {b.status === "completed"
                                ? "مكتمل"
                                : b.status === "pending"
                                ? "معلّق"
                                : b.status === "accepted"
                                ? "مقبول"
                                : b.status === "in_progress"
                                ? "جارٍ"
                                : "ملغي"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== MONTHLY ===== */}
          {mode === "monthly" && (
            <div className="space-y-3">
              <div className="glass-card overflow-hidden rounded-2xl">
                <div className="px-3 py-2 border-b border-white/8 bg-white/[0.03]">
                  <p className="text-[11px] font-bold text-white/70">
                    توزيع حسب اليوم ({byDate.length} يوم)
                  </p>
                </div>
                {byDate.length === 0 ? (
                  <p className="p-6 text-center text-xs text-white/40">
                    لا توجد حجوزات في هذا الشهر.
                  </p>
                ) : (
                  <div className="overflow-x-auto prestige-scroll">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>التاريخ</th>
                          <th className="text-center">عدد الحجوزات</th>
                          <th>الإيراد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byDate.map((d) => (
                          <tr key={d.date}>
                            <td className="font-mono text-[11px]">{d.date}</td>
                            <td className="text-center font-bold">{d.count}</td>
                            <td className="font-bold text-[#4ade80]">
                              {fmtMoney(d.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="glass-card overflow-hidden rounded-2xl">
                <div className="px-3 py-2 border-b border-white/8 bg-white/[0.03]">
                  <p className="text-[11px] font-bold text-white/70">
                    توزيع حسب الخدمة
                  </p>
                </div>
                {byService.length === 0 ? (
                  <p className="p-6 text-center text-xs text-white/40">
                    لا توجد بيانات.
                  </p>
                ) : (
                  <div className="overflow-x-auto prestige-scroll">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>الخدمة</th>
                          <th className="text-center">العدد</th>
                          <th>الإيراد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byService.map((s, i) => (
                          <tr key={i}>
                            <td className="font-semibold">
                              {s.nameAr || s.name}
                            </td>
                            <td className="text-center font-bold">{s.count}</td>
                            <td className="font-bold text-[#4ade80]">
                              {fmtMoney(s.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== FINANCIAL ===== */}
          {mode === "financial" && (
            <div className="space-y-3">
              <div className="glass-card overflow-hidden rounded-2xl">
                <div className="px-3 py-2 border-b border-white/8 bg-white/[0.03]">
                  <p className="text-[11px] font-bold text-white/70">
                    الإيراد حسب القسم — {month}
                  </p>
                </div>
                {byCategory.length === 0 ? (
                  <p className="p-6 text-center text-xs text-white/40">
                    لا توجد حجوزات مكتملة في هذا الشهر.
                  </p>
                ) : (
                  <div className="overflow-x-auto prestige-scroll">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>القسم</th>
                          <th className="text-center">العدد</th>
                          <th>الإيراد</th>
                          <th>المتوسط</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byCategory.map((c) => {
                          const cat = c.category as ServiceCategory;
                          const label =
                            CATEGORY_LABELS[cat]?.ar || c.category;
                          const avg = c.count > 0 ? c.revenue / c.count : 0;
                          return (
                            <tr key={c.category}>
                              <td className="font-semibold">{label}</td>
                              <td className="text-center font-bold">
                                {c.count}
                              </td>
                              <td className="font-bold text-[#4ade80]">
                                {fmtMoney(c.revenue)}
                              </td>
                              <td className="text-white/60">
                                {fmtMoney(avg)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="glass-card overflow-hidden rounded-2xl">
                <div className="px-3 py-2 border-b border-white/8 bg-white/[0.03]">
                  <p className="text-[11px] font-bold text-white/70">
                    تفاصيل الحجوزات المكتملة ({bookings.length})
                  </p>
                </div>
                {bookings.length === 0 ? (
                  <p className="p-6 text-center text-xs text-white/40">
                    لا توجد حجوزات مكتملة.
                  </p>
                ) : (
                  <div className="max-h-96 overflow-y-auto prestige-scroll">
                    <table className="report-table">
                      <thead className="sticky top-0 bg-background">
                        <tr>
                          <th>المرجع</th>
                          <th>العميل</th>
                          <th>الخدمة</th>
                          <th>التاريخ</th>
                          <th>الإيراد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b) => (
                          <tr key={b.id}>
                            <td className="font-mono text-[10px] text-white/60">
                              {b.refCode}
                            </td>
                            <td className="font-semibold">
                              {b.customerName}
                            </td>
                            <td>
                              {b.service?.nameAr || b.service?.name || "—"}
                            </td>
                            <td className="font-mono text-[10px]">
                              {b.date}
                            </td>
                            <td className="font-bold text-[#4ade80]">
                              {fmtMoney(b.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-white/10">
                          <td colSpan={4} className="font-extrabold text-white">
                            الإجمالي
                          </td>
                          <td className="font-extrabold text-[#4ade80]">
                            {fmtMoney(summary.totalRevenue)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !data && (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-white/50">
          تعذّر تحميل التقرير. حاول مرة أخرى.
        </div>
      )}
    </div>
  );
}

/* ============ SETTINGS MANAGER ============ */
function SettingsManager({ pin }: { pin: string }) {
  const settings = useSettings();
  const [form, setForm] = useState<Partial<SiteSettings>>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const save = async () => {
    setSaving(true);
    const ok = await adminUpdateSettings(pin, form);
    setSaving(false);
    if (ok) toast.success("تم حفظ الإعدادات");
    else toast.error("فشل الحفظ");
  };

  const fields: { key: keyof SiteSettings; label: string; type?: string }[] = [
    { key: "brandName", label: "اسم البراند (إنجليزي)" },
    { key: "brandNameAr", label: "اسم البراند (عربي)" },
    { key: "tagline", label: "الشعار (إنجليزي)" },
    { key: "taglineAr", label: "الشعار (عربي)" },
    { key: "bornLine", label: "سطر الميلاد" },
    { key: "poweredBy", label: "مدعوم بواسطة" },
    { key: "phone", label: "رقم الهاتف" },
    { key: "whatsapp", label: "واتساب" },
    { key: "addressAr", label: "العنوان (عربي)" },
    { key: "workingHoursAr", label: "مواعيد العمل (عربي)" },
    { key: "instagram", label: "إنستجرام" },
    { key: "facebook", label: "فيسبوك" },
    { key: "tiktok", label: "تيك توك" },
    { key: "currencyAr", label: "العملة (عربي)" },
    { key: "adminPin", label: "رمز الأدمن (٤ أرقام)" },
  ];

  // hour options
  const openHours = [8, 9, 10, 11, 12];
  const closeHours = [18, 19, 20, 21, 22, 23, 24];

  return (
    <div className="pb-6 space-y-3">
      <div className="glass-card-red rounded-2xl p-3 flex items-center gap-2">
        <Clock size={14} className="text-[#ff4d6d]" />
        <p className="text-[11px] text-white/70">
          جميع الإعدادات قابلة للتغيير وتظهر فوراً للعملاء.
        </p>
      </div>

      {/* ===== Working Hours Control ===== */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/8">
          <CalendarClock size={14} className="text-[#ff4d6d]" />
          <h4 className="text-sm font-bold text-white">مواعيد العمل</h4>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-white/55">
              وقت الفتح
            </span>
            <select
              value={form.openHour ?? "10"}
              onChange={(e) =>
                setForm({
                  ...form,
                  openHour: e.target.value,
                  openTime: `${e.target.value.padStart(2, "0")}:00`,
                })
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
            >
              {openHours.map((h) => (
                <option key={h} value={String(h)} className="bg-background">
                  {h}:00 {h < 12 ? "ص" : "م"}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-white/55">
              وقت الإغلاق
            </span>
            <select
              value={form.closeHour ?? "22"}
              onChange={(e) =>
                setForm({
                  ...form,
                  closeHour: e.target.value,
                  closeTime: `${e.target.value.padStart(2, "0")}:00`,
                })
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
            >
              {closeHours.map((h) => (
                <option key={h} value={String(h)} className="bg-background">
                  {h === 24 ? "12:00 ص (منتصف الليل)" : `${h}:00 م`}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Input
          label="أيام العمل (عربي)"
          value={form.workingDaysAr ?? ""}
          onChange={(v) => setForm({ ...form, workingDaysAr: v })}
        />
        <Input
          label="أيام العمل (إنجليزي)"
          value={form.workingDays ?? ""}
          onChange={(v) => setForm({ ...form, workingDays: v })}
        />

        <p className="text-[10px] text-white/40 leading-relaxed">
          حدّد ساعات وأيام العمل الافتراضية. تُستخدم هذه القيم في عرض المواعيد
          المتاحة للعملاء.
        </p>
      </div>

      {/* ===== Slot Capacity Control ===== */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/8">
          <SettingsIcon size={14} className="text-[#ff4d6d]" />
          <h4 className="text-sm font-bold text-white">تحكم المواعيد والسعة</h4>
        </div>

        {/* enable/disable toggle */}
        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div>
            <span className="text-sm font-semibold text-white">
              تفعيل التحكم بالسعة
            </span>
            <p className="text-[10px] text-white/45">
              عند الإيقاف: مواعيد مفتوحة بلا حدود
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                slotControlEnabled:
                  form.slotControlEnabled === "false" ? "true" : "false",
              })
            }
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition",
              form.slotControlEnabled !== "false"
                ? "bg-[#DC143C]"
                : "bg-white/15"
            )}
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
              style={{
                insetInlineStart:
                  form.slotControlEnabled !== "false"
                    ? "calc(100% - 22px)"
                    : "2px",
              }}
            />
          </button>
        </label>

        {form.slotControlEnabled !== "false" && (
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-white/55">
                سعة الغسيل (سيارات/موعد)
              </span>
              <input
                type="number"
                min="1"
                value={form.washSlotCapacity ?? "2"}
                onChange={(e) =>
                  setForm({ ...form, washSlotCapacity: e.target.value })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-white/55">
                سعة باقي الخدمات
              </span>
              <input
                type="number"
                min="1"
                value={form.slotCapacity ?? "1"}
                onChange={(e) =>
                  setForm({ ...form, slotCapacity: e.target.value })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
              />
            </label>
          </div>
        )}
        <p className="text-[10px] text-white/40 leading-relaxed">
          الغسيل يقبل عدداً من السيارات في نفس الموعد، بينما باقي الخدمات تحجز فرادى. الأوقات الماضية تُخفى تلقائياً.
        </p>
      </div>

      {/* ===== Branch Selection Toggle ===== */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/8">
          <MapPin size={14} className="text-[#ff4d6d]" />
          <h4 className="text-sm font-bold text-white">اختيار الفرع</h4>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div>
            <span className="text-sm font-semibold text-white">
              تفعيل اختيار الفرع
            </span>
            <p className="text-[10px] text-white/45">
              عند التفعيل: يمكن للعميل اختيار الفرع أثناء الحجز
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                branchSelectionEnabled:
                  form.branchSelectionEnabled === "false" ? "true" : "false",
              })
            }
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition",
              form.branchSelectionEnabled !== "false"
                ? "bg-[#DC143C]"
                : "bg-white/15"
            )}
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
              style={{
                insetInlineStart:
                  form.branchSelectionEnabled !== "false"
                    ? "calc(100% - 22px)"
                    : "2px",
              }}
            />
          </button>
        </label>
        <p className="text-[10px] text-white/40 leading-relaxed">
          عند الإيقاف: يُخفى خيار اختيار الفرع من شاشة الحجز ويُرسل الحجز بدون فرع محدد.
        </p>
      </div>

      <div className="gold-divider my-1" />

      <h4 className="text-xs font-bold text-white/60 px-1">إعدادات عامة</h4>

      {fields.map((f) => (
        <Input
          key={f.key}
          label={f.label}
          type={f.type}
          value={form[f.key] ?? ""}
          onChange={(v) => setForm({ ...form, [f.key]: v })}
        />
      ))}

      <button
        onClick={save}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] py-3.5 text-sm font-bold text-white disabled:opacity-50 transition active:scale-[0.98]"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        حفظ الإعدادات
      </button>
    </div>
  );
}

/* ============ shared bits ============ */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-2.5 text-center">
      <p className="text-base font-extrabold text-white">{value}</p>
      <p className="text-[9px] text-white/45">{label}</p>
    </div>
  );
}

/* ============ MEDIA INPUT — Upload/Drive/URL tabs ============ */
type MediaType = "image" | "video";

function MediaInputField({
  label,
  value,
  onChange,
  mediaType = "image",
  acceptBoth = false,
  pin,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mediaType?: MediaType;
  acceptBoth?: boolean;
  pin?: string;
}) {
  const [tab, setTab] = useState<"url" | "drive" | "upload">("url");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const accept = acceptBoth
    ? "image/*,video/*"
    : mediaType === "video"
    ? "video/*"
    : "image/*";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ⚠️ SIZE LIMITS — 10MB for videos, 2MB for images
    const MAX_IMG_BYTES = 2 * 1024 * 1024;
    const MAX_VIDEO_BYTES = 10 * 1024 * 1024; // 10MB as requested
    const isVideoFile = file.type.startsWith("video/");
    const limit = isVideoFile ? MAX_VIDEO_BYTES : MAX_IMG_BYTES;

    if (file.size > limit) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      const limMb = (limit / (1024 * 1024)).toFixed(0);
      toast.error(
        isVideoFile
          ? `الملف ${mb} ميجا — يتجاوز الحد الأقصى ${limMb} ميجا. للفيديوهات الأكبر استخدم رابط YouTube أو Google Drive`
          : `الصورة ${mb} ميجا — كبيرة جداً. صغّر الصورة إلى أقل من ${limMb} ميجا.`,
      );
      e.target.value = "";
      return;
    }

    // If no pin (e.g. branch media), fall back to base64 for small images only
    if (!pin) {
      if (isVideoFile) {
        toast.error("رفع الفيديوهات يتطلب صلاحيات الأدمن. استخدم رابط URL.");
        e.target.value = "";
        return;
      }
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        onChange(ev.target?.result as string);
        setUploading(false);
      };
      reader.onerror = () => {
        setUploading(false);
        toast.error("فشل قراءة الملف.");
      };
      reader.readAsDataURL(file);
      return;
    }

    // ⚡ Upload via /api/admin/upload — multipart, saves to /public/uploads
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-pin": pin },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      onChange(data.url);
      toast.success(`تم رفع الملف (${(file.size / 1024 / 1024).toFixed(1)} ميجا)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "فشل الرفع";
      toast.error(`فشل رفع الملف: ${msg}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // convert Google Drive share URL to direct embed URL
  const normalizeDriveUrl = (url: string): string => {
    // Handle: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    const match = url.match(/\/file\/d\/([\w-]+)/);
    if (match) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  };

  const handleDriveChange = (v: string) => {
    onChange(normalizeDriveUrl(v));
  };

  const isVideo = value && (
    value.startsWith("data:video") ||
    /\.(mp4|webm|ogg|mov)(\?|$)/i.test(value)
  );
  const isImage = value && !isVideo;

  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-white/55">{label}</span>
      <div className="media-upload-box">
        {/* Tabs */}
        <div className="media-upload-tabs mb-2">
          {(["url", "drive", "upload"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`media-upload-tab${tab === t ? " active" : ""}`}
            >
              {t === "url" ? "رابط URL" : t === "drive" ? "Google Drive" : "رفع ملف"}
            </button>
          ))}
        </div>

        {tab === "url" && (
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            dir="ltr"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
          />
        )}

        {tab === "drive" && (
          <div>
            <input
              type="url"
              value={value}
              onChange={(e) => handleDriveChange(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              dir="ltr"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white focus:border-[#DC143C]/50 focus:outline-none"
            />
            <p className="mt-1 text-[9px] text-white/35">
              ألصق رابط المشاركة من Google Drive — سيتم تحويله تلقائياً
            </p>
          </div>
        )}

        {tab === "upload" && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/[0.02] py-3 text-[11px] font-semibold text-white/60 hover:border-[#DC143C]/40 hover:text-[#ff4d6d] transition disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ImageIcon size={14} />
              )}
              {uploading ? "جارٍ الرفع..." : acceptBoth ? "اختر صورة أو فيديو" : mediaType === "video" ? "اختر فيديو" : "اختر صورة"}
            </button>
            <p className="mt-1 text-[9px] text-white/35">
              {acceptBoth ? "صور: JPG/PNG/WEBP • فيديو: MP4/WEBM" : mediaType === "video" ? "MP4, WEBM, MOV" : "JPG, PNG, WEBP, GIF"}
            </p>
          </div>
        )}

        {/* Preview */}
        {value && isImage && (
          <img src={value} alt="preview" className="media-preview-thumb" loading="lazy" />
        )}
        {value && isVideo && (
          <video src={value} className="media-preview-video" muted playsInline controls />
        )}
      </div>
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-white/55">
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={
            type === "number" ||
            /phone|whatsapp|instagram|facebook|tiktok|mapUrl|map/i.test(label)
              ? "ltr"
              : undefined
          }
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#DC143C]/50 focus:outline-none"
        />
      )}
    </label>
  );
}
