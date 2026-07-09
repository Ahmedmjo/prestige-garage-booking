"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandCrown } from "@/components/brand/Logo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Prestige Garage PWA install prompt.
 *
 * Requirements for `beforeinstallprompt` to fire on Chrome/Android:
 *   1. Valid manifest.json (✓)
 *   2. Registered Service Worker (✓ — see public/sw.js + ServiceWorkerRegister)
 *   3. Served over HTTPS (✓ on Vercel)
 *
 * The prompt appears 3 seconds after the event fires.
 * Once dismissed/accepted, it won't show again for 30 days (localStorage).
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const lastDismissed = Number(
      localStorage.getItem("install-prompt-dismissed") || 0,
    );
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (lastDismissed && Date.now() - lastDismissed < thirtyDays) return;

    // If already running as PWA, don't show
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as Navigator & { standalone?: boolean }).standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
      setVisible(false);
      localStorage.setItem("install-prompt-dismissed", String(Date.now()));
    }
    setDeferred(null);
  };

  const onDismiss = () => {
    setVisible(false);
    localStorage.setItem("install-prompt-dismissed", String(Date.now()));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-sm"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-[#DC143C]/40 bg-[#0a0a0b]/95 p-4 shadow-[0_8px_32px_rgba(220,20,60,0.25)] backdrop-blur-xl">
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/5 text-white/60 hover:bg-white/10"
            >
              <X size={14} />
            </button>
            <div className="flex items-start gap-3">
              <BrandCrown size={44} glow={false} />
              <div className="flex-1">
                <h3 className="text-sm font-extrabold text-white">
                  ثبّت Prestige Garage
                </h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-white/65">
                  أضف التطبيق لشاشتك الرئيسية للوصول السريع وحجز موعدك بنقرة واحدة.
                </p>
                <button
                  onClick={onInstall}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-l from-[#a00f2c] via-[#DC143C] to-[#ff1f4a] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(220,20,60,0.5)] active:scale-95"
                >
                  <Download size={12} />
                  تثبيت
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Registers /sw.js — required for beforeinstallprompt to fire. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // skip in dev
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* silent */
    });
  }, []);
  return null;
}
