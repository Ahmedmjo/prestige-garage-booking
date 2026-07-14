import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

async function checkAuth(req: NextRequest): Promise<boolean> {
  try {
    const settings = await getSettings();
    const pin = req.headers.get("x-admin-pin");
    return !!pin && pin === settings.adminPin;
  } catch (e) {
    console.error("admin checkAuth error", e);
    return false;
  }
}

// GET all bookings (admin view) — include service + branch
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    const booking = await db.booking.findUnique({
      where: { id },
      include: { service: { include: { variants: true } }, branch: true },
    });
    if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (e) {
    console.error("GET /api/admin/bookings/[id] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

// PUT update booking — status (with workflow timestamps), expiry date, notes
export async function PUT(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    const data: Record<string, unknown> = {};

    if (body.status !== undefined) {
      data.status = body.status;
      // set workflow timestamps automatically
      if (body.status === "accepted" && body.setTimestamp !== false) {
        data.acceptedAt = new Date();
      }
      if (body.status === "in_progress" && body.setTimestamp !== false) {
        data.inProgressAt = new Date();
      }
      if (body.status === "completed" && body.setTimestamp !== false) {
        data.completedAt = new Date();
        // auto-calculate expiryDate from variant lifespanDays if not already set
        const booking = await db.booking.findUnique({
          where: { id },
          include: { service: { include: { variants: true } } },
        });
        if (booking && !booking.expiryDate && booking.variantId) {
          const variant = booking.service.variants.find((v) => v.id === booking.variantId);
          if (variant?.lifespanDays) {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + variant.lifespanDays);
            data.expiryDate = expiry.toISOString().slice(0, 10);
          }
        }
      }
    }
    if (body.date !== undefined) data.date = body.date;
    if (body.time !== undefined) data.time = body.time;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate || null;
    if (body.adminNote !== undefined) data.adminNote = body.adminNote || null;
    if (body.branchId !== undefined) data.branchId = body.branchId || null;

    const updated = await db.booking.update({
      where: { id },
      data,
      include: { service: { include: { variants: true } }, branch: true },
    });
    return NextResponse.json({ booking: updated });
  } catch (e) {
    console.error("PUT /api/admin/bookings/[id] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

// DELETE booking
export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    await db.booking.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/bookings/[id] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
