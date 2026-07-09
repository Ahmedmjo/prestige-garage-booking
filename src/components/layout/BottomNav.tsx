"use client";

import { Home, Sparkles, CalendarPlus, CalendarCheck, Phone } from "lucide-react";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/use-lang";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const tab = useApp((s) => s.tab);
  const setTab = useApp((s) => s.setTab);
  const t = useT();

  const ITEMS = [
    { key: "home",     label: t("home"),     icon: Home },
    { key: "services", label: t("services"), icon: Sparkles },
    { key: "booking",  label: t("booking"),  icon: CalendarPlus },
    { key: "bookings", label: t("bookings"), icon: CalendarCheck },
    { key: "contact",  label: t("contact"),  icon: Phone },
  ] as const;

  return (
    <nav
      className="sticky bottom-0 z-40 pb-safe"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,0,3,0.82) 0%, rgba(5,0,2,0.97) 100%)",
        borderTop: "1px solid rgba(220,20,60,0.22)",
        boxShadow:
          "0 -1px 0 rgba(220,20,60,0.08), 0 -8px 24px rgba(220,20,60,0.06)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      {/* Top glow line — matches logo crimson */}
      <div
        style={{
          height: "1px",
          width: "100%",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(220,20,60,0.55) 30%, #DC143C 50%, rgba(220,20,60,0.55) 70%, transparent 100%)",
          boxShadow: "0 0 12px 1px rgba(220,20,60,0.35)",
        }}
      />

      <div className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((it) => {
          const active = tab === it.key;
          const Icon = it.icon;
          return (
            <button
              key={it.key}
              onClick={() => setTab(it.key)}
              className="relative flex flex-col items-center gap-0.5 py-2.5 transition active:scale-90"
              aria-current={active ? "page" : undefined}
            >
              {/* Active indicator dot above icon */}
              {active && (
                <span
                  className="absolute top-0 h-0.5 w-10 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #DC143C, transparent)",
                    boxShadow: "0 0 10px 2px rgba(220,20,60,0.55)",
                  }}
                />
              )}

              {/* Icon with glow when active */}
              <span
                className="relative grid place-items-center"
                style={
                  active
                    ? {
                        filter:
                          "drop-shadow(0 0 6px rgba(220,20,60,0.7)) drop-shadow(0 0 12px rgba(220,20,60,0.35))",
                      }
                    : undefined
                }
              >
                <Icon
                  size={21}
                  className={cn(
                    "transition",
                    active ? "text-[#ff4d6d]" : "text-white/40"
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </span>

              {/* Label */}
              <span
                className={cn(
                  "text-[9.5px] font-semibold transition leading-none",
                  active ? "text-[#ff8099]" : "text-white/35"
                )}
                style={
                  active
                    ? { textShadow: "0 0 8px rgba(220,20,60,0.5)" }
                    : undefined
                }
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
