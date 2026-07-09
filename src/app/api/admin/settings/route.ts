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

const ALLOWED_KEYS = new Set([
  "brandName", "brandNameAr", "tagline", "taglineAr", "bornLine", "poweredBy",
  "phone", "whatsapp", "address", "addressAr", "workingHours", "workingHoursAr",
  "aboutEn", "aboutAr", "adminPin", "adminUser", "adminPassword",
  "instagram", "twitter", "snapchat", "tiktok", "facebook",
  "mapsUrl", "email", "branchSelectionEnabled",
]);

export async function PUT(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    for (const [key, value] of Object.entries(body)) {
      if (typeof value !== "string") continue;
      if (!ALLOWED_KEYS.has(key)) continue;
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PUT /api/admin/settings error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
