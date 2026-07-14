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

// GET all services (including inactive) for admin, WITH variants
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const services = await db.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json({ services });
  } catch (e) {
    console.error("GET /api/admin/services error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
