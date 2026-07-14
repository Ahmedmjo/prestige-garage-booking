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

// GET: count of new pending bookings since lastSeen timestamp
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const lastSeen = req.nextUrl.searchParams.get("lastSeen");
    const where = lastSeen
      ? { status: "pending", createdAt: { gt: new Date(lastSeen) } }
      : { status: "pending" };
    const count = await db.booking.count({ where });
    return NextResponse.json({ count, pending: count });
  } catch (e) {
    console.error("GET /api/admin/notifications error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

// PUT: mark notifications as seen (update lastSeen setting)
export async function PUT(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const now = new Date().toISOString();
    await db.setting.upsert({
      where: { key: "adminNotificationsLastSeen" },
      update: { value: now },
      create: { key: "adminNotificationsLastSeen", value: now },
    });
    return NextResponse.json({ ok: true, lastSeen: now });
  } catch (e) {
    console.error("PUT /api/admin/notifications error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
