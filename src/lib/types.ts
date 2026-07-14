// Shared types for Prestige Garage app

export type ServiceCategory =
  | "protection"
  | "thermal"
  | "detailing"
  | "polish"
  | "wash"
  | "extra";

export type DetailingSub =
  | "interior"
  | "roof"
  | "wheels"
  | "motor"
  | "full";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ServiceVariant {
  id: string;
  serviceId: string;
  name: string;
  nameAr: string;
  price: number;
  duration: number | null;
  lifespanDays: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  nameAr: string;
  category: ServiceCategory;
  subCategory: string | null;
  description: string | null;
  descriptionAr: string | null;
  price: number;
  duration: number;
  icon: string | null;
  color: string | null;
  hasVariants: boolean;
  priceNote: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  variants: ServiceVariant[];
}

export interface BookingItem {
  id: string;
  refCode: string;
  customerName: string;
  phone: string;
  carType: string | null;
  carBrand: string | null;
  carModel: string;
  carPlate: string | null;
  branchId: string | null;
  branch?: BranchItem | null;
  customerId: string | null;
  serviceId: string;
  service?: ServiceItem;
  variantId: string | null;
  variantName: string | null;
  date: string;
  time: string;
  status: BookingStatus;
  notes: string | null;
  address: string | null;
  totalPrice: number;
  acceptedAt: string | null;
  inProgressAt: string | null;
  completedAt: string | null;
  expiryDate: string | null;
  adminNote: string | null;   // Admin-to-customer message shown in booking profile
  createdAt: string;
}

export interface BranchItem {
  id: string;
  name: string;
  nameAr: string;
  address: string | null;
  addressAr: string | null;
  phone: string | null;
  mapUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface OfferItem {
  id: string;
  title: string;
  titleAr: string;
  description: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  videoUrl: string | null;  // muted autoplay video ad
  discountPct: number | null;
  oldPrice: number | null;
  newPrice: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  carType: string | null;
  carBrand: string | null;
  carModel: string | null;
  carPlate: string | null;
  bookingsCount: number;
  lastVisit: string | null;
  createdAt: string;
  _count?: { bookings: number };
}

export interface SiteSettings {
  brandName: string;
  brandNameAr: string;
  tagline: string;
  taglineAr: string;
  bornLine: string;
  poweredBy: string;
  phone: string;
  whatsapp: string;
  address: string;
  addressAr: string;
  workingHours: string;
  workingHoursAr: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  adminPin: string;
  currency: string;
  currencyAr: string;
  leadTimeHours: string;
  slotDurationMin: string;
  [key: string]: string;
}

export const CATEGORY_LABELS: Record<ServiceCategory, { en: string; ar: string }> = {
  protection: { en: "Protection", ar: "حماية" },
  thermal: { en: "Thermal Insulation", ar: "عزل حراري" },
  detailing: { en: "Detailing", ar: "ديتيلنج" },
  polish: { en: "Polish", ar: "تلميع" },
  wash: { en: "Wash", ar: "غسيل" },
  extra: { en: "Extras", ar: "إضافات" },
};

// Categories that are "wash" type for capacity logic (2 cars per slot)
export const WASH_CATEGORIES: ServiceCategory[] = ["wash"];

// Emoji per category (shown on home + services cards)
export const CATEGORY_EMOJI: Record<ServiceCategory, string> = {
  protection: "🛡️",
  thermal: "🌡️",
  detailing: "✨",
  polish: "💎",
  wash: "🚿",
  extra: "⚙️",
};

// Emoji per service icon name
export const ICON_EMOJI: Record<string, string> = {
  Shield: "🛡️",
  ShieldCheck: "🛡️",
  Gem: "💎",
  Crown: "👑",
  Wind: "🌡️",
  Sparkles: "✨",
  Droplets: "🚿",
  Car: "🚗",
  Armchair: "🪑",
  Brush: "🧽",
  CircleDot: "⭕",
  Lightbulb: "💡",
  Sofa: "🛋️",
  Triangle: "🔺",
  Cog: "⚙️",
};

export const DETAILING_SUBS: Record<
  DetailingSub,
  { en: string; ar: string; icon: string; desc: string }
> = {
  interior: { en: "Interior", ar: "مقصورة", icon: "Sofa", desc: "تنظيف وتلميع المقصورة بالكامل" },
  roof: { en: "Roof", ar: "سقف", icon: "Triangle", desc: "تجديد وتنظيف سقف السيارة" },
  wheels: { en: "Wheels", ar: "جنوط", icon: "CircleDot", desc: "تجديد الجنوط والإطارات" },
  motor: { en: "Motor", ar: "موتور", icon: "Cog", desc: "تنظيف وتلميع حيز الموتور" },
  full: { en: "Full", ar: "كامل", icon: "Crown", desc: "الباقة الشاملة الفاخرة" },
};

export const STATUS_LABELS: Record<BookingStatus, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "قيد الانتظار" },
  accepted: { en: "Accepted", ar: "مقبول" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
  completed: { en: "Completed", ar: "مكتمل" },
  cancelled: { en: "Cancelled", ar: "ملغي" },
};

// Workflow order for progress bar
export const WORKFLOW_STEPS: BookingStatus[] = [
  "pending",
  "accepted",
  "in_progress",
  "completed",
];

export function workflowProgress(status: BookingStatus): number {
  const idx = WORKFLOW_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

// Soft accent colors per service category (matches reference HTML)
export const SOFT_COLORS: Record<string, { bg: string; icon: string; ring: string }> = {
  blue: { bg: "rgba(59,130,246,0.10)", icon: "#60a5fa", ring: "rgba(59,130,246,0.35)" },
  yellow: { bg: "rgba(245,158,11,0.10)", icon: "#fbbf24", ring: "rgba(245,158,11,0.35)" },
  green: { bg: "rgba(34,197,94,0.10)", icon: "#4ade80", ring: "rgba(34,197,94,0.35)" },
  purple: { bg: "rgba(168,85,247,0.10)", icon: "#c084fc", ring: "rgba(168,85,247,0.35)" },
  orange: { bg: "rgba(255,107,53,0.12)", icon: "#fb923c", ring: "rgba(255,107,53,0.35)" },
  gray: { bg: "rgba(107,114,128,0.10)", icon: "#9ca3af", ring: "rgba(107,114,128,0.35)" },
};

export function softColor(key: string | null) {
  return SOFT_COLORS[key || ""] || SOFT_COLORS.gray;
}
