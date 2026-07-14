"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, Delete, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { adminLogin } from "@/lib/api";
import { BrandCrown } from "@/components/brand/Logo";

export function AdminLogin() {
  const setAdminPin = useApp((s) => s.setAdminPin);
  const setAdminMode = useApp((s) => s.setAdminMode);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  // ref mirrors pin to avoid stale closures when typing fast
  const pinRef = useRef("");

  const runSubmit = useCallback(async (value: string) => {
    setLoading(true);
    const ok = await adminLogin(value);
    setLoading(false);
    if (ok) {
      setAdminPin(value);
      setAdminMode(true);
      toast.success("مرحباً بك في لوحة التحكم");
    } else {
      toast.error("رمز غير صحيح");
      pinRef.current = "";
      setPin("");
    }
  }, [setAdminPin, setAdminMode]);

  // single source of truth for keypress — uses ref so rapid taps don't lose digits
  const handlePress = useCallback((d: string) => {
    if (loading) return;
    const next = (pinRef.current + d).slice(0, 4);
    pinRef.current = next;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => runSubmit(next), 180);
    }
  }, [loading, runSubmit]);

  const backspace = useCallback(() => {
    const next = pinRef.current.slice(0, -1);
    pinRef.current = next;
    setPin(next);
  }, []);

  const manualSubmit = useCallback(() => {
    if (pinRef.current.length !== 4) {
      toast.error("الرمز مكوّن من ٤ أرقام");
      return;
    }
    runSubmit(pinRef.current);
  }, [runSubmit]);

  return (
    <div className="min-h-screen bg-prestige-radial flex flex-col items-center justify-center px-6 py-10">
      <motion.button
        onClick={() => setAdminMode(false)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-5 right-5 flex items-center gap-1 text-xs text-white/50 hover:text-white transition"
      >
        خروج
        <ArrowRight size={14} />
      </motion.button>

      <BrandCrown size={72} />

      <div className="mt-4 flex items-center gap-2">
        <ShieldCheck size={18} className="text-[#ff4d6d]" />
        <h1 className="text-lg font-extrabold text-white">لوحة تحكم الأدمن</h1>
      </div>
      <p className="mt-1 text-xs text-white/45">أدخل الرمز السري المكوّن من ٤ أرقام</p>

      {/* PIN dots */}
      <div className="mt-6 flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition ${
              i < pin.length
                ? "border-[#DC143C] bg-[#DC143C] shadow-[0_0_10px_rgba(220,20,60,0.6)]"
                : "border-white/20"
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="mt-8 grid w-full max-w-xs grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            onClick={() => handlePress(d)}
            disabled={loading}
            className="grid h-16 place-items-center rounded-2xl border border-white/8 bg-white/[0.03] text-xl font-bold text-white transition hover:bg-white/[0.08] active:scale-95 disabled:opacity-50"
          >
            {d}
          </button>
        ))}
        <button
          onClick={backspace}
          disabled={loading}
          className="grid h-16 place-items-center rounded-2xl border border-white/8 bg-white/[0.03] text-white/60 transition hover:bg-white/[0.08] active:scale-95 disabled:opacity-50"
        >
          <Delete size={20} />
        </button>
        <button
          onClick={() => handlePress("0")}
          disabled={loading}
          className="grid h-16 place-items-center rounded-2xl border border-white/8 bg-white/[0.03] text-xl font-bold text-white transition hover:bg-white/[0.08] active:scale-95 disabled:opacity-50"
        >
          0
        </button>
        <button
          onClick={manualSubmit}
          disabled={loading || pin.length !== 4}
          className="grid h-16 place-items-center rounded-2xl bg-gradient-to-l from-[#a00f2c] to-[#ff1f4a] text-white transition active:scale-95 disabled:opacity-40"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={22} className="rotate-180" />}
        </button>
      </div>

      <p className="mt-8 text-center text-[10px] text-white/30">
        
      </p>
    </div>
  );
}
