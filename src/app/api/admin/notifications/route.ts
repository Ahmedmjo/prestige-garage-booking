import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

async function checkAuth(req: NextRequest) {
  const settings = await getSettings();
  const pin = req.headers.get("x-admin-pin");
  return pin === settings.adminPin;
}

// GET: count of new pending bookings since lastSeen timestamp
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const lastSeen = req.nextUrl.searchParams.get("lastSeen");
  const where = lastSeen
    ? { status: "pending", createdAt: { gt: new Date(lastSeen) } }
    : { status: "pending" };
  const count = await db.booking.count({ where });
  return NextResponse.json({ count, pending: count });
}

// PUT: mark notifications as seen (update lastSeen setting)
export async function PUT(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const now = new Date().toISOString();
  await db.setting.upsert({
    where: { key: "adminNotificationsLastSeen" },
    update: { value: now },
    create: { key: "adminNotificationsLastSeen", value: now },
  });
  return NextResponse.json({ ok: true, lastSeen: now });
}
