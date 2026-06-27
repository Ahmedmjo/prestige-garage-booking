"use client";

import { useState } from "react";
import { ChevronDown, Check, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ServiceItem, ServiceVariant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/components/services/ServicesScreen";

interface VariantSelectorProps {
  service: ServiceItem;
  selectedVariant: ServiceVariant | null;
  onSelect: (v: ServiceVariant | null) => void;
  /** compact = inline accordion (closes on select); full = always-expanded (booking step) */
  variant?: "compact" | "full";
}

/**
 * Accordion variant selector — matches the reference HTML pattern:
 * - Closed: shows a "اختر النوع / Tap for prices" pill
 * - Open: lists variant options; selected gets red border + red-tint bg
 * - Selecting closes the accordion and keeps the selection highlighted
 */
export function VariantSelector({
  service,
  selectedVariant,
  onSelect,
  variant = "compact",
}: VariantSelectorProps) {
  const variants = service.variants.filter((v) => v.isActive);
  if (variants.length === 0) return null;

  const note = service.priceNote || "اختر النوع";

  // Full (always open) — used in booking step
  if (variant === "full") {
    return (
      <div className="variants-panel">
        <div className="mb-2 flex items-center gap-1.5 px-1">
          <Tag size={12} className="text-[#ff4d6d]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff4d6d]">
            {note}
          </span>
        </div>
        {variants.map((v) => {
          const active = selectedVariant?.id === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(active ? null : v)}
              className={cn("variant-option w-full text-right", active && "selected")}
            >
              <span className="flex items-center gap-2">
                {active && <Check size={14} className="text-[#ff4d6d]" />}
                <span className="variant-name">{v.nameAr}</span>
              </span>
              <span className="variant-price">{formatPrice(v.price, "ج.م")}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact accordion — closes on select
  return (
    <CompactAccordion
      service={service}
      selectedVariant={selectedVariant}
      onSelect={onSelect}
      note={note}
    />
  );
}

function CompactAccordion({
  service,
  selectedVariant,
  onSelect,
  note,
}: {
  service: ServiceItem;
  selectedVariant: ServiceVariant | null;
  onSelect: (v: ServiceVariant | null) => void;
  note: string;
}) {
  const [open, setOpen] = useState(false);
  const variants = service.variants.filter((v) => v.isActive);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-right transition",
          selectedVariant
            ? "border-[#DC143C]/50 bg-[#DC143C]/8"
            : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
        )}
      >
        <span className="flex items-center gap-1.5">
          <ChevronDown
            size={14}
            className={cn("text-[#ff4d6d] transition", open && "rotate-180")}
          />
          {selectedVariant ? (
            <span className="text-xs font-bold text-white">
              {selectedVariant.nameAr} ·{" "}
              <span className="text-[#ff4d6d]">
                {formatPrice(selectedVariant.price, "ج.م")}
              </span>
            </span>
          ) : (
            <span className="price-note">{note}</span>
          )}
        </span>
        <span className="text-[10px] text-white/40">{variants.length} خيارات</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="variants-panel mt-2">
              {variants.map((v) => {
                const active = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      onSelect(active ? null : v);
                      setOpen(false); // close on select
                    }}
                    className={cn(
                      "variant-option w-full text-right",
                      active && "selected"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {active && <Check size={14} className="text-[#ff4d6d]" />}
                      <span className="variant-name">{v.nameAr}</span>
                    </span>
                    <span className="variant-price">
                      {formatPrice(v.price, "ج.م")}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
