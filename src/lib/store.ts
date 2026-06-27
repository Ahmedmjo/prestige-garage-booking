"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ServiceItem, ServiceVariant, SiteSettings, BookingItem, BranchItem, OfferItem } from "./types";
import type { Lang } from "./i18n";

interface AppState {
  // language
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;

  // settings
  settings: SiteSettings | null;
  setSettings: (s: SiteSettings) => void;
  loadSettings: () => Promise<void>;

  // services
  services: ServiceItem[];
  setServices: (s: ServiceItem[]) => void;
  loadServices: () => Promise<void>;

  // ui state (current tab/view)
  tab: "home" | "services" | "booking" | "bookings" | "contact" | "about";
  setTab: (t: AppState["tab"]) => void;

  // selected service + variant for booking flow
  selectedService: ServiceItem | null;
  selectService: (s: ServiceItem | null) => void;
  selectedVariant: ServiceVariant | null;
  selectVariant: (v: ServiceVariant | null) => void;

  // admin auth (PIN kept in localStorage)
  adminPin: string | null;
  setAdminPin: (p: string | null) => void;
  adminMode: boolean;
  setAdminMode: (v: boolean) => void;

  // my bookings (by phone)
  myPhone: string | null;
  setMyPhone: (p: string | null) => void;
  myBookings: BookingItem[];
  setMyBookings: (b: BookingItem[]) => void;
  loadMyBookings: (phone: string) => Promise<void>;

  // last booking ref (for confirmation screen)
  lastBooking: BookingItem | null;
  setLastBooking: (b: BookingItem | null) => void;

  // branches
  branches: BranchItem[];
  setBranches: (b: BranchItem[]) => void;
  loadBranches: () => Promise<void>;

  // offers
  offers: OfferItem[];
  setOffers: (o: OfferItem[]) => void;
  loadOffers: () => Promise<void>;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      lang: "ar",
      setLang: (l) => set({ lang: l }),
      toggleLang: () => set((s) => ({ lang: s.lang === "ar" ? "en" : "ar" })),

      settings: null,
      setSettings: (s) => set({ settings: s }),
      loadSettings: async () => {
        try {
          const res = await fetch("/api/settings");
          const data = await res.json();
          if (data.settings) set({ settings: data.settings });
        } catch {
          /* ignore */
        }
      },

      services: [],
      setServices: (s) => set({ services: s }),
      loadServices: async () => {
        try {
          const res = await fetch("/api/services");
          const data = await res.json();
          if (data.services) set({ services: data.services });
        } catch {
          /* ignore */
        }
      },

      tab: "home",
      setTab: (t) => set({ tab: t }),

      selectedService: null,
      selectService: (s) => set({ selectedService: s, selectedVariant: null }),
      selectedVariant: null,
      selectVariant: (v) => set({ selectedVariant: v }),

      adminPin: null,
      setAdminPin: (p) => set({ adminPin: p }),
      adminMode: false,
      setAdminMode: (v) => set({ adminMode: v }),

      myPhone: null,
      setMyPhone: (p) => set({ myPhone: p }),
      myBookings: [],
      setMyBookings: (b) => set({ myBookings: b }),
      loadMyBookings: async (phone) => {
        try {
          const res = await fetch(`/api/bookings?phone=${encodeURIComponent(phone)}`);
          const data = await res.json();
          if (data.bookings) set({ myBookings: data.bookings });
        } catch {
          /* ignore */
        }
      },

      lastBooking: null,
      setLastBooking: (b) => set({ lastBooking: b }),

      branches: [],
      setBranches: (b) => set({ branches: b }),
      loadBranches: async () => {
        try {
          const res = await fetch("/api/branches");
          const data = await res.json();
          if (data.branches) set({ branches: data.branches });
        } catch {
          /* ignore */
        }
      },

      offers: [],
      setOffers: (o) => set({ offers: o }),
      loadOffers: async () => {
        try {
          const res = await fetch("/api/offers");
          const data = await res.json();
          if (data.offers) set({ offers: data.offers });
        } catch {
          /* ignore */
        }
      },
    }),
    {
      name: "prestige-garage",
      partialize: (s) => ({
        lang: s.lang,
        adminPin: s.adminPin,
        adminMode: s.adminMode,
        myPhone: s.myPhone,
      }),
    }
  )
);
