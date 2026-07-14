'use client';

import { useState, useEffect, useRef } from 'react';
import { Smartphone, X } from 'lucide-react';

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    // Check if already installed or dismissed
    if (localStorage.getItem('prestige-installed') === 'true') return;
    
    // Check if running as PWA already
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((navigator as any).standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('prestige-installed', 'true');
      setShow(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    localStorage.setItem('prestige-installed', 'true');
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('prestige-installed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#DC143C] to-[#8B0A1F] p-3 shadow-lg">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Smartphone size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">تثبيت التطبيق</p>
          <p className="text-[11px] text-white/80">ثبّته على شاشتك الرئيسية</p>
        </div>
        <button onClick={handleInstall} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#DC143C]">
          تثبيت
        </button>
        <button onClick={handleDismiss} className="text-white/60 hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
