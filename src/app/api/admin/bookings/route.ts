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
    const status = req.nextUrl.searchParams.get("status");
    const where = status && status !== "all" ? { status } : {};
    const bookings = await db.booking.findMany({
      where,
      include: { service: { include: { variants: true } }, branch: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
    return NextResponse.json({ bookings });
  } catch (e) {
    console.error("GET /api/admin/bookings error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
