# 🏎️ Prestige Garage AI-OS

نظام إدارة ذكي داخلي لمركز **Prestige Garage** للعناية بالسيارات الفاخرة، مع مساعد ذكي AI متكامل يفهم اللغة العربية.

> **استخدام داخلي حصري**: للمدير والفنيين داخل المركز فقط.

---

## 🚀 النشر على Vercel (مجاني تماماً)

### الطريقة 1: عبر GitHub (موصى به)

#### 1. رفع المشروع على GitHub
```bash
# تهيئة Git (إذا لم يكن مهيأ)
git init
git add .
git commit -m "Prestige Garage AI-OS - Initial commit"

# إنشاء مستودع على GitHub ثم رفعه
git branch -M main
git remote add origin https://github.com/USERNAME/prestige-garage.git
git push -u origin main
```

#### 2. الربط مع Vercel
1. اذهب إلى [vercel.com](https://vercel.com) وسجّل الدخول بحساب GitHub
2. اضغط **"New Project"**
3. اختر مستودع `prestige-garage`
4. اترك الإعدادات الافتراضية (Vercel سيكتشف Next.js تلقائياً)
5. في قسم **Environment Variables**، أضف:
   - `DATABASE_URL` = `file:./db/custom.db`
6. اضغط **"Deploy"**

#### 3. النشر التلقائي
- كل `git push` على `main` سيُحدّث الموقع تلقائياً
- Vercel يُشغّل `prisma generate` + `prisma db push` + `seed` + `next build` تلقائياً

### الطريقة 2: Vercel CLI
```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel

# للنشر الإنتاجي
vercel --prod
```

---

## 🛠️ التقنيات المستخدمة

| الطبقة | التقنية |
|--------|---------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | SQLite via Prisma ORM |
| UI | Tailwind CSS 4 + shadcn/ui |
| Charts | Recharts |
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
```

---

## 📊 الوحدات الإدارية

1. **لوحة التحكم الذكية** — إحصائيات لحظية + رسوم بيانية
2. **جرد الرولات (PPF)** — تتبع الاستهلاك التلقائي
3. **الموظفون** — حساب الرواتب + الحضور + السلفيات + الجزاءات
4. **المخزون** — ديتيلنج / بوليش / نانو / أدوات
5. **الخدمات والفواتير** — سجل العمليات والإيرادات
6. **مساعد برستيج الذكي** — محادثة طبيعية بالعربية

---

## 🔐 ملاحظات مهمة

- **قاعدة البيانات**: SQLite يعمل محلياً. للإنتاج على Vercel، البيانات تُعاد تعبئتها من `scripts/seed_data.json` عند كل نشر.
- **للاستخدام الإنتاجي متعدد المستخدمين**: يُنصح بالترقية إلى Vercel Postgres أو Turso (SQLite مُدار).
- **البيانات الحساسة**: ملف `.env` لا يُرفع على GitHub (موجود في `.gitignore`).

---

## 📞 الدعم

للاستفسارات أو التعديلات، يرجى التواصل مع فريق التطوير.
