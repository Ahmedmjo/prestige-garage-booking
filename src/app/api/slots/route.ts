import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { cairoToday, cairoCurrentHour } from "@/lib/timezone";

// GET /api/slots?date=YYYY-MM-DD&category=wash
// Returns available time slots with remaining capacity.
// Logic:
//  - Generate slots 10:00 → 21:00 hourly
//  - For today (CAIRO TIME), hide slots whose time has already passed
//  - For each slot, count existing pending/accepted bookings
//  - capacity = wash ? washSlotCapacity : slotCapacity
//  - If slotControlEnabled is false → all slots available (unlimited)
//  - remaining = capacity - count
//
// CRITICAL: "today" and "current hour" are computed in Africa/Cairo
// timezone (using Intl.DateTimeFormat), not the server's local timezone.
// Vercel servers run UTC, so without this fix, Egyptian customers booking
// after 10pm would see today's date as tomorrow and all today's slots as
// either past or future incorrectly.
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
    for (let h = openHour; h < closeHour; h++) allSlots.push(`${String(h).padStart(2, "0")}:00`);

    // filter past times if date is today (CAIRO TIME)
    const todayStr = cairoToday();
    const isToday = date === todayStr;
    const currentHour = cairoCurrentHour();

    const slots = allSlots.map((slot) => {
      const hour = parseInt(slot.split(":")[0], 10);
      const isPast = isToday && hour <= currentHour;
      return { time: slot, isPast };
    });

    // if slot control disabled, all non-past slots are fully available
    if (!slotControlEnabled) {
      const result = slots
        .filter((s) => !s.isPast)
        .map((s) => ({ time: s.time, remaining: 999, capacity: 0, full: false }));
      return NextResponse.json({ slots: result, capacity: 0, controlEnabled: false });
    }

    // fetch existing bookings count per slot for this date.
    // Note: schema statuses are "pending" | "accepted" | "in_progress" | "completed" | "cancelled".
    // "confirmed" was a legacy name — using it would skip accepted bookings and show phantom availability.
    const bookings = await db.booking.findMany({
      where: {
        date,
        status: { in: ["pending", "accepted"] },
      },
      select: { time: true, service: { select: { category: true } } },
    });

    // For wash slots, count only wash-category bookings.
    // For non-wash slots, count only non-wash bookings.
    // (This lets wash=2cars and others=1car coexist at the same time.)
    const countForCategory = (slot: string) => {
      return bookings.filter((b) => {
        const sameSlot = b.time === slot;
        if (isWash) return sameSlot && b.service.category === "wash";
        return sameSlot && b.service.category !== "wash";
      }).length;
    };

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
