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

// GET variants for a service: /api/admin/variants?serviceId=...
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const serviceId = req.nextUrl.searchParams.get("serviceId");
    if (!serviceId) return NextResponse.json({ variants: [] });
    const variants = await db.serviceVariant.findMany({
      where: { serviceId },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ variants });
  } catch (e) {
    console.error("GET /api/admin/variants error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

// POST create a variant for a service
export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    const { serviceId, name, nameAr, price, duration, sortOrder } = body;
    if (!serviceId || !name || price === undefined) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    // count existing to set sortOrder
    const count = await db.serviceVariant.count({ where: { serviceId } });
    const variant = await db.serviceVariant.create({
      data: {
        serviceId,
        name,
        nameAr: nameAr || name,
        price: Number(price),
        duration: duration ? Number(duration) : null,
        sortOrder: sortOrder ?? count,
        isActive: true,
      },
    });
    // ensure the parent service hasVariants = true
    await db.service.update({ where: { id: serviceId }, data: { hasVariants: true } });
    return NextResponse.json({ variant });
  } catch (e) {
    console.error("POST /api/admin/variants error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
