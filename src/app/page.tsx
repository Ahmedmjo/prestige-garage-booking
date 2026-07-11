import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin, Clock, Instagram, Facebook } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import ScrollScrubScene from "@/components/ScrollScrubScene";
import ServicesAccordion from "@/components/ServicesAccordion";
import { LanguageProvider, LanguageToggle, LangText } from "@/components/LanguageProvider";
import { CATEGORY_LABELS, type ServiceCategory } from "@/lib/types";

// Server Component — rendered fully on the server so real content
// (services, offers, contact info) is present in the initial HTML for
// search engines, instead of loading client-side like the /app screens.
// (category icons now live inside ServicesAccordion.tsx)

const CATEGORY_ORDER: ServiceCategory[] = [
  "protection",
  "thermal",
  "detailing",
  "polish",
  "wash",
  "extra",
];

export const metadata: Metadata = {
  title: "Prestige Garage | حماية السيارات PPF ونانو سيراميك في مصر",
  description:
    "بريستيج جاراج — وكيل SONAX المعتمد في مصر. أفلام حماية الطلاء (PPF)، نانو سيراميك، تلميع احترافي، عزل حراري، ديتيلنج بالبخار. Born in Germany. Mastered in Egypt.",
};

export default async function HomePage() {
  const [settings, services, offers, branches] = await Promise.all([
    getSettings(),
    db.service.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    db.offer.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
    db.branch.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const servicesByCategory = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: services.filter((s) => s.category === category),
  })).filter((group) => group.items.length > 0);

  const primaryBranch = branches[0];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://prestigegarage.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: settings.brandNameAr || settings.brandName,
    alternateName: settings.brandName,
    image: `${siteUrl}/images/prestige-logo-neon.jpg`,
    url: siteUrl,
    telephone: settings.phone,
    priceRange: "$$$",
    description: settings.aboutAr || settings.aboutEn,
    ...(primaryBranch && {
      address: {
        "@type": "PostalAddress",
        streetAddress: primaryBranch.addressAr || primaryBranch.address || settings.addressAr,
        addressLocality: "Giza",
        addressCountry: "EG",
      },
    }),
    openingHoursSpecification: settings.workingHoursAr
      ? {
          "@type": "OpeningHoursSpecification",
          description: settings.workingHoursAr,
        }
      : undefined,
    sameAs: [settings.instagram, settings.facebook, settings.tiktok].filter(
      (u) => u && !u.endsWith("instagram.com") && !u.endsWith("facebook.com") && !u.endsWith("tiktok.com")
    ),
  };

  return (
    <LanguageProvider>
    <main className="min-h-screen bg-[var(--cinema-bg)] text-foreground">
      {/* Structured data for search engines — not visible to visitors */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ---------- HEADER ---------- */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/prestige-logo-neon.jpg"
            alt={settings.brandNameAr}
            width={40}
            height={40}
            className="h-9 w-9"
          />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            href="/app"
            className="rounded-full border border-white/20 bg-black/30 px-5 py-2 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:border-[var(--cinema-crimson)]"
          >
            <LangText ar="احجز الآن" en="Book Now" />
          </Link>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <ScrollScrubScene
        src="/videos/hero-intro.mp4"
        poster="/videos/posters/hero-intro.jpg"
        scrubLengthVh={150}
        overlay="radial-gradient(circle at 50% 35%, var(--cinema-crimson), transparent 65%), linear-gradient(to bottom, transparent 40%, var(--cinema-bg) 95%)"
        contentClassName="relative z-10 flex w-full flex-col items-center gap-6 px-6 text-center"
      >
        <Image
          src="/images/prestige-logo-neon.jpg"
          alt={settings.brandNameAr}
          width={200}
          height={200}
          priority
          className="h-auto w-40 drop-shadow-[0_0_35px_var(--cinema-crimson)] sm:w-48"
        />
        <div className="space-y-2">
          <LangText
            as="h1"
            ar={settings.brandNameAr}
            en={settings.brandName || settings.brandNameAr}
            className="text-4xl font-black tracking-wide text-foreground sm:text-6xl"
          />
          <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground sm:text-base">
            {settings.tagline}
          </p>
        </div>
        <LangText
          as="p"
          ar="صُنع في ألمانيا .. أُتقن في مصر"
          en="Born in Germany. Mastered in Egypt."
          className="max-w-xl text-balance text-base italic text-muted-foreground/80 sm:text-lg"
        />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/app"
            className="rounded-full bg-[var(--cinema-crimson)] px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_0_25px_var(--cinema-crimson)] transition-all hover:scale-105 hover:shadow-[0_0_35px_var(--cinema-crimson)] sm:text-base"
          >
            <LangText ar="احجز الآن" en="Book Now" />
          </Link>
          {primaryBranch?.phone && (
            <a
              href={`https://wa.me/${(settings.whatsapp || "").replace(/[^0-9]/g, "")}`}
              className="rounded-full border border-border px-8 py-3.5 text-sm font-bold text-foreground transition-colors hover:border-[var(--cinema-crimson)] sm:text-base"
            >
              <LangText ar="تواصل واتساب" en="WhatsApp Us" />
            </a>
          )}
        </div>
      </ScrollScrubScene>


      {/* ---------- SERVICES ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--cinema-crimson)]">
            خدماتنا
          </p>
          <h2 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">
            حماية كاملة لسيارتك، من الألف للياء
          </h2>
        </div>

        <ServicesAccordion groups={servicesByCategory} currencyAr={settings.currencyAr} />
      </section>

      {/* ---------- CINEMATIC SCENES ---------- */}
      {[
        {
          video: "/videos/protection-wrap.mp4",
          poster: "/videos/posters/protection-wrap.jpg",
          eyebrow: "حماية الطلاء",
          eyebrowEn: "Paint Protection",
          title: "PPF — درع غير مرئي لسيارتك",
          titleEn: "PPF — An Invisible Shield for Your Car",
          text: "فيلم حماية أمريكي عالي الجودة يمتص الصدمات والخدوش قبل ما توصل لطلاء سيارتك، مع لمعان زجاجي دايم.",
          textEn: "Premium American-grade film absorbs impacts and scratches before they reach your paint, with a lasting glass-like finish.",
        },
        {
          video: "/videos/nano-ceramic.mp4",
          poster: "/videos/posters/nano-ceramic.jpg",
          eyebrow: "نانو سيراميك",
          eyebrowEn: "Nano Ceramic",
          title: "طبقة حماية معدنية بلمعان مرآة",
          titleEn: "A Metallic Layer with a Mirror Finish",
          text: "تغليف نانوي يحمي من الأشعة فوق البنفسجية والحرارة، ويخلي مية السيارة تنزلق من غير ما تسيب أثر.",
          textEn: "Nano coating protects against UV and heat, and makes water slide right off without leaving a trace.",
        },
        {
          video: "/videos/polish-hq.mp4",
          poster: "/videos/posters/polish-hq.jpg",
          eyebrow: "التلميع الاحترافي",
          eyebrowEn: "Professional Polishing",
          title: "من طلاء باهت لتشطيب مرآة",
          titleEn: "From Dull Paint to a Mirror Finish",
          text: "بوليش احترافي بمراحل دقيقة يشيل أي خدوش سطحية ويرجع للطلاء لمعانه الأصلي بالظبط.",
          textEn: "Professional multi-stage polishing removes surface scratches and restores your paint's original gloss.",
        },
        {
          video: "/videos/window-film.mp4",
          poster: "/videos/posters/window-film.jpg",
          eyebrow: "العزل الحراري",
          eyebrowEn: "Window Film",
          title: "زجاج بارد، خصوصية أعلى",
          titleEn: "Cooler Glass, More Privacy",
          text: "عزل حراري يقلل درجة الحرارة جوه العربية ويحجب الأشعة الضارة من غير ما يأثر على وضوح الرؤية.",
          textEn: "Thermal insulation lowers the cabin temperature and blocks harmful rays without affecting visibility.",
        },
        {
          video: "/videos/body-paint.mp4",
          poster: "/videos/posters/body-paint.jpg",
          eyebrow: "الدوكو",
          eyebrowEn: "Body Paint",
          title: "تشطيب مصنعي بجودة عالية",
          titleEn: "Factory-Grade Finish Quality",
          text: "إعادة دهان احترافية بطبقات دقيقة توصل السيارة لتشطيب Piano Black زي الوكالة بالظبط.",
          textEn: "Professional refinishing in precise layers brings your car to a showroom Piano Black finish.",
        },
        {
          video: "/videos/steam-exterior-hq.mp4",
          poster: "/videos/posters/steam-exterior-hq.jpg",
          eyebrow: "ديتيلنج بالبخار",
          eyebrowEn: "Steam Detailing",
          title: "تنظيف عميق من غير مية زيادة",
          titleEn: "Deep Clean Without Excess Water",
          text: "بخار مضغوط بيشيل الأوساخ والبكتيريا من كل تفصيلة في السيارة، من غير ما يأثر على أي سطح حساس.",
          textEn: "Pressurized steam removes dirt and bacteria from every detail of your car without affecting sensitive surfaces.",
        },
        {
          video: "/videos/wash-exterior-hq.mp4",
          poster: "/videos/posters/wash-exterior-hq.jpg",
          eyebrow: "الغسيل الخارجي",
          eyebrowEn: "Exterior Wash",
          title: "نظافة تليق بسيارتك",
          titleEn: "A Clean That Matches Your Car",
          text: "غسيل خارجي احترافي بمواد آمنة على الطلاء والحماية المركّبة، بلمسة أخيرة لامعة.",
          textEn: "Professional exterior wash with products safe on your paint and installed protection, finished with a glossy touch.",
        },
      ].map((scene) => (
        <ScrollScrubScene
          key={scene.video}
          src={scene.video}
          poster={scene.poster}
          eyebrow={scene.eyebrow}
          eyebrowEn={scene.eyebrowEn}
          title={scene.title}
          titleEn={scene.titleEn}
          text={scene.text}
          textEn={scene.textEn}
        />
      ))}

      {/* ---------- INTERIOR DETAILING ---------- */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/reference-boards/steam-interior-01.png)" }}
        />
        {/* لمسة بخار خفيفة متحركة بـ CSS بدل فيديو، توفيرًا للتوليد */}
        <div className="steam-drift absolute inset-x-0 bottom-0 h-2/3" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, var(--cinema-bg) 25%, rgba(5,5,5,0.75) 60%, rgba(5,5,5,0.25) 90%)",
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
          <div className="max-w-md rounded-2xl bg-black/35 p-6 backdrop-blur-sm">
            <LangText
              as="p"
              ar="العناية الداخلية"
              en="Interior Detailing"
              className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--cinema-crimson)]"
            />
            <LangText
              as="h3"
              ar="مقصورة فاخرة بلمسة يد خبير"
              en="A Luxurious Cabin, Finished by Expert Hands"
              className="mt-3 text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-3xl"
            />
            <LangText
              as="p"
              ar="تنظيف وتغذية كل تفصيلة جوه السيارة — من الجلد لحد أدق الزوايا — بأدوات ومواد مخصصة لكل خامة."
              en="Cleaning and conditioning every detail inside your car — from the leather to the finest corners — with tools and materials matched to each surface."
              className="mt-4 text-sm leading-relaxed text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] sm:text-base"
            />
          </div>
        </div>
      </section>

      {/* ---------- عناية فاخرة / برنامج الصيانة ---------- */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <LangText
          as="p"
          ar="عناية فاخرة"
          en="Premium Care"
          className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--brand-gold)]"
        />
        <LangText
          as="h2"
          ar="برنامج صيانة كونسيرج"
          en="Concierge Maintenance Program"
          className="mt-3 text-3xl font-black text-foreground sm:text-4xl"
        />
        <LangText
          as="p"
          ar="متابعة دورية مخصصة لسيارتك — فحص، تجديد الحماية، وتذكير بمواعيد الصيانة، كل ده مُدار بالكامل من فريق بريستيج جراج من غير ما تشغل بالك بأي تفصيلة."
          en="Personalized, recurring care for your car — inspections, protection renewal, and maintenance reminders, fully managed by the Prestige Garage team so you don't have to think about a thing."
          className="mx-auto mt-4 max-w-xl text-balance leading-relaxed text-muted-foreground"
        />
        <Link
          href="/app"
          className="mt-6 inline-block rounded-full border border-[var(--cinema-crimson)] px-8 py-3.5 text-sm font-bold text-foreground transition-colors hover:bg-[var(--cinema-crimson)]"
        >
          <LangText ar="اعرف أكتر" en="Learn More" />
        </Link>
      </section>


      {/* ---------- OFFERS ---------- */}
      {offers.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--brand-gold)]">
              عروض حالية
            </p>
            <h2 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">
              أحدث العروض
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-2xl border border-[var(--brand-gold)]/30 bg-card/40 p-6"
              >
                <h3 className="mb-2 text-lg font-bold text-foreground">{offer.titleAr}</h3>
                {offer.descriptionAr && (
                  <p className="mb-3 text-sm text-muted-foreground">{offer.descriptionAr}</p>
                )}
                {offer.newPrice && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-[var(--cinema-crimson)]">
                      {offer.newPrice} {settings.currencyAr}
                    </span>
                    {offer.oldPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {offer.oldPrice} {settings.currencyAr}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- ABOUT ---------- */}
      <section className="border-y border-border/60 bg-card/20">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="mb-6 text-2xl font-black text-foreground sm:text-3xl">
            {settings.brandNameAr}
          </h2>
          <p className="text-balance leading-relaxed text-muted-foreground">
            {settings.aboutAr}
          </p>
        </div>
      </section>

      {/* ---------- CONTACT / BRANCHES ---------- */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--cinema-crimson)]">
            تواصل معنا
          </p>
          <h2 className="mt-3 text-3xl font-black text-foreground">فروعنا</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-2xl border border-border/60 bg-card/40 p-6"
            >
              <h3 className="mb-3 text-lg font-bold text-foreground">{branch.nameAr}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                {branch.addressAr && (
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cinema-crimson)]" />
                    {branch.addressAr}
                  </p>
                )}
                {branch.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-[var(--cinema-crimson)]" />
                    <a href={`tel:${branch.phone}`} dir="ltr" className="hover:text-foreground">
                      {branch.phone}
                    </a>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-[var(--cinema-crimson)]" />
                  {settings.workingHoursAr}
                </p>
              </div>
              {branch.mapUrl && (
                <a
                  href={branch.mapUrl}
                  className="mt-4 inline-block text-xs font-bold text-[var(--cinema-crimson)] hover:underline"
                >
                  افتح في خرائط جوجل ←
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FINALE ---------- */}
      <ScrollScrubScene
        src="/videos/amg-reveal.mp4"
        poster="/videos/posters/amg-reveal.jpg"
        scrubLengthVh={200}
        overlay="radial-gradient(circle at 50% 60%, transparent 30%, var(--cinema-bg) 90%)"
        contentClassName="relative z-10 flex w-full flex-col items-center gap-6 px-6 text-center"
      >
        <h2 className="text-3xl font-black text-foreground sm:text-5xl">
          سيارتك تستاهل الحماية دي
        </h2>
        <Link
          href="/app"
          className="rounded-full bg-[var(--cinema-crimson)] px-10 py-4 text-sm font-bold text-primary-foreground shadow-[0_0_30px_var(--cinema-crimson)] transition-transform hover:scale-105 sm:text-base"
        >
          احجز الآن
        </Link>
      </ScrollScrubScene>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-border/60 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {settings.brandNameAr} — {settings.bornLine}
          </p>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground">
            <Image
              src="/images/Logo_Authorized_Detailer-1.png"
              alt="SONAX Authorized Detailer"
              width={28}
              height={28}
              className="h-6 w-6 rounded-full"
            />
            {settings.poweredBy}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-xs font-bold text-foreground hover:text-[var(--cinema-crimson)]">
              احجز الآن
            </Link>
            {settings.instagram && (
              <a href={settings.instagram} aria-label="Instagram" className="text-muted-foreground hover:text-[var(--cinema-crimson)]">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {settings.facebook && (
              <a href={settings.facebook} aria-label="Facebook" className="text-muted-foreground hover:text-[var(--cinema-crimson)]">
                <Facebook className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </footer>
    </main>
    </LanguageProvider>
  );
}
