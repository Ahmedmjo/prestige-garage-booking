"use client";

import { Menu, Languages } from "lucide-react";
import { useApp } from "@/lib/store";
import { BrandCrown } from "@/components/brand/Logo";
import { useState } from "react";
import { NavMenu } from "./NavMenu";
import { Drawer } from "./Drawer";
import { useLang } from "@/lib/use-lang";

export function Header() {
  const [open, setOpen] = useState(false);
  const setTab = useApp((s) => s.setTab);
  const lang = useLang();
  const toggleLang = useApp((s) => s.toggleLang);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/8 bg-background/88 backdrop-blur-xl pt-safe">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <button
            aria-label="Menu"
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-xl text-white/80 hover:bg-white/5 active:scale-95 transition"
          >
            <Menu size={20} />
          </button>

          <button
            onClick={() => setTab("home")}
            className="flex items-center gap-2"
            aria-label="Prestige Garage — Home"
          >
            <BrandCrown size={30} glow={false} />
            <div className="flex flex-col leading-none">
              <span className="text-[13px] font-extrabold tracking-tight text-white">
                <span className="crown-shine">PRESTIGE</span> GARAGE
              </span>
              <span className="text-[8px] uppercase tracking-[0.22em] text-white/40">
                {lang === "ar" ? "العناية الفاخرة" : "Premium Car Care"}
              </span>
            </div>
          </button>

          <button
            onClick={toggleLang}
            aria-label="Toggle language"
            className="lang-toggle"
          >
            <Languages size={13} />
            {lang === "ar" ? "EN" : "ع"}
          </button>
        </div>
        <div className="h-0.5 w-full bg-gradient-to-l from-[#DC143C]/0 via-[#DC143C]/70 to-[#DC143C]/0" />
      </header>

      <Drawer open={open} onOpenChange={setOpen} side="right">
        <NavMenu onNavigate={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
