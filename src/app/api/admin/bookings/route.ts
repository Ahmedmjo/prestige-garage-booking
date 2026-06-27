import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

async function checkAuth(req: NextRequest) {
  const settings = await getSettings();
  const pin = req.headers.get("x-admin-pin");
  return pin === settings.adminPin;
}

// GET all bookings (admin view) — include service + branch
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const status = req.nextUrl.searchParams.get("status");
  const where = status && status !== "all" ? { status } : {};
  const bookings = await db.booking.findMany({
    where,
    include: { service: { include: { variants: true } }, branch: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  return NextResponse.json({ bookings });
}
