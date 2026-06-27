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
    { key: "home", label: t("home"), icon: Home },
    { key: "services", label: t("services"), icon: Sparkles },
    { key: "booking", label: t("booking"), icon: CalendarPlus },
    { key: "bookings", label: t("bookings"), icon: CalendarCheck },
    { key: "contact", label: t("contact"), icon: Phone },
  ] as const;

  return (
    <nav className="sticky bottom-0 z-40 border-t border-white/8 bg-background/92 backdrop-blur-xl pb-safe">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((it) => {
          const active = tab === it.key;
          const Icon = it.icon;
          return (
            <button
              key={it.key}
              onClick={() => setTab(it.key)}
              className="relative flex flex-col items-center gap-1 py-2.5"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span
                  className="absolute -top-px h-0.5 w-8 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, transparent, #DC143C, transparent)",
                    boxShadow: "0 0 10px rgba(220,20,60,0.6)",
                  }}
                />
              )}
              <Icon
                size={20}
                className={cn("transition", active ? "text-[#ff4d6d]" : "text-white/55")}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition",
                  active ? "text-white" : "text-white/50"
                )}
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
