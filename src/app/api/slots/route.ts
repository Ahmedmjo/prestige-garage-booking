import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

// GET /api/slots?date=YYYY-MM-DD&category=wash
//
// Slot availability rules:
// 1. Generate hourly slots from openHour to closeHour (admin-configurable)
// 2. For today: hide any slot that has already started or is within 15 min
//    of starting (you can't book a slot that's about to end or has ended)
// 3. Count existing pending+accepted bookings per slot per category
// 4. If slot is full (remaining=0): mark as full, customer can't select it
// 5. If slotControlEnabled=false: unlimited capacity (all slots available)
//
// TIMEZONE: All comparisons use Cairo time (Africa/Cairo) via Intl.DateTimeFormat.
// Vercel servers run UTC, so without this fix, slots after 10pm Cairo showed
// as available "tomorrow" and past slots weren't hidden correctly.
export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    const category = req.nextUrl.searchParams.get("category") || "other";
    if (!date) {
      return NextResponse.json({ error: "date required" }, { status: 400 });
    }

    const settings = await getSettings();
    const slotControlEnabled = settings.slotControlEnabled !== "false";
    const isWash = category === "wash";
    const capacity = isWash
      ? Number(settings.washSlotCapacity) || 2
      : Number(settings.slotCapacity) || 1;

    // generate slots based on admin-controllable working hours
    const openHour = Number(settings.openHour) || 10;
    const closeHour = Number(settings.closeHour) || 22;
    const allSlots: string[] = [];
    for (let h = openHour; h < closeHour; h++)
      allSlots.push(`${String(h).padStart(2, "0")}:00`);

    // ⚡ CAIRO TIMEZONE — compute "today" and "current time" in Africa/Cairo
    // Vercel servers run UTC. Without this, a 11pm Cairo booking saw "tomorrow"
    // as today, and past slots weren't hidden correctly.
    const cairoFmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric", month: "2-digit", day: "2-digit",
    });
    const cairoTimeFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Cairo",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    const now = new Date();
    const cairoToday = cairoFmt.format(now); // YYYY-MM-DD
    const cairoTimeParts = cairoTimeFmt.formatToParts(now);
    const cairoHour = parseInt(
      cairoTimeParts.find((p) => p.type === "hour")?.value || "0",
      10,
    );
    const cairoMinute = parseInt(
      cairoTimeParts.find((p) => p.type === "minute")?.value || "0",
      10,
    );
    const cairoCurrentMinutes = cairoHour * 60 + cairoMinute;

    const isToday = date === cairoToday;

    // ⚡ PAST SLOT DETECTION — a slot is "past" if:
    //   - It's today AND
    //   - The slot's start time has already passed (hour <= current hour)
    //   - OR the slot starts within the next 15 minutes (too late to book)
    //     e.g. if current time is 14:50, the 15:00 slot is blocked because
    //     by the time the customer arrives, the slot has already started.
    const BUFFER_MINUTES = 15;

    const slots = allSlots.map((slot) => {
      const hour = parseInt(slot.split(":")[0], 10);
      const slotMinutes = hour * 60; // slots are at :00, so minutes = 0
      // isPast = slot already started OR starts within 15 minutes
      const isPast =
        isToday &&
        (slotMinutes + BUFFER_MINUTES <= cairoCurrentMinutes ||
          slotMinutes <= cairoCurrentMinutes);
      return { time: slot, isPast };
    });

    // if slot control disabled, all non-past slots are fully available
    if (!slotControlEnabled) {
      const result = slots
        .filter((s) => !s.isPast)
        .map((s) => ({ time: s.time, remaining: 999, capacity: 0, full: false }));
      return NextResponse.json({ slots: result, capacity: 0, controlEnabled: false });
    }

    // fetch existing bookings count per slot for this date
    const bookings = await db.booking.findMany({
      where: {
        date,
        status: { in: ["pending", "accepted"] },
      },
      select: { time: true, service: { select: { category: true } } },
    });

    const countForCategory = (slot: string) => {
      return bookings.filter((b) => {
        const sameSlot = b.time === slot;
        if (isWash) return sameSlot && b.service.category === "wash";
        return sameSlot && b.service.category !== "wash";
      }).length;
    };

    // ⚡ FULL SLOT DETECTION — if remaining=0, mark as full
    // The frontend will show these slots as disabled with "مكتمل" label
    // and the customer cannot select them.
    const result = slots
      .filter((s) => !s.isPast)
      .map((s) => {
        const count = countForCategory(s.time);
        const remaining = Math.max(0, capacity - count);
        return {
          time: s.time,
          remaining,
          capacity,
          full: remaining <= 0,
        };
      });

    return NextResponse.json({ slots: result, capacity, controlEnabled: true });
  } catch (e) {
    console.error("GET /api/slots error", e);
    return NextResponse.json({ slots: [], error: "failed" }, { status: 500 });
  }
}
