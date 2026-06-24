# 🏎️ Prestige Garage AI-OS

نظام إدارة ذكي داخلي لمركز **Prestige Garage** للعناية بالسيارات الفاخرة، مع مساعد ذكي AI متكامل يفهم اللغة العربية.

> **استخدام داخلي حصري**: للمدير والفنيين داخل المركز فقط.

---

## ✨ المميزات الرئيسية

### 🤖 مساعد برستيج الذكي (Prestige Assistant)
- محادثة طبيعية بالعربية الفصحى بلهجة مصرية
- الإجابة على الاستفسارات (رصيد الرولات، الرواتب، الإيرادات)
- إضافة بيانات جديدة عبر المحادثة
- إنشاء تقارير وتحليلات مخصصة
- تنبيهات ذكية بناءً على حالة المخزون

### 📊 الوحدات الإدارية
1. **لوحة التحكم الذكية** — إحصائيات لحظية + رسوم بيانية تفاعلية + تنبيهات
2. **جرد الرولات (PPF)** — 17 رول مع تتبع الاستهلاك التلقائي بالأمتار
3. **الموظفون** — 6 موظفين + كشف الحضور + حساب الرواتب التلقائي + السلفيات + العمولات
4. **المخزون** — 47 صنف (ديتيلنج/بوليش/أدوات) + حركات الاستلام والسحب
5. **الخدمات والفواتير** — 32 خدمة مسجلة + تحليل الإيرادات حسب النوع
6. **AI Chat** — واجهة محادثة كاملة مع اقتراحات سريعة

---

## 🛠️ التقنيات المستخدمة

| الطبقة | التقنية |
|--------|---------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | SQLite via Prisma ORM |
| UI | Tailwind CSS 4 + shadcn/ui |
| Charts | Recharts |
| Animation | Framer Motion |
| AI | z-ai-web-dev-sdk |
| Icons | Lucide React |
| Deployment | Vercel |

---

## 🎨 الهوية البصرية

```
الخلفية:    #000000 / #050505 (أسود داكن)
الأساسي:    #DC143C (Crimson Red)
النص:       #FFFFFF (أبيض) / #888888 (رمادي)
النجاح:     #00C853 (أخضر)
التنبيه:    #FF9100 (برتقالي)
البطاقات:   #0A0A0A مع حدود شفافة 5%
الخط:       -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
```

---

## 🚀 التشغيل المحلي

```bash
# 1. تثبيت الحزم
bun install

# 2. تهيئة قاعدة البيانات
bun run db:push

# 3. استيراد البيانات الأولية (454 سجل)
bun run scripts/seed.ts

# 4. تشغيل خادم التطوير
bun run dev
```

التطبيق سيعمل على `http://localhost:3000`

---

## ☁️ النشر على Vercel (مجاني تماماً)

### الطريقة 1: عبر GitHub (موصى به)
1. ارفع المشروع إلى GitHub:
   ```bash
   git init
   git add .
   git commit -m "Prestige Garage AI-OS"
   git branch -M main
   git remote add origin https://github.com/USERNAME/prestige-garage.git
   git push -u origin main
   ```

2. على [vercel.com](https://vercel.com):
   - New Project → اختر المستودع
   - Framework Preset: Next.js (مكتشف تلقائياً)
   - Build Command: `prisma generate && next build`
   - Install Command: `bun install`
   - Deploy

### الطريقة 2: Vercel CLI
```bash
npm i -g vercel
vercel
```

> ⚠️ **ملاحظة عن قاعدة البيانات**: SQLite يعمل محلياً. للنشر على Vercel، يُنصح بالترقية إلى Vercel Postgres (مجاني) أو Turso (SQLite مُدار). الكود الحالي يدعم SQLite لتجربة سريعة.

---

## 📁 هيكل المشروع

```
prestige-garage-ai-os/
├── prisma/
│   └── schema.prisma          # 11 جدول (Rolls, Employees, Stock, Services, AI, Alerts)
├── scripts/
│   ├── extract_data.py        # استخراج البيانات من Excel
│   ├── extract_seed.py        # تحويل البيانات لـ JSON
│   ├── seed_data.json         # 454 سجل بيانات حقيقية
│   └── seed.ts                # سكريبت استيراد البيانات
├── src/
│   ├── app/
│   │   ├── api/               # API Routes لكل وحدة
│   │   │   ├── dashboard/     # لوحة التحكم
│   │   │   ├── rolls/         # الرولات
│   │   │   ├── consumptions/  # الاستهلاك
│   │   │   ├── employees/     # الموظفون + الحضور + السلفيات
│   │   │   ├── stock/         # المخزون + الحركات
│   │   │   ├── services/      # الخدمات
│   │   │   ├── invoices/      # الفواتير
│   │   │   ├── alerts/        # التنبيهات
│   │   │   └── ai/chat/       # مساعد برستيج الذكي
│   │   ├── page.tsx           # الصفحة الرئيسية (Tab Navigation)
│   │   ├── layout.tsx         # RTL + Arabic
│   │   └── globals.css        # الهوية البصرية
│   ├── components/
│   │   ├── modules/           # وحدات النظام
│   │   │   ├── dashboard.tsx
│   │   │   ├── rolls-module.tsx
│   │   │   ├── employees-module.tsx
│   │   │   ├── stock-module.tsx
│   │   │   ├── services-module.tsx
│   │   │   └── ai-chat.tsx
│   │   ├── prestige/          # مكونات Prestige مخصصة
│   │   └── ui/                # shadcn/ui components
│   └── lib/
│       ├── db.ts              # Prisma client
│       └── ai-assistant.ts    # محرك مساعد برستيج
├── vercel.json                # إعدادات النشر
└── package.json
```

---

## 📊 قاعدة البيانات (11 جدول)

| الجدول | الوصف | عدد السجلات |
|--------|-------|--------------|
| `rolls` | رولات البروتيكشن | 17 |
| `roll_consumptions` | استهلاك الرولات | 20 |
| `employees` | بيانات الموظفين | 6 |
| `attendance` | الحضور اليومي | 120 |
| `commissions` | العمولات | 40 |
| `advances` | السلفيات | 39 |
| `stock_items` | أصناف المخزون | 47 |
| `stock_movements` | حركات المخزون | 107 |
| `services` | سجل الخدمات | 32 |
| `invoices` | الفواتير | 7 |
| `alerts` | التنبيهات الذكية | 5 |
| `ai_conversations` | محادثات AI | ديناميكي |

**إجمالي البيانات المستوردة**: 454 سجل حقيقي من ملفات Excel

---

## 🤖 أمثلة على استخدام المساعد الذكي

```
🧑 "كم رصيد رول Hexis BF-001؟"
🤖 رول HXS-BF-001 (Hexis Body Fence Glossy):
   • الطول الكلي: 15 متر
   • المتبقي: 1.2 متر
   • الحالة: أوشك على النفاذ
   ⚠️ يفضل طلب استبدال قريباً

🧑 "صافي مرتب علي يحيى في يونيو؟"
🤖 👷 علي يحيى - فني عزل (يونيو 2026):
   • أيام الحضور: 21 يوم
   • الأساسي المستحق: 8,400 ج.م
   • العمولات: 3,700 ج.م
   • السلفيات: 0 ج.م
   • الصافي: 12,100 ج.م

🧑 "أظهر لي الرولات اللي أوشكت على النفاذ"
🤖 ⚠️ الرولات التي أوشكت على النفاذ:
   1. HXS-BF-001 (Hexis) - متبقي 1.2 متر
   2. 3M-SG-005 (3M) - متبقي 2.2 متر
   يفضل طلب استبدالها قريباً
```

---

## 🔐 الأمان والصلاحيات (مستقبلاً)

النظام مُصمم للاستخدام الداخلي فقط. يمكن إضافة:
- NextAuth.js للمصادقة
- صلاحيات (مدير/فني/محاسب)
- حماية API routes

---

## 📞 الدعم

للاستفسارات أو التعديلات، يرجى التواصل مع فريق تطوير النظام.
