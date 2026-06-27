"use client";

// Prestige Garage i18n dictionary (Arabic + English)
export type Lang = "ar" | "en";

export const translations = {
  // Navigation / common
  home: { ar: "الرئيسية", en: "Home" },
  services: { ar: "خدماتنا", en: "Services" },
  booking: { ar: "حجز موعد", en: "Book" },
  bookings: { ar: "سجل الحجوزات", en: "Bookings" },
  contact: { ar: "تواصل معنا", en: "Contact" },
  about: { ar: "من نحن", en: "About" },
  trackOrder: { ar: "تتبع الطلب", en: "Track Order" },
  profile: { ar: "ملفي والتذكيرات", en: "Profile" },
  shareApp: { ar: "مشاركة التطبيق", en: "Share App" },
  adminPanel: { ar: "لوحة الأدمن", en: "Admin Panel" },
  signOut: { ar: "تسجيل خروج", en: "Sign Out" },

  // Home
  bookNow: { ar: "احجز موعدك الآن", en: "Book Now" },
  browseServices: { ar: "تصفح خدماتنا", en: "Browse Services" },
  detailingSection: { ar: "قسم الديتيلنج", en: "Detailing Section" },
  serviceCategories: { ar: "أقسام الخدمات", en: "Service Categories" },
  premiumCarCare: { ar: "العناية الفاخرة بالسيارات", en: "Premium Car Care" },
  bornLine: { ar: "صنع في ألمانيا. أتقن في مصر.", en: "Born in Germany. Mastered in Egypt." },
  servicesAvail: { ar: "خدمة متاحة", en: "services" },

  // Services
  ourServices: { ar: "خدماتنا", en: "Our Services" },
  servicesSub: { ar: "اكتشف خدماتنا المتكاملة", en: "Discover our integrated services" },
  chooseType: { ar: "اختر النوع", en: "Choose Type" },
  tapForPrices: { ar: "اضغط للأسعار", en: "Tap for prices" },
  chooseTypeFirst: { ar: "اختر النوع أولاً", en: "Choose a type first" },
  bookThisService: { ar: "احجز هذه الخدمة", en: "Book this service" },
  options: { ar: "خيارات", en: "options" },
  noServices: { ar: "لا توجد خدمات في هذا القسم حالياً", en: "No services in this section" },

  // Booking flow
  bookAppointment: { ar: "احجز موعدك", en: "Book Appointment" },
  stepsSimple: { ar: "خطوات بسيطة", en: "simple steps" },
  stepService: { ar: "الخدمة", en: "Service" },
  stepType: { ar: "النوع", en: "Type" },
  stepDate: { ar: "الموعد", en: "Date" },
  stepDetails: { ar: "البيانات", en: "Details" },
  stepConfirm: { ar: "التأكيد", en: "Confirm" },
  chooseDay: { ar: "اختر اليوم", en: "Choose Day" },
  chooseTime: { ar: "اختر الوقت", en: "Choose Time" },
  today: { ar: "اليوم", en: "Today" },
  tomorrow: { ar: "غداً", en: "Tomorrow" },
  name: { ar: "الاسم", en: "Name" },
  phone: { ar: "رقم الهاتف", en: "Phone" },
  carModel: { ar: "موديل السيارة", en: "Car Model" },
  carPlate: { ar: "رقم السيارة (اختياري)", en: "Car Plate (optional)" },
  notes: { ar: "ملاحظات (اختياري)", en: "Notes (optional)" },
  next: { ar: "التالي", en: "Next" },
  prev: { ar: "السابق", en: "Back" },
  confirmBooking: { ar: "تأكيد الحجز", en: "Confirm Booking" },
  bookingConfirmed: { ar: "تم تأكيد حجزك! 🎉", en: "Booking Confirmed! 🎉" },
  refCode: { ar: "رمز الحجز", en: "Booking Ref" },
  summary: { ar: "ملخص الحجز", en: "Booking Summary" },
  total: { ar: "الإجمالي", en: "Total" },
  duration: { ar: "المدة", en: "Duration" },
  whatsappContact: { ar: "تواصل واتساب", en: "WhatsApp" },
  myBookings: { ar: "حجوزاتي", en: "My Bookings" },
  change: { ar: "تغيير", en: "Change" },

  // My bookings
  trackBookings: { ar: "تابع حالة حجوزاتك برقم هاتفك", en: "Track your bookings by phone" },
  noBookings: { ar: "لا توجد حجوزات لهذا الرقم", en: "No bookings for this number" },
  slotsFull: { ar: "محجوز", en: "Full" },
  slotsLeft: { ar: "متبقي", en: "left" },
  noSlotsAvailable: { ar: "لا توجد مواعيد متاحة في هذا اليوم", en: "No slots available this day" },

  // Car selection
  carType: { ar: "نوع السيارة", en: "Car Type" },
  carBrand: { ar: "ماركة السيارة", en: "Car Brand" },
  selectBrand: { ar: "اختر الماركة...", en: "Select brand..." },
  sedan: { ar: "سيدان", en: "Sedan" },
  suv: { ar: "SUV", en: "SUV" },
  largeSuv: { ar: "SUV كبيرة", en: "Large SUV" },

  // Booking tracking
  bookingTracker: { ar: "تتبع حالة الحجز", en: "Booking Tracker" },
  stepPending: { ar: "قيد الانتظار", en: "Pending" },
  stepAccepted: { ar: "تم القبول", en: "Accepted" },
  stepInProgress: { ar: "قيد التنفيذ", en: "In Progress" },
  stepCompleted: { ar: "مكتمل", en: "Completed" },

  // Smart reminders
  smartReminders: { ar: "تنبيهات ذكية", en: "Smart Reminders" },
  serviceExpiry: { ar: "انتهاء الخدمة", en: "Service Expiry" },
  expired: { ar: "منتهي", en: "Expired" },
  expiresSoon: { ar: "ينتهي قريباً", en: "Expires Soon" },
  daysLeft: { ar: "يوم متبقي", en: "days left" },
  overdue: { ar: "متأخر!", en: "Overdue!" },
  bookNowReminder: { ar: "احجز الآن لتجنب الضرر", en: "Book now to avoid damage" },
  noReminders: { ar: "لا توجد تنبيهات حالياً", en: "No reminders at this time" },

  // Branches
  ourBranches: { ar: "فروعنا", en: "Our Branches" },
  branchAddress: { ar: "العنوان", en: "Address" },
  branchPhone: { ar: "الهاتف", en: "Phone" },
  visitBranch: { ar: "زر الفرع", en: "Visit Branch" },

  // Admin workflow
  accept: { ar: "قبول", en: "Accept" },
  startWork: { ar: "بدء التنفيذ", en: "Start" },
  markComplete: { ar: "إكمال", en: "Complete" },
  reject: { ar: "رفض", en: "Reject" },
  setExpiry: { ar: "تحديد تاريخ الانتهاء", en: "Set Expiry Date" },
  expiryDate: { ar: "تاريخ الانتهاء", en: "Expiry Date" },

  // Admin branches
  branchesTab: { ar: "الفروع", en: "Branches" },
  addBranch: { ar: "إضافة فرع", en: "Add Branch" },
  branchName: { ar: "اسم الفرع", en: "Branch Name" },

  // Admin services table
  servicesTable: { ar: "جدول الخدمات", en: "Services Table" },
  dailyView: { ar: "يومي", en: "Daily" },
  monthlyView: { ar: "شهري", en: "Monthly" },
  byCategory: { ar: "حسب القسم", en: "By Category" },

  // Working hours
  openTime: { ar: "وقت الفتح", en: "Opening Time" },
  closeTime: { ar: "وقت الإغلاق", en: "Closing Time" },
  workingDays: { ar: "أيام العمل", en: "Working Days" },

  // Offers / promotions
  offers: { ar: "عروض", en: "Offers" },
  specialOffers: { ar: "عروض خاصة", en: "Special Offers" },
  addOffer: { ar: "إضافة عرض", en: "Add Offer" },
  offerTitle: { ar: "عنوان العرض", en: "Offer Title" },
  offerDesc: { ar: "وصف العرض", en: "Offer Description" },
  startDate: { ar: "تاريخ البداية", en: "Start Date" },
  endDate: { ar: "تاريخ النهاية", en: "End Date" },
  discount: { ar: "نسبة الخصم", en: "Discount %" },
  oldPrice: { ar: "السعر القديم", en: "Old Price" },
  newPrice: { ar: "السعر الجديد", en: "New Price" },
  noOffers: { ar: "لا توجد عروض حالياً", en: "No offers available" },
  reportsTab: { ar: "التقارير", en: "Reports" },
  dailyReport: { ar: "تقرير يومي", en: "Daily Report" },
  monthlyReport: { ar: "تقرير شهري", en: "Monthly Report" },
  financialReport: { ar: "تقرير مالي", en: "Financial Report" },
  totalRevenue: { ar: "إجمالي الإيرادات", en: "Total Revenue" },
  selectDate: { ar: "اختر التاريخ", en: "Select Date" },
  selectMonth: { ar: "اختر الشهر", en: "Select Month" },

  // About
  aboutDesc: {
    ar: "وجهة مصر الرائدة للعناية الفاخرة بالسيارات. نجمع بين التكنولوجيا الألمانية والحرفية المتخصصة لتحقيق نتائج لا مثيل لها لسيارتك.",
    en: "Egypt's premier destination for luxury car care. We combine German technology with expert craftsmanship to deliver unmatched results for your vehicle.",
  },
  germanTech: { ar: "تكنولوجيا ألمانية", en: "German Technology" },
  sonaxProducts: { ar: "منتجات SONAX", en: "SONAX products" },
  expertTeam: { ar: "فريق خبير", en: "Expert Team" },
  trainedPros: { ar: "محترفون مدربون", en: "Trained professionals" },
  guaranteedResults: { ar: "نتائج مضمونة", en: "Guaranteed Results" },
  satisfactionPromise: { ar: "وعد الرضا", en: "Satisfaction promise" },
  premiumService: { ar: "خدمة فاخرة", en: "Premium Service" },
  luxuryFocus: { ar: "تركيز على السيارات الفاخرة", en: "Luxury vehicle focus" },
  authorizedDealer: { ar: "وكيل معتمد", en: "AUTHORIZED DEALER" },
  madeInGermany: { ar: "صنع في ألمانيا - التميز المهني", en: "Made in Germany - Professional Excellence" },

  // Contact
  authorizedPartner: { ar: "شريك SONAX الألماني المعتمد", en: "Authorized SONAX Germany Partner" },
  workingHours: { ar: "١٠:٠٠ ص - ١٢:٠٠ ص", en: "10:00 AM - 12:00 AM" },
  hoursDaily: { ar: "١٤ ساعة يومياً - طوال الأسبوع", en: "14 Hours Daily - All Week" },
  callUs: { ar: "اتصل بنا", en: "Call Us" },
  whatsapp: { ar: "واتساب", en: "WhatsApp" },
  location: { ar: "الموقع", en: "Location" },
  openMaps: { ar: "افتح الخريطة", en: "Open Maps" },
  email: { ar: "بريد", en: "Email" },
  openInMaps: { ar: "افتح في خرائط Google", en: "Open in Google Maps" },

  // Admin
  adminDashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  logout: { ar: "خروج", en: "Logout" },
  servicesTab: { ar: "الخدمات", en: "Services" },
  variantsTab: { ar: "الأنواع", en: "Variants" },
  bookingsTab: { ar: "الحجوزات", en: "Bookings" },
  customersTab: { ar: "العملاء", en: "Customers" },
  settingsTab: { ar: "الإعدادات", en: "Settings" },
  customers: { ar: "العملاء", en: "Customers" },
  totalCustomers: { ar: "إجمالي العملاء", en: "Total Customers" },
  totalBookings: { ar: "إجمالي الحجوزات", en: "Total Bookings" },
  lastVisit: { ar: "آخر زيارة", en: "Last Visit" },
  searchCustomers: { ar: "بحث بالاسم أو الهاتف...", en: "Search by name or phone..." },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang];
}
