import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

function genRef(): string {
  const part = () => randomBytes(3).toString("hex").slice(0, 4).toUpperCase();
  return `PG-${part()}-${part()}`;
}

// GET /api/bookings?phone=... -> list bookings for a phone
export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get("phone");
    if (phone) {
      const bookings = await db.booking.findMany({
        where: { phone: phone.trim() },
        include: { service: { include: { variants: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ bookings });
    }
    return NextResponse.json({ bookings: [] });
  } catch (e) {
    console.error("GET /api/bookings error", e);
    return NextResponse.json({ bookings: [], error: "failed" }, { status: 500 });
  }
}

// POST -> create a booking (supports variantId)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName, phone, carModel, carPlate, carType, carBrand, branchId,
      serviceId, variantId, date, time, notes, address,
    } = body;

    // carModel is OPTIONAL; carBrand + carType are required (enforced client-side too)
    if (!customerName || !phone || !carBrand || !carType || !serviceId || !date || !time) {
      return NextResponse.json(
        { error: "missing_fields", message: "الرجاء إكمال جميع الحقول المطلوبة" },
        { status: 400 }
      );
    }

    const service = await db.service.findUnique({
      where: { id: serviceId },
      include: { variants: true },
    });
    if (!service || !service.isActive) {
      return NextResponse.json({ error: "invalid_service" }, { status: 400 });
    }

    // If service has variants, a variant must be selected
    let variant: typeof service.variants[number] | null = null;
    let totalPrice = service.price;
    let variantName: string | null = null;
    if (service.hasVariants) {
      if (!variantId) {
        return NextResponse.json(
          { error: "variant_required", message: "الرجاء اختيار نوع الخدمة" },
          { status: 400 }
        );
      }
      variant = service.variants.find((v) => v.id === variantId && v.isActive) ?? null;
      if (!variant) {
        return NextResponse.json({ error: "invalid_variant" }, { status: 400 });
      }
      totalPrice = variant.price;
      variantName = variant.nameAr || variant.name;
    }

    // Capacity check: wash allows N cars, others allow M cars (admin-configurable)
    const settings = await getSettings().catch(() => ({ slotControlEnabled: "false" } as any));
    const slotControlEnabled = settings.slotControlEnabled !== "false";
    if (slotControlEnabled) {
      try {
        const isWash = service.category === "wash";
        const capacity = isWash
          ? Number(settings.washSlotCapacity) || 2
          : Number(settings.slotCapacity) || 1;
        // Note: schema defines statuses "pending" | "accepted" | "in_progress" | "completed" | "cancelled".
        // "confirmed" was a legacy name — using it here would skip accepted bookings and cause overbooking.
        const existingBookings = await db.booking.findMany({
          where: {
            date,
            time,
            status: { in: ["pending", "accepted"] },
            service: { category: isWash ? "wash" : { not: "wash" } },
          },
          select: { id: true },
        });
        if (existingBookings.length >= capacity) {
          return NextResponse.json(
            {
              error: "slot_full",
              message: isWash
                ? "اكتمل عدد سيارات الغسيل في هذا الموعد، اختر وقتاً آخر"
                : "هذا الموعد محجوز، الرجاء اختيار وقت آخر",
            },
            { status: 409 }
          );
        }
      } catch (slotErr) {
        // Non-fatal: if the capacity check fails, we still allow the booking
        console.error("Slot check error (non-fatal):", slotErr);
      }
    }

    // Upsert customer record (auto-save name/phone/car/plate/type/brand)
    const phoneTrim = String(phone).trim();
    const nameTrim = String(customerName).trim();
    // carModel is OPTIONAL — coerce to empty string when absent (Customer.carModel
    // column is NOT NULL in the schema, so we store "" rather than null)
    const carTrim = String(carModel ?? "").trim();
    const plateTrim = carPlate ? String(carPlate).trim() : null;
    const typeTrim = carType ? String(carType).trim() : null;
    const brandTrim = carBrand ? String(carBrand).trim() : null;
    const customer = await db.customer.upsert({
      where: { phone: phoneTrim },
      update: {
        name: nameTrim,
        carModel: carTrim,
        carPlate: plateTrim,
        carType: typeTrim,
        carBrand: brandTrim,
        bookingsCount: { increment: 1 },
        lastVisit: date,
      },
      create: {
        name: nameTrim,
        phone: phoneTrim,
        carModel: carTrim,
        carPlate: plateTrim,
        carType: typeTrim,
        carBrand: brandTrim,
        bookingsCount: 1,
        lastVisit: date,
      },
    });

    const refCode = genRef();
    const booking = await db.booking.create({
      data: {
        refCode,
        customerName: nameTrim,
        phone: phoneTrim,
        carModel: carTrim,
        carPlate: plateTrim,
        carType: typeTrim,
        carBrand: brandTrim,
        branchId: branchId || null,
        customerId: customer.id,
        serviceId,
        variantId: variant?.id ?? null,
        variantName,
        date,
        time,
        notes: notes ? String(notes).trim() : null,
        address: address ? String(address).trim() : null,
        totalPrice,
        status: "pending",
      },
      include: { service: { include: { variants: true } } },
    });

    return NextResponse.json({ booking });
  } catch (e) {
    console.error("POST /api/bookings error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
