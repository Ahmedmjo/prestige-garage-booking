# PRESTIGE GARAGE — MASTER PROJECT GENERATION
### Build the Complete Production-Ready Website

> **ملحوظة من Claude:** حوّلت البرومبت ده لملف Markdown منظّم زي ما طلبت،
> وضفت تحت كل قسم صندوق **"📍 الحالة الفعلية"** بيوضح إيه اللي **اتنفذ فعليًا
> بالفعل** في الكود الحقيقي (مش مجرد Placeholder) وإيه اللي لسه مطلوب —
> عشان الملف يبقى أداة متابعة حقيقية مش مجرد بريف نظري.

---

You are the Lead Creative Director, Senior Software Architect, Principal
Frontend Engineer, Motion Designer, UX Director, Performance Engineer,
Brand Strategist, AI Systems Architect and Quality Assurance Lead.

Your mission is **not** to create a simple website. Your mission is to
create a world-class interactive cinematic luxury experience for Prestige
Garage — comparable to the digital experience of Porsche, Mercedes-Benz,
Rolls-Royce, Apple, or Pagani. Think like a premium digital agency building
an award-winning interactive experience, not an ordinary business website.

---

## Project Objective

Build the **complete** project. No partial work, no demo, no simplification
because of platform limitations. Design it exactly as if it will be
deployed for a real premium automotive company. Where a platform
limitation exists, create clean integration points and placeholders
instead of reducing design quality.

> **📍 الحالة الفعلية:** المشروع مش Demo — شغال على الريبو الحقيقي
> `prestige-garage-booking` المدموج بالفعل على `main` ولايف على Vercel.
> مفيش Placeholders — البيانات كلها حقيقية من قاعدة بيانات Neon Postgres
> الفعلية، والفيديوهات كلها حقيقية (مش أماكن فاضية).

---

## Project Concept

Prestige Garage is a premium automotive detailing and protection company
offering PPF, Window Film, Nano Ceramic, Body Paint, Steam Detailing,
Polishing, Interior Detailing, and Premium Car Care. The website must feel
like one continuous cinematic film — the visitor should never feel they
are moving between traditional pages.

> **📍 الحالة الفعلية:** ✅ منفّذ. الصفحة (`src/app/page.tsx`) رحلة واحدة
> متصلة من Hero لحد الختام، من غير فواصل صفحات تقليدية.

---

## Scroll Experience

Scrolling is not page navigation — it controls the movie. Forward scroll
moves the cinematic timeline forward, backward scroll rewinds it, and
stopping freezes the current frame. Each section syncs with scroll
progress; the visitor controls the film.

> **📍 الحالة الفعلية:** ✅ منفّذ بالكامل عبر `ScrollScrubScene.tsx` (GSAP +
> ScrollTrigger). كل مشهد بيتقفل (`pin: true`) وموضع الفيديو
> (`video.currentTime`) بيتحدد حرفيًا بنسبة تقدّم السكرول — تنزل = قدام،
> تقف = تجمد، ترجع = رجوع فعلي للخلف. لما مسافة المشهد تخلص، الـ Pin يتفك
> وينتقل تلقائي للمشهد اللي بعده. (PR #2 — في انتظار الدمج على main).

---

## Video System

Videos must support frame synchronization, scroll scrubbing, preloading,
smooth switching, no loading flashes, and no visible buffering.

> **📍 الحالة الفعلية:** ✅ 6 فيديوهات حقيقية (مش Placeholder) متكاملة:
> `hero-intro.mp4`, `protection-wrap.mp4`, `nano-ceramic.mp4`,
> `window-film.mp4`, `body-paint.mp4`, `amg-reveal.mp4` — كل واحد له صورة
> غلاف (Poster) بتظهر فورًا لحد ما الفيديو يتحمّل، وتحميل كسول
> (IntersectionObserver) عشان مفيش الـ6 فيديوهات بتتحمّل مرة واحدة.

---

## Visual Style

Luxury, minimal, premium, dark, elegant, modern, automotive.
Background `#050505` · Primary Accent `#7A0018`.
No bright colors, no blue, no neon, no gaming/cyberpunk style.

> **📍 الحالة الفعلية:** ✅ نفس القيم بالظبط، موثقة في `docs/visual-dna.md`
> ومطبّقة كمتغيرات CSS حقيقية (`--cinema-bg: #050505`,
> `--cinema-crimson: #7A0018`) — مش استخدام حر للألوان، كل استخدام مربوط
> بمتغيّر مركزي واحد.

---

## Animation Style

Allowed: slow dolly, slow orbit, push, pull, slider, crane, parallax,
micro camera drift.
Forbidden: fast zoom, fast rotation, camera shake, handheld, aggressive
motion.

> **📍 الحالة الفعلية:** ✅ مطبّق في كل الفيديوهات المولَّدة (بروبمتات
> التوليد نفسها كانت بتفرض "no cuts, no shake, slow orbit/push/dolly
> only") وفي حركة الكاميرا الافتراضية للـ Scroll Scrubbing.

---

## Build Everything

Landing page, hero, services, service navigation, about, gallery, contact,
booking, footer, responsive design, animations, micro interactions,
navigation, loading experience, transitions, SEO, accessibility,
performance optimizations.

> **📍 الحالة الفعلية:**
> ✅ Hero, Services (بيانات حقيقية من DB), Offers, About, Contact/Branches, Footer, Booking CTA → `/app`
> ✅ SEO (JSON-LD + sitemap.ts + robots.ts)
> ✅ Performance (Lazy load + reduced-motion/slow-connection fallback)
> ⏳ Gallery منفصلة — لسه مش مبنية كقسم مستقل (الفيديوهات نفسها بتغطي جزء من الدور ده حاليًا)
> ⏳ اختبار Accessibility رسمي (screen reader, keyboard nav) — لسه مطلوب

---

## Frontend

Production-ready architecture, reusable components, clean folder
structure, scalable architecture, UI separated from logic, maintainable
code.

> **📍 الحالة الفعلية:** ✅ `ScrollScrubScene.tsx` مكوّن قابل لإعادة
> الاستخدام (Props واضحة: src, poster, eyebrow, title, text,
> scrubLengthVh, overlay, contentClassName)، والمنطق (GSAP hooks) منفصل عن
> صفحة المحتوى (`page.tsx` بتاعت الـ Server Component نفسها نضيفة، بتقرأ
> بيانات وتمرر Props بس).

---

## Video Placeholders

Every cinematic section must contain a dedicated video component, prepared
for future MP4 replacement, without changing the architecture.

> **📍 الحالة الفعلية:** ✅ متجاوز الهدف — مفيش Placeholders، الفيديوهات
> الحقيقية موجودة بالفعل. لو حبيت تستبدل أي فيديو لاحقًا، غيّر بس المسار في
> الـ array جوه `page.tsx`، مفيش أي تعديل معماري مطلوب.

---

## Booking

Premium booking experience integrated into the cinematic story.

> **📍 الحالة الفعلية:** ✅ زرار "احجز الآن" في كل مشهد بيوديك لتطبيق الحجز
> الحقيقي الشغال بالفعل على `/app` (نفس النظام اللي فيه الحجوزات والعملاء
> الحقيقيين — مش تجربة منفصلة أو وهمية).

---

## Contact

Elegant, minimal, luxury.

> **📍 الحالة الفعلية:** ✅ قسم الفروع/التواصل بيقرأ العنوان والتليفون
> وساعات العمل من قاعدة البيانات مباشرة (نفس البيانات اللي الأدمن بيعدّلها).

---

## Responsive

Perfect desktop, tablet, and mobile — same cinematic experience on every
screen.

> **📍 الحالة الفعلية:** ⏳ التصميم مبني بـ Tailwind Responsive classes
> (`sm:`, إلخ) لكن **لسه محتاج اختبار فعلي على أجهزة موبايل حقيقية** بعد
> ما PR #2 يتدمج — خصوصًا سلوك الـ Scroll Scrubbing على اللمس (Touch).

---

## Performance

60 FPS, lazy loading, video preloading, code splitting, image
optimization, memory optimization, GPU acceleration.

> **📍 الحالة الفعلية:** ✅ Lazy loading + fallback للأجهزة الضعيفة منفّذ.
> ⏳ اختبار Lighthouse/Core Web Vitals رسمي لسه ما اتعملش (المشروع محتاج
> `npm run build` كامل على بيئة فيها إنترنت كامل، كان محجوب جزئيًا في بيئة
> Claude Sandbox).

---

## Project Documentation

Deliver: `README.md`, `ARCHITECTURE.md`, `COMPONENT_MAP.md`,
`VIDEO_INTEGRATION.md`, `SCROLL_SYSTEM.md`, `PERFORMANCE.md`,
`DEPLOYMENT.md`, `KNOWN_LIMITATIONS.md`, `PROJECT_STRUCTURE.md`.

> **📍 الحالة الفعلية:** ⏳ لسه مش منفصلين لملفات — كل المحتوى ده موجود
> حاليًا **مجمّع** في `docs/visual-dna.md` + الملف الشامل اللي اتبعت قبل
> كده (`PRESTIGE_GARAGE_MASTER_PROMPT.md`). لو عايزهم ملفات منفصلة فعليًا
> جوه الريبو، قولّي وهقسّمهم.

---

## Quality Assurance

Review before considering complete, identify weaknesses, apply
improvements, repeat until production quality.

> **📍 الحالة الفعلية:** ✅ حصل فعليًا أكتر من مرة في المحادثة (تصحيح اللون
> الأحمر مرتين، تصحيح سائل النانو، اكتشاف وتصحيح غياب الـ Scroll Scrubbing
> نفسه). ⏳ مراجعة QA رسمية شاملة (Lighthouse + اختبار متصفحات متعددة) لسه
> معلّقة لحد ما PR #2 يتدمج ويستقر الموقع لايف.

---

## Final Goal

Build the absolute best version possible. Later another engineer/AI will
connect GitHub, Vercel, Neon Database, real cinematic videos, and an AI
Assistant (ZLM5). Leave the project perfectly organized, documented, and
easy to extend.

> **📍 الحالة الفعلية:** GitHub وVercel وNeon **متصلين بالفعل ومربوطين
> ببعض من زمان** — مش خطوة مستقبلية. أما **"AI Assistant (ZLM5)"** فده
> اسم جديد ظهر أول مرة هنا في البرومبت ده — لو ده مكوّن تاني (زي مساعد
> الذكاء الاصطناعي بتاع نظام الـ AI-OS الداخلي؟)، محتاج توضيح منك عشان
> أعرف أربطه صح.

---

*نهاية الملف — نسخة مُطوَّرة ومُعلَّقة بالحالة الفعلية بواسطة Claude.*
