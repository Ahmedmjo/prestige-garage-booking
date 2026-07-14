"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { HomeScreen } from "@/components/home/HomeScreen";
import { ContactScreen } from "@/components/home/ContactScreen";
import { AboutScreen } from "@/components/home/AboutScreen";
import { ServicesScreen } from "@/components/services/ServicesScreen";
import { BookingScreen } from "@/components/booking/BookingScreen";
import { BookingsScreen } from "@/components/booking/BookingsScreen";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { BrandCrown } from "@/components/brand/Logo";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { useLangEffect, useLang } from "@/lib/use-lang";

export default function Page() {
  const tab = useApp((s) => s.tab);
  const adminMode = useApp((s) => s.adminMode);
  const adminPin = useApp((s) => s.adminPin);
  const loadServices = useApp((s) => s.loadServices);
  const loadSettings = useApp((s) => s.loadSettings);
  const loadBranches = useApp((s) => s.loadBranches);
  const loadOffers = useApp((s) => s.loadOffers);
  const lang = useLang();
  useLangEffect();

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    loadServices();
    loadSettings();
    loadBranches();
    loadOffers();
    const t = setTimeout(() => setShowSplash(false), 2800);
    return () => clearTimeout(t);
  }, [loadServices, loadSettings, loadBranches, loadOffers]);

  // ===== Splash screen — cinematic inside-out reveal (NO glow as requested) =====
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-home-strong">
        {/* Cinematic inside-out logo reveal — emerges small + blurred, expands to full size */}
        <div className="splash-logo-cinematic">
          <BrandCrown size={160} glow={false} priority />
        </div>

        {/* Title with letter-spacing glow animation (starts at 0.8s) */}
        <h1 className="splash-title-glow mt-5 text-center text-2xl font-extrabold text-white">
          <span className="crown-shine">PRESTIGE</span> GARAGE
        </h1>
        <p className="mt-1.5 text-center text-[10px] uppercase tracking-[0.34em] text-white/45">
          {lang === "ar" ? "العناية الفاخرة" : "Premium Car Care"}
        </p>

        {/* Tagline rises from bottom to top (starts at 1.2s delay) */}
        <p className="splash-tagline-rise absolute bottom-10 text-[10px] italic text-white/40">
          {lang === "ar" ? "صنع في ألمانيا. أتقن في مصر." : "Born in Germany. Mastered in Egypt."}
        </p>
      </div>
    );
  }

  // ===== Admin mode =====
  if (adminMode) {
    if (!adminPin) {
      return <AdminLogin />;
    }
    return <AdminDashboard />;
  }

  // ===== Customer app =====
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {tab === "home" && <HomeScreen />}
            {tab === "services" && <ServicesScreen />}
            {tab === "booking" && <BookingScreen />}
            {tab === "bookings" && <BookingsScreen />}
            {tab === "contact" && <ContactScreen />}
            {tab === "about" && <AboutScreen />}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}

