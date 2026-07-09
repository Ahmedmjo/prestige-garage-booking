"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Crown,
  Clock,
  MapPin,
  Phone,
  Navigation,
  Sparkles,
  Tag,
  X,
  Maximize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { BrandCrown, SonaxBadge } from "@/components/brand/Logo";
import { useApp } from "@/lib/store";
import { useSettings } from "@/lib/use-settings";
import { useT, useLang } from "@/lib/use-lang";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJI,
  softColor,
  type ServiceCategory,
} from "@/lib/types";

/** Category → soft color key (for inner-shadow tint via softColor()) */
const CAT_COLOR_KEY: Record<ServiceCategory, string> = {
  protection: "green",
  thermal: "orange",
  detailing: "purple",
  polish: "yellow",
  wash: "blue",
  extra: "orange",
};

/** Premium categories (Prestige crown in corner — no SONAX badge) */
const PREMIUM_CATS: ServiceCategory[] = ["protection", "thermal"];
/** SONAX-partner categories (small SONAX badge in corner) */
const SONAX_CATS: ServiceCategory[] = ["detailing", "wash", "polish", "extra"];

/* ─── Fullscreen offer modal payload ─── */
type OfferModalData = {
  offerId: string;
  title: string;
  desc: string;
  imageUrl: string | null;
  videoUrl: string | null;
  hasVideo: boolean;
  hasImage: boolean;
  discountPct: number | null;
  oldPrice: number | null;
  newPrice: number | null;
  currencyAr: string;
  lang: "ar" | "en";
};

/* ─── Fullscreen offer modal — opens on card tap ───
   • Video: auto-plays with sound + native controls
   • Image/poster: full-size readable image
   • Close button (X) + click backdrop to close + Esc to close
   • Dark blurred overlay; respects iOS safe-area insets
*/
function OfferFullscreenModal({
  data,
  onClose,
}: {
  data: OfferModalData;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // ⚡ STREAMING ENDPOINT: Use /api/offers/[id]/video instead of raw base64.
  // If videoUrl is a real URL (new uploads), use it directly.
  const videoSrc =
    data.videoUrl || (data.hasVideo ? `/api/offers/${data.offerId}/video` : null);
  const posterSrc =
    data.imageUrl || (data.hasImage ? `/api/offers/${data.offerId}/image` : null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    const v = videoRef.current;
    if (v) {
      v.play().catch(() => {});
    }
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, videoSrc]);

  return (
    <motion.div
      className="offer-fullscreen-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={data.title}
    >
      <button
        ref={closeBtnRef}
        type="button"
        onClick={onClose}
        className="offer-fullscreen-close"
        aria-label="Close"
      >
        <X size={22} />
      </button>

      <motion.div
        className="offer-fullscreen-content"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc || undefined}
            autoPlay
            controls
            playsInline
            className="offer-fullscreen-video"
          />
        ) : posterSrc ? (
          <img
            src={posterSrc}
            alt={data.title}
            className="offer-fullscreen-image"
          />
        ) : (
          <div
            className="flex aspect-video w-full items-center justify-center rounded-2xl border border-white/10"
            style={{ background: "linear-gradient(135deg, #1a0a0e, #6b1228)" }}
          >
            <p className="text-sm text-white/50">
              {data.lang === "ar" ? "لا توجد ميديا" : "No media"}
            </p>
          </div>
        )}

        {/* Info panel below the media */}
        <div className="offer-fullscreen-info">
          {data.discountPct ? (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-l from-[#a00f2c] via-[#DC143C] to-[#ff1f4a] px-3 py-1 text-[11px] font-extrabold text-white shadow-[0_4px_12px_rgba(220,20,60,0.5)]">
              <Tag size={11} />
              {data.discountPct}%
            </div>
          ) : null}
          <h3 className="text-lg font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {data.title}
          </h3>
          {data.desc && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/75">
              {data.desc}
            </p>
          )}
          {(data.oldPrice || data.newPrice) && (
            <div className="mt-2 flex items-center justify-center gap-3">
              {data.oldPrice && (
                <span className="text-[13px] font-semibold text-white/55 line-through">
                  {data.oldPrice.toLocaleString("ar-EG")} {data.currencyAr}
                </span>
              )}
              {data.newPrice && (
                <span className="text-[15px] font-extrabold text-[#ff4d6d] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  {data.newPrice.toLocaleString("ar-EG")} {data.currencyAr}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Inline video offer card ───
   Same visual layout as the original video card, but with an inline
   sound/mute toggle button. Tapping the card (or pressing Enter/Space)
   opens the fullscreen modal; tapping the volume button toggles mute
   on the inline video WITHOUT opening fullscreen (stopPropagation).
*/
function InlineVideoOfferCard({
  i,
  offerId,
  title,
  desc,
  videoUrl: videoUrlProp,
  posterUrl: posterUrlProp,
  hasImage,
  discountPct,
  oldPrice,
  newPrice,
  currencyAr,
  onOpen,
  onKeyDown,
}: {
  i: number;
  offerId: string;
  title: string;
  desc: string;
  videoUrl: string | null;
  posterUrl: string | null;
  hasImage: boolean;
  discountPct: number | null;
  oldPrice: number | null;
  newPrice: number | null;
  currencyAr: string;
  onOpen: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  // ⚡ STREAMING ENDPOINT: Use /api/offers/[id]/video instead of raw base64.
  // The browser can stream this (Range requests, progressive buffering, caching).
  const videoSrc = videoUrlProp || `/api/offers/${offerId}/video`;
  const posterSrc =
    posterUrlProp || (hasImage ? `/api/offers/${offerId}/image` : null);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    if (!next) v.play().catch(() => {});
    setMuted(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05 }}
      className="offer-video-wrapper"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label={title}
      onKeyDown={onKeyDown}
    >
      {/* Poster or gradient fallback — visible from first paint */}
      {posterSrc ? (
        <img
          src={posterSrc}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover opacity-80"
          loading={i === 0 ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : "auto"}
        />
      ) : (
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "linear-gradient(135deg, #1a0a0e 0%, #2d0a14 40%, #4a0e1a 80%, #6b1228 100%)",
          }}
          aria-hidden
        />
      )}
      {/* Video — streaming endpoint with Range support */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover opacity-80"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-[1]" />

      {/* Top-start controls: sound toggle + fullscreen hint */}
      <div className="absolute top-2 start-2 z-[3] flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleMute}
          aria-pressed={!muted}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white/85 backdrop-blur transition hover:bg-black/70 hover:text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d6d]"
        >
          {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
        <div className="grid h-7 w-7 place-items-center rounded-full bg-black/50 backdrop-blur">
          <Maximize2 size={12} className="text-white/70" />
        </div>
      </div>

      {discountPct && (
        <div className="absolute top-2 end-2 z-[3] flex items-center gap-1 rounded-full bg-gradient-to-l from-[#a00f2c] via-[#DC143C] to-[#ff1f4a] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-[0_4px_12px_rgba(220,20,60,0.5)]">
          <Tag size={10} />
          {discountPct}%
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 z-[3] p-3.5">
        <h4 className="text-sm font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          {title}
        </h4>
        {desc && (
          <p className="mt-0.5 line-clamp-1 text-[10px] text-white/70">
            {desc}
          </p>
        )}
        {(oldPrice || newPrice) && (
          <div className="mt-1 flex items-center gap-2">
            {oldPrice && (
              <span className="text-[10px] font-semibold text-white/50 line-through">
                {oldPrice.toLocaleString("ar-EG")} {currencyAr}
              </span>
            )}
            {newPrice && (
              <span className="text-[12px] font-extrabold text-[#ff4d6d]">
                {newPrice.toLocaleString("ar-EG")} {currencyAr}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Offer Card (tap to open fullscreen) ───
   The inline video stays as a muted autoplay-loop preview (no inline unmute
   anymore) — the click handler now opens the fullscreen modal instead.
   `preload="auto"` on the inline <video> plus the HomeScreen-level fetch()
   preloader means the video bytes are warm in the browser cache, so the
   fullscreen video plays instantly on tap.
*/
function OfferCard({
  i,
  offerId,
  title,
  desc,
  imageUrl,
  videoUrl,
  hasVideo,
  hasImage,
  discountPct,
  oldPrice,
  newPrice,
  currencyAr,
  onOpen,
}: {
  i: number;
  offerId: string;
  title: string;
  desc: string;
  imageUrl: string | null;
  videoUrl: string | null;
  hasVideo: boolean;
  hasImage: boolean;
  discountPct: number | null;
  oldPrice: number | null;
  newPrice: number | null;
  currencyAr: string;
  onOpen: () => void;
}) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  // ⚡ Use hasVideo flag (not videoUrl) to decide whether to render video card.
  // videoUrl may be null (stripped base64) but hasVideo=true means it has one.
  if (hasVideo) {
    return (
      <InlineVideoOfferCard
        i={i}
        offerId={offerId}
        title={title}
        desc={desc}
        videoUrl={videoUrl}
        posterUrl={imageUrl}
        hasImage={hasImage}
        discountPct={discountPct}
        oldPrice={oldPrice}
        newPrice={newPrice}
        currencyAr={currencyAr}
        onOpen={onOpen}
        onKeyDown={handleKey}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05 }}
      className="offer-poster relative flex-shrink-0"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label={title}
      onKeyDown={handleKey}
    >
      {(imageUrl || hasImage) && (
        <img
          src={imageUrl || `/api/offers/${offerId}/image`}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
      )}
      {discountPct && (
        <div className="absolute top-2 end-2 z-20 flex items-center gap-1 rounded-full bg-gradient-to-l from-[#a00f2c] via-[#DC143C] to-[#ff1f4a] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-[0_4px_12px_rgba(220,20,60,0.5)]">
          <Tag size={10} />
          {discountPct}%
        </div>
      )}
      {/* Tap-to-expand hint */}
      <div className="absolute top-2 start-2 z-20 rounded-full bg-black/50 p-1.5 backdrop-blur">
        <Maximize2 size={12} className="text-white/70" />
      </div>
      <div className="relative z-10 flex h-full flex-col justify-end p-3.5">
        <h4 className="text-sm font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {title}
        </h4>
        {desc && (
          <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-white/75 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {desc}
          </p>
        )}
        {(oldPrice || newPrice) && (
          <div className="mt-1.5 flex items-center gap-2">
            {oldPrice && (
              <span className="text-[10.5px] font-semibold text-white/55 line-through">
                {oldPrice.toLocaleString("ar-EG")} {currencyAr}
              </span>
            )}
            {newPrice && (
              <span className="text-[12px] font-extrabold text-[#ff4d6d] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                {newPrice.toLocaleString("ar-EG")} {currencyAr}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function HomeScreen() {
  const setTab = useApp((s) => s.setTab);
  const setSelectedCategory = useApp((s) => s.setSelectedCategory);
  const selectService = useApp((s) => s.selectService);
  const services = useApp((s) => s.services);
  const branches = useApp((s) => s.branches);
  const offers = useApp((s) => s.offers);
  const settings = useSettings();
  const t = useT();
  const lang = useLang();

  const [openOffer, setOpenOffer] = useState<OfferModalData | null>(null);

  const featured = services.find((s) => s.category === "detailing") || services[0];
  const activeBranches = branches.filter((b) => b.isActive);
  // Only show active offers (API already filters by date but be defensive)
  const activeOffers = offers.filter((o) => o.isActive);

  /* Preload offer videos as soon as the offers list is available — warming
     the HTTP cache so the fullscreen video plays instantly when the user
     taps a card. Combined with `preload="auto"` on the inline <video>
     elements, this gives instant playback. Best-effort: failures (CORS /
     network) are swallowed silently — the inline <video> preload path still
     works regardless. */
  useEffect(() => {
    if (!offers || offers.length === 0) return;
    offers
      .filter((o) => o.isActive)
      .forEach((o) => {
        const u = (o as { videoUrl?: string | null }).videoUrl;
        if (typeof u === "string" && u.length > 0) {
          try {
            fetch(u, { method: "GET", cache: "force-cache" }).catch(() => {
              /* ignore — inline <video> preload still works */
            });
          } catch {
            // ignore
          }
        }
      });
  }, [offers]);

  const startBooking = () => {
    if (featured) selectService(featured);
    setTab("booking");
  };

  return (
    <div className="bg-home-strong min-h-full luxury-overlay">
      {/* HERO */}
      <section className="relative z-10 px-5 pt-9 pb-7 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Lively floating crown — framer-motion float + subtle rotation */}
          <motion.div
            animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <BrandCrown size={140} glow={false} priority />
          </motion.div>
          <h1 className="mt-3 text-xl font-extrabold tracking-tight text-white sm:text-2xl animate-fade-up-delay-1">
            <span className="crown-shine">PRESTIGE</span>{" "}
            <span className="text-white">GARAGE</span>
          </h1>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55 animate-fade-up-delay-2">
            {lang === "ar" ? settings.taglineAr : settings.tagline}
          </p>
          <p className="mt-2.5 text-sm italic text-white/50 animate-fade-up-delay-2">
            {lang === "ar" ? "صنع في ألمانيا. أتقن في مصر." : settings.bornLine}
          </p>

          {/* SONAX authorized dealer pill */}
          <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 animate-fade-up-delay-3">
            <SonaxBadge size={24} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              {lang === "ar" ? "وكيل SONAX المعتمد" : settings.poweredBy}
            </span>
          </div>
        </motion.div>
      </section>

      {/* OFFERS CAROUSEL — DIRECTLY below the logo/brand section (Task 2)
          Flow: Logo → Offers → CTA → Service Categories → Branches → Contact */}
      {activeOffers.length > 0 && (
        <section className="mt-3 relative z-10">
          <h3 className="mb-3 px-5 flex items-center gap-2 text-sm font-bold text-white/85">
            <Sparkles size={15} className="text-[#ff4d6d]" />
            {t("specialOffers")}
          </h3>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
            {activeOffers.map((o, i) => {
              const title = lang === "ar" ? o.titleAr : o.title;
              const desc = lang === "ar" ? (o.descriptionAr || o.description || "") : (o.description || "");
              const offerHasVideo = !!(o as { hasVideo?: boolean }).hasVideo;
              const offerHasImage = !!(o as { hasImage?: boolean }).hasImage;
              const videoSrc = (o as { videoUrl?: string | null }).videoUrl ?? null;
              return (
                <OfferCard
                  key={o.id}
                  i={i}
                  offerId={o.id}
                  title={title}
                  desc={desc}
                  imageUrl={o.imageUrl ?? null}
                  videoUrl={videoSrc}
                  hasVideo={offerHasVideo}
                  hasImage={offerHasImage}
                  discountPct={o.discountPct}
                  oldPrice={o.oldPrice}
                  newPrice={o.newPrice}
                  currencyAr={settings.currencyAr}
                  onOpen={() =>
                    setOpenOffer({
                      offerId: o.id,
                      title,
                      desc,
                      imageUrl: o.imageUrl ?? null,
                      videoUrl: videoSrc,
                      hasVideo: offerHasVideo,
                      hasImage: offerHasImage,
                      discountPct: o.discountPct,
                      oldPrice: o.oldPrice,
                      newPrice: o.newPrice,
                      currencyAr: settings.currencyAr,
                      lang,
                    })
                  }
                />
              );
            })}
          </div>
        </section>
      )}

      {/* CTA — slightly smaller book button */}
      <section className="mt-7 px-5 animate-fade-up-delay-3 relative z-10">
        <button
          onClick={startBooking}
          className="btn-shimmer group relative w-full overflow-hidden rounded-2xl bg-gradient-to-l from-[#a00f2c] via-[#DC143C] to-[#ff1f4a] py-3 text-sm font-bold text-white shadow-[0_10px_40px_-10px_rgba(220,20,60,0.7)] transition active:scale-[0.98]"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Crown size={18} />
            {t("bookNow")}
            <ChevronLeft size={18} className="transition group-hover:-translate-x-1" />
          </span>
        </button>
        <button
          onClick={() => { setSelectedCategory(null); setTab("services"); }}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3.5 text-sm font-semibold text-white/85 backdrop-blur transition hover:bg-white/[0.06] active:scale-[0.98]"
        >
          {t("browseServices")} ({services.length})
        </button>
      </section>

      {/* CATEGORIES GRID — premium cards with inner shadow + tint + corner badges + BIG emoji */}
      <section className="mt-7 px-5 relative z-10">
        <h3 className="mb-3 text-sm font-bold text-white/85">{t("serviceCategories")}</h3>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map((cat) => {
            const count = services.filter((s) => s.category === cat).length;
            const isPremium = PREMIUM_CATS.includes(cat);
            const isSonax = SONAX_CATS.includes(cat);
            const tint = softColor(CAT_COLOR_KEY[cat]);
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setTab("services");
                }}
                className={`cat-card-premium cat-bg-${cat} fluorescent-border group relative overflow-hidden p-4 pt-14 text-start transition active:scale-[0.98]`}
                style={
                  {
                    "--cat-tint": tint.bg,
                    "--cat-accent": tint.ring,
                    "--neon-color": tint.ring,
                    "--neon-glow": tint.bg,
                    "--neon-bright": tint.ring,
                  } as React.CSSProperties
                }
              >
                {/* BIG emoji badge in TOP-START corner — clearly visible, 32x32 / 18px font */}
                <span
                  className="emoji-badge"
                  style={
                    {
                      "--badge-bg": "rgba(0, 0, 0, 0.88)",
                      "--badge-ring": tint.ring,
                      width: "32px",
                      height: "32px",
                      fontSize: "18px",
                      bottom: "auto",
                      top: "8px",
                      insetInlineEnd: "auto",
                      insetInlineStart: "8px",
                    } as React.CSSProperties
                  }
                  aria-hidden
                >
                  {CATEGORY_EMOJI[cat]}
                </span>

                {/* Corner brand badge (28px): SONAX (partner) or Prestige crown (premium) — TOP-END */}
                <div className="absolute top-2 end-2 z-10 opacity-95">
                  {isPremium ? (
                    <BrandCrown size={28} glow={false} />
                  ) : isSonax ? (
                    <div className="service-badge-large">
                      <SonaxBadge size={28} />
                    </div>
                  ) : null}
                </div>

                {/* Title + count */}
                <div className="pe-1">
                  <span className="text-base font-extrabold text-white">
                    {lang === "ar" ? CATEGORY_LABELS[cat].ar : CATEGORY_LABELS[cat].en}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-white/45">
                  {count} {t("servicesAvail")}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* BRANCHES — horizontally scrollable compact cards with purple glow MapPin */}
      {activeBranches.length > 0 && (
        <section className="mt-7 relative z-10">
          <h3 className="mb-3 px-5 text-sm font-bold text-white/85">{t("ourBranches")}</h3>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
            {activeBranches.map((b) => {
              const addr = lang === "ar" ? (b.addressAr || b.address || "—") : (b.address || "—");
              return (
                <div
                  key={b.id}
                  className="premium-card relative w-[260px] flex-shrink-0 overflow-hidden p-4"
                  style={{ "--card-accent": "rgba(168, 85, 247, 0.3)" } as React.CSSProperties}
                >
                  <div className="flex items-start gap-3">
                    {/* Purple glow-circle MapPin icon */}
                    <div
                      className="glow-circle h-11 w-11 flex-shrink-0"
                      style={
                        {
                          "--glow-color": "rgba(168, 85, 247, 0.4)",
                          "--glow-bg": "rgba(168, 85, 247, 0.08)",
                        } as React.CSSProperties
                      }
                    >
                      <MapPin size={18} className="text-[#c084fc]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-extrabold text-white">
                        {lang === "ar" ? b.nameAr : b.name}
                      </h4>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/55">
                        {addr}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/8 pt-3">
                    {b.phone ? (
                      <a
                        href={`tel:${b.phone}`}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-[#ff4d6d] transition active:scale-95"
                        dir="ltr"
                      >
                        <Phone size={12} />
                        {b.phone}
                      </a>
                    ) : (
                      <span />
                    )}
                    {b.mapUrl && (
                      <a
                        href={b.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-full bg-[#DC143C]/12 px-2.5 py-1 text-[10px] font-bold text-[#ff4d6d] transition active:scale-95"
                      >
                        <Navigation size={11} />
                        {t("visitBranch")}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* PREMIUM ARTISTIC CONTACT CARD — with glowing circle icons */}
      <section className="mt-7 px-5 pb-6 relative z-10">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 p-5">
          {/* Gradient backdrop */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(135deg, rgba(220,20,60,0.18) 0%, rgba(0,0,0,0.4) 35%, rgba(0,0,0,0.6) 65%, rgba(220,20,60,0.10) 100%)",
            }}
            aria-hidden
          />
          {/* Decorative accent glows */}
          <div
            className="absolute -top-12 -end-12 h-32 w-32 rounded-full opacity-30 blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(220,20,60,0.6), transparent 70%)" }}
            aria-hidden
          />
          <div
            className="absolute -bottom-10 -start-10 h-28 w-28 rounded-full opacity-20 blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(255,215,0,0.4), transparent 70%)" }}
            aria-hidden
          />
          {/* Decorative diagonal lines */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden>
            <defs>
              <pattern
                id="prestige-diag"
                width="14"
                height="14"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line x1="0" y1="0" x2="0" y2="14" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#prestige-diag)" />
          </svg>

          <div className="relative">
            {/* Header line */}
            <div className="mb-4 flex items-center gap-2">
              <Crown size={14} className="text-[#ff4d6d]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                {lang === "ar" ? "تواصل معنا" : "Get in Touch"}
              </span>
              <div className="gold-divider ms-2 flex-1" />
            </div>

            <div className="space-y-3">
              {/* Working hours — gold/amber glow */}
              <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-3 backdrop-blur">
                <div
                  className="glow-circle h-11 w-11 flex-shrink-0"
                  style={
                    {
                      "--glow-color": "rgba(245, 158, 11, 0.4)",
                      "--glow-bg": "rgba(245, 158, 11, 0.08)",
                    } as React.CSSProperties
                  }
                >
                  <Clock size={18} className="text-[#fbbf24]" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-white/45">
                    {lang === "ar" ? "مواعيد العمل" : "Working Hours"}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {lang === "ar" ? settings.workingHoursAr : settings.workingHours}
                  </p>
                </div>
              </div>

              {/* Call — red glow */}
              <a
                href={`tel:${settings.phone}`}
                className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-3 backdrop-blur transition active:bg-white/8"
              >
                <div
                  className="glow-circle h-11 w-11 flex-shrink-0"
                  style={
                    {
                      "--glow-color": "rgba(220, 20, 60, 0.4)",
                      "--glow-bg": "rgba(220, 20, 60, 0.08)",
                    } as React.CSSProperties
                  }
                >
                  <Phone size={18} className="text-[#ff4d6d]" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-white/45">
                    {lang === "ar" ? "اتصل بنا" : "Call Us"}
                  </p>
                  <p className="text-sm font-semibold text-white" dir="ltr">{settings.phone}</p>
                </div>
              </a>

              {/* Address — blue glow */}
              <button
                onClick={() => setTab("contact")}
                className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-3 backdrop-blur transition active:bg-white/8"
              >
                <div
                  className="glow-circle h-11 w-11 flex-shrink-0"
                  style={
                    {
                      "--glow-color": "rgba(59, 130, 246, 0.4)",
                      "--glow-bg": "rgba(59, 130, 246, 0.08)",
                    } as React.CSSProperties
                  }
                >
                  <MapPin size={18} className="text-[#60a5fa]" />
                </div>
                <div className="flex-1 text-start">
                  <p className="text-[10px] uppercase tracking-wide text-white/45">
                    {lang === "ar" ? "العنوان" : "Address"}
                  </p>
                  <p className="line-clamp-1 text-sm font-semibold text-white">
                    {lang === "ar" ? settings.addressAr : settings.address}
                  </p>
                </div>
                <ChevronLeft size={16} className="text-white/30" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FULLSCREEN OFFER MODAL — rendered last so it overlays everything */}
      <AnimatePresence>
        {openOffer && (
          <OfferFullscreenModal
            key="offer-fullscreen"
            data={openOffer}
            onClose={() => setOpenOffer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
