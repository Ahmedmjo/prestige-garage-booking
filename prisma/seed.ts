// Seed script for Prestige Garage - Premium Car Care
// Adds services WITH variants: Nano Ceramic (3/5/8 years), Prestige Shield (Crown/Elite/Luxury),
// Detailing (interior/roof/wheels/motor/full as variants), plus wash/polish/extras.
import { db } from "../src/lib/db";

async function main() {
  console.log("🌱 Seeding Prestige Garage (with variants)...");

  // --- Admin account (password reset to original) ---
  await db.admin.upsert({
    where: { username: "admin" },
    update: { passwordHash: "prestige2024" }, // reset to original
    create: { username: "admin", passwordHash: "prestige2024" },
  });
  console.log("✅ Admin account (username: admin, password: prestige2024, PIN: 1234)");

  // --- Settings ---
  const settings = [
    { key: "brandName", value: "Prestige Garage" },
    { key: "brandNameAr", value: "بريستيج جاراج" },
    { key: "tagline", value: "Premium Car Care" },
    { key: "taglineAr", value: "العناية الفاخرة بالسيارات" },
    { key: "bornLine", value: "Born in Germany. Mastered in Egypt." },
    { key: "poweredBy", value: "AUTHORIZED SONAX DEALER" },
    { key: "phone", value: "+201000000000" },
    { key: "whatsapp", value: "+201000000000" },
    { key: "address", value: "Cairo, Egypt" },
    { key: "addressAr", value: "القاهرة، مصر" },
    { key: "workingHours", value: "Sat - Thu: 10:00 AM - 10:00 PM" },
    { key: "workingHoursAr", value: "السبت - الخميس: ١٠:٠٠ ص - ١٠:٠٠ م" },
    { key: "instagram", value: "https://instagram.com" },
    { key: "facebook", value: "https://facebook.com" },
    { key: "tiktok", value: "https://tiktok.com" },
    { key: "adminPin", value: "1234" }, // force-updated below to ensure reset
    { key: "currency", value: "EGP" },
    { key: "currencyAr", value: "ج.م" },
    { key: "leadTimeHours", value: "2" },
    { key: "slotDurationMin", value: "60" },
    { key: "slotCapacity", value: "1" }, // cars per slot for non-wash services
    { key: "washSlotCapacity", value: "2" }, // cars per slot for wash services
    { key: "slotControlEnabled", value: "true" }, // admin can disable capacity control entirely
    { key: "aboutAr", value: "وجهة مصر الرائدة للعناية الفاخرة بالسيارات. نجمع بين التكنولوجيا الألمانية والحرفية المتخصصة لتحقيق نتائج لا مثيل لها لسيارتك." },
    { key: "aboutEn", value: "Egypt's premier destination for luxury car care. We combine German technology with expert craftsmanship to deliver unmatched results for your vehicle." },
    // Working hours (admin-controllable open/close times)
    { key: "openHour", value: "10" },
    { key: "closeHour", value: "22" },
    { key: "openTime", value: "10:00" },
    { key: "closeTime", value: "22:00" },
    { key: "workingDays", value: "Sat, Sun, Mon, Tue, Wed, Thu" },
    { key: "workingDaysAr", value: "السبت، الأحد، الإثنين، الثلاثاء، الأربعاء، الخميس" },
  ];

  // --- Branches ---
  const branches = [
    { name: "New Cairo", nameAr: "القاهرة الجديدة", address: "5th Settlement, New Cairo", addressAr: "التجمع الخامس، القاهرة الجديدة", phone: "+201000000001", mapUrl: "https://maps.app.goo.gl/", sortOrder: 0 },
    { name: "Sheikh Zayed", nameAr: "الشيخ زايد", address: "Sheikh Zayed City, Giza", addressAr: "مدينة الشيخ زايد، الجيزة", phone: "+201000000002", mapUrl: "https://maps.app.goo.gl/", sortOrder: 1 },
    { name: "Maadi", nameAr: "المعادي", address: "Maadi, Cairo", addressAr: "المعادي، القاهرة", phone: "+201000000003", mapUrl: "https://maps.app.goo.gl/", sortOrder: 2 },
  ];
  for (const b of branches) {
    const existing = await db.branch.findFirst({ where: { name: b.name } });
    if (existing) {
      await db.branch.update({ where: { id: existing.id }, data: { ...b, isActive: true } });
    } else {
      await db.branch.create({ data: { ...b, isActive: true } });
    }
  }
  console.log(`✅ ${branches.length} branches seeded`);
  for (const s of settings) {
    // force-update critical keys (adminPin, password) so they always reset to defaults
    const forceUpdate = s.key === "adminPin";
    await db.setting.upsert({
      where: { key: s.key },
      update: forceUpdate ? { value: s.value } : {},
      create: s,
    });
  }
  console.log(`✅ ${settings.length} settings seeded`);

  // --- Services ---
  // Order: Protection → Thermal → Detailing → Polish → Wash → Extras
  // Protection: Nano Ceramic (3/5/8y), Prestige Shield (Crown/Elite/Luxury), Solid (highest tier)
  // Thermal: Thermal Insulation (standalone)
  // Detailing: 5 variants (interior/roof/wheels/motor/full)
  // Polish: 3 variants (1-stage/2-stage/3-stage)
  // Wash: Full Wash, Interior Cleaning, Exterior Wash (fixed)
  // Extras: Fabric Coating, Tar & Lime, Black Edition, Dechroming, Nano Ceramic Fiber, Polish PPF, Full Deco

  type SeedService = {
    name: string; nameAr: string; category: string; subCategory?: string | null;
    description?: string | null; descriptionAr?: string | null;
    price: number; duration: number; icon: string; color: string;
    hasVariants?: boolean; priceNote?: string | null;
    variants?: { name: string; nameAr: string; price: number; duration?: number; lifespanDays?: number }[];
  };

  const services: SeedService[] = [
    // ===== 1. PROTECTION (حماية) =====
    {
      name: "Nano Ceramic", nameAr: "نانو سيراميك", category: "protection",
      description: "SONAX ceramic coating. اختر مدة الحماية.",
      descriptionAr: "طلاء سيراميك احترافي من SONAX. اختر مدة الحماية المناسبة.",
      price: 0, duration: 480, icon: "Shield", color: "green",
      hasVariants: true, priceNote: "اختر المدة",
      variants: [
        { name: "3 Years", nameAr: "٣ سنوات", price: 5000, duration: 360, lifespanDays: 1095 },
        { name: "5 Years", nameAr: "٥ سنوات", price: 7000, duration: 420, lifespanDays: 1825 },
        { name: "8 Years", nameAr: "٨ سنوات", price: 9000, duration: 480, lifespanDays: 2920 },
      ],
    },
    {
      name: "Prestige Shield", nameAr: "درع Prestige", category: "protection",
      description: "Paint Protection Film (PPF). اختر الفئة. Solid أعلى فئة عندنا.",
      descriptionAr: "فيلم حماية الطلاء (PPF). اختر الفئة. Solid هي أعلى فئة حماية عندنا.",
      price: 0, duration: 600, icon: "ShieldCheck", color: "purple",
      hasVariants: true, priceNote: "اختر الفئة",
      variants: [
        { name: "Crown", nameAr: "Crown", price: 45000, duration: 600, lifespanDays: 1825 },
        { name: "Elite", nameAr: "Elite", price: 50000, duration: 660, lifespanDays: 2555 },
        { name: "Luxury", nameAr: "Luxury", price: 60000, duration: 720, lifespanDays: 2920 },
        { name: "Solid", nameAr: "Solid", price: 75000, duration: 780, lifespanDays: 3650 },
      ],
    },

    // ===== 2. THERMAL (عزل حراري) =====
    {
      name: "Thermal Insulation", nameAr: "العزل الحراري", category: "thermal",
      description: "Premium thermal insulation film for windows. Reduces heat & UV.",
      descriptionAr: "فيلم عزل حراري فاخر للزجاج. يقلل الحرارة والأشعة فوق البنفسجية.",
      price: 2500, duration: 180, icon: "Wind", color: "orange",
    },

    // ===== 3. DETAILING (ديتيلنج) — 5 variants =====
    {
      name: "Detailing", nameAr: "ديتيلنج", category: "detailing",
      description: "اختر نوع الديتيلنج: مقصورة، سقف، جنوط، موتور، أو كامل.",
      descriptionAr: "اختر نوع الديتيلنج المناسب لسيارتك من الباقات أدناه.",
      price: 0, duration: 180, icon: "Crown", color: "purple",
      hasVariants: true, priceNote: "اختر النوع",
      variants: [
        { name: "Interior Detailing", nameAr: "مقصورة", price: 850, duration: 180 },
        { name: "Roof Detailing", nameAr: "سقف", price: 450, duration: 90 },
        { name: "Wheels Detailing", nameAr: "جنوط", price: 500, duration: 90 },
        { name: "Engine Detailing", nameAr: "موتور", price: 400, duration: 60 },
        { name: "Full Detailing", nameAr: "كامل", price: 2200, duration: 480 },
      ],
    },

    // ===== 4. POLISH (تلميع) — 3 stages =====
    {
      name: "Professional Polish", nameAr: "تلميع احترافي", category: "polish",
      description: "تلميع بالماكينة بعدد مراحل مختلفة. اختر عدد المراحل.",
      descriptionAr: "تلميع احترافي بالماكينة لإزالة الخدوش واستعادة اللمعان. اختر عدد المراحل.",
      price: 0, duration: 240, icon: "Sparkles", color: "yellow",
      hasVariants: true, priceNote: "اختر المراحل",
      variants: [
        { name: "1 Stage", nameAr: "مرحلة واحدة", price: 1200, duration: 240 },
        { name: "2 Stages", nameAr: "مرحلتين", price: 2000, duration: 360 },
        { name: "3 Stages", nameAr: "ثلاث مراحل", price: 3000, duration: 480 },
      ],
    },

    // ===== 5. WASH (غسيل) — Full Wash with car type variants =====
    {
      name: "Full Wash", nameAr: "غسيل كامل", category: "wash",
      description: "Complete exterior + interior wash with SONAX premium shampoo. اختر نوع السيارة.",
      descriptionAr: "غسيل شامل خارجي وداخلي بشامبو SONAX الفاخر. اختر نوع السيارة.",
      price: 0, duration: 45, icon: "Droplets", color: "blue",
      hasVariants: true, priceNote: "اختر نوع السيارة",
      variants: [
        { name: "Sedan", nameAr: "سيدان", price: 240, duration: 45 },
        { name: "SUV", nameAr: "SUV", price: 300, duration: 50 },
        { name: "4x4 Large", nameAr: "4×4 كبير", price: 380, duration: 60 },
      ],
    },
    {
      name: "Interior Cleaning", nameAr: "تنظيف داخلي", category: "wash",
      description: "Deep interior vacuum, dashboard dressing, and sanitization.",
      descriptionAr: "مكنسة داخلية عميقة، تلميع الطبلون، وتعقيم.",
      price: 150, duration: 40, icon: "Armchair", color: "blue",
    },
    {
      name: "Exterior Wash", nameAr: "غسيل خارجي", category: "wash",
      description: "Quick exterior wash and dry with SONAX premium shampoo.",
      descriptionAr: "غسيل خارجي سريع وتجفيف بشامبو SONAX الفاخر.",
      price: 150, duration: 30, icon: "Car", color: "blue",
    },

    // ===== 6. EXTRAS (الإضافات) =====
    {
      name: "Fabric Coating", nameAr: "فابريك كوتينج للأقمشة", category: "extra",
      description: "Fabric & upholstery protection coating. اختر القسم.",
      descriptionAr: "طلاء حماية للأقمشة والتنجيد ضد البقع والاتساخ. اختر القسم المطلوب.",
      price: 0, duration: 90, icon: "Brush", color: "green",
      hasVariants: true, priceNote: "اختر القسم",
      variants: [
        { name: "Cabriolet Roof", nameAr: "سقف كابرليه", price: 800, duration: 90, lifespanDays: 730 },
        { name: "Interior Seats", nameAr: "كراسي مقصورة", price: 600, duration: 60, lifespanDays: 730 },
      ],
    },
    {
      name: "Tar & Lime Removal", nameAr: "إزالة قطران وجير", category: "extra",
      description: "Remove tar spots and water lime deposits from paint & glass.",
      descriptionAr: "إزالة بقع القطران والترسبات الجيرية من الطلاء والزجاج.",
      price: 450, duration: 60, icon: "Droplets", color: "orange",
    },
    {
      name: "Black Edition", nameAr: "بلاك إديشن", category: "extra",
      description: "Full black-out trim package (chrome delete).",
      descriptionAr: "باقة التعتيم الكاملة (إزالة الكروم).",
      price: 3500, duration: 300, icon: "CircleDot", color: "gray",
    },
    {
      name: "Dechroming", nameAr: "دي كرومينج", category: "extra",
      description: "Chrome deletion with premium vinyl wrap.",
      descriptionAr: "إزالة الكروم بفينيل فاخر.",
      price: 2000, duration: 240, icon: "CircleDot", color: "gray",
    },
    {
      name: "Nano Ceramic Fiber", nameAr: "نانو سيراميك فايبر", category: "extra",
      description: "Nano ceramic fiber coating for fabric & textile surfaces.",
      descriptionAr: "طلاء نانو سيراميك فايبر للأسطح النسيجية والجلدية.",
      price: 1800, duration: 120, icon: "Sparkles", color: "green",
    },
    {
      name: "Polish PPF", nameAr: "بوليش PPF", category: "extra",
      description: "Polish + PPF combo for renewed gloss and protection.",
      descriptionAr: "تلميع + PPF معاً لإعادة اللمعان والحماية في خطوة واحدة.",
      price: 5500, duration: 480, icon: "ShieldCheck", color: "purple",
    },
    {
      name: "Full Deco", nameAr: "دوكو كامل", category: "extra",
      description: "Complete deco package — full vehicle detailing & protection.",
      descriptionAr: "باقة الدوكو الكاملة — ديتيلنج وحماية شاملة للسيارة.",
      price: 8000, duration: 600, icon: "Crown", color: "purple",
    },
  ];

  // Clear existing services + variants + bookings + customers to reseed cleanly
  await db.booking.deleteMany();
  await db.serviceVariant.deleteMany();
  await db.service.deleteMany();
  await db.customer.deleteMany();
  console.log("✅ Cleared old services + bookings + customers");

  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    const created = await db.service.create({
      data: {
        name: s.name,
        nameAr: s.nameAr,
        category: s.category,
        subCategory: s.subCategory ?? null,
        description: s.description ?? null,
        descriptionAr: s.descriptionAr ?? null,
        price: s.price,
        duration: s.duration,
        icon: s.icon,
        color: s.color,
        hasVariants: s.hasVariants ?? false,
        priceNote: s.priceNote ?? null,
        isActive: true,
        sortOrder: i,
      },
    });

    if (s.variants && s.variants.length > 0) {
      for (let j = 0; j < s.variants.length; j++) {
        const v = s.variants[j];
        await db.serviceVariant.create({
          data: {
            serviceId: created.id,
            name: v.name,
            nameAr: v.nameAr,
            price: v.price,
            duration: v.duration ?? null,
            lifespanDays: v.lifespanDays ?? null,
            sortOrder: j,
            isActive: true,
          },
        });
      }
    }
  }
  console.log(`✅ ${services.length} services seeded (with variants)`);

  console.log("\n🎉 Seed complete!");
  console.log("   Admin: username=admin, password=prestige2024, PIN=1234");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
