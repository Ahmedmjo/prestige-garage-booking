"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  ShieldCheck,
  Thermometer,
  Sparkles,
  Droplets,
  Plus,
  Waves,
} from "lucide-react";
import type { ServiceCategory } from "@/lib/types";
import { useLanguage } from "@/components/LanguageProvider";

const CATEGORY_ICONS: Record<ServiceCategory, React.ComponentType<{ className?: string }>> = {
  protection: ShieldCheck,
  thermal: Thermometer,
  detailing: Sparkles,
  polish: Waves,
  wash: Droplets,
  extra: Plus,
};

interface ServiceItem {
  id: string;
  nameAr: string;
  name?: string | null;
  price: number | null;
  hasVariants: boolean;
}

interface ServiceGroup {
  category: ServiceCategory;
  label: { ar: string; en: string };
  items: ServiceItem[];
}

export default function ServicesAccordion({
  groups,
  currencyAr,
}: {
  groups: ServiceGroup[];
  currencyAr: string;
}) {
  // أول قسم مفتوح افتراضيًا، الباقي مقفول — بدل ما كل حاجة تكون على الشاشة مرة واحدة
  const [openCategory, setOpenCategory] = useState<string | null>(
    groups[0]?.category ?? null
  );
  const { lang } = useLanguage();
  const availableLabel = lang === "ar" ? "خدمة متاحة" : "services available";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      {groups.map((group) => {
        const Icon = CATEGORY_ICONS[group.category];
        const isOpen = openCategory === group.category;
        return (
          <div
            key={group.category}
            className="overflow-hidden rounded-2xl border border-border/60 bg-card/40"
          >
            <button
              type="button"
              onClick={() => setOpenCategory(isOpen ? null : group.category)}
              className="flex w-full items-center justify-between gap-4 p-5 text-right"
              aria-expanded={isOpen}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cinema-crimson)]/10 text-[var(--cinema-crimson)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-base font-bold text-foreground">
                    {lang === "ar" ? group.label.ar : group.label.en}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {group.items.length} {availableLabel}
                  </span>
                </span>
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <ul className="space-y-1 border-t border-border/40 px-5 pb-5 pt-3 text-sm text-muted-foreground">
                    {group.items.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-2 py-1.5"
                      >
                        <span>{lang === "ar" ? s.nameAr : s.name || s.nameAr}</span>
                        {!s.hasVariants && s.price != null && (
                          <span className="shrink-0 text-xs font-bold text-foreground/80">
                            {s.price} {currencyAr}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
