"use client";

import { motion } from "framer-motion";
import { BrandCrown, SonaxBadge } from "@/components/brand/Logo";
import { useApp } from "@/lib/store";
import { useSettings } from "@/lib/use-settings";
import { useT, useLang } from "@/lib/use-lang";

export function AboutScreen() {
  const settings = useSettings();
  const t = useT();
  const lang = useLang();

  const valueProps = [
    { emoji: "🇩🇪", title: t("germanTech"), sub: t("sonaxProducts") },
    { emoji: "🏆", title: t("expertTeam"), sub: t("trainedPros") },
    { emoji: "🛡️", title: t("guaranteedResults"), sub: t("satisfactionPromise") },
    { emoji: "⭐", title: t("premiumService"), sub: t("luxuryFocus") },
  ];

  return (
    <div className="min-h-full bg-home-strong luxury-overlay pb-8">
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 mt-6 rounded-3xl border border-white/8 bg-[#0f0f11] p-6 text-center"
      >
        <BrandCrown size={84} glow={false} />
        <h2 className="mt-3 text-2xl font-extrabold tracking-wide text-white">
          PRESTIGE GARAGE
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/60 max-w-sm mx-auto">
          {lang === "ar" ? settings.aboutAr || t("aboutDesc") : settings.aboutEn || t("aboutDesc")}
        </p>
        {/* SONAX badge */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/8 px-4 py-2">
          <SonaxBadge size={30} />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FFD700]">
            {t("authorizedDealer")}
          </span>
        </div>
      </motion.div>

      {/* Value props 2x2 grid */}
      <div className="mx-5 mt-5 grid grid-cols-2 gap-3">
        {valueProps.map((vp, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="value-prop"
          >
            <div className="vp-emoji">{vp.emoji}</div>
            <h4>{vp.title}</h4>
            <p>{vp.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Partners card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mx-5 mt-5 rounded-3xl border border-white/8 bg-gradient-to-b from-[#1a0a0d] to-[#0f0f11] p-6 text-center"
      >
        <div className="flex justify-center mb-3">
          <SonaxBadge size={64} />
        </div>
        <p className="text-sm font-bold text-white">
          {t("madeInGermany")}
        </p>
        <div className="mt-3 inline-block rounded-full bg-[#DC143C] px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
          {t("authorizedDealer")}
        </div>
      </motion.div>

      <p className="mt-6 text-center text-[10px] text-white/30">
        © {new Date().getFullYear()} Prestige Garage · {lang === "ar" ? "صنع في ألمانيا. أتقن في مصر." : settings.bornLine}
      </p>
    </div>
  );
}
