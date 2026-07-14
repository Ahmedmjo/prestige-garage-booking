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

// PUT update a variant (price, name, duration, active)
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
    if (body.name !== undefined) data.name = body.name;
    if (body.nameAr !== undefined) data.nameAr = body.nameAr;
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.duration !== undefined) data.duration = body.duration ? Number(body.duration) : null;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const updated = await db.serviceVariant.update({ where: { id }, data });
    return NextResponse.json({ variant: updated });
  } catch (e) {
    console.error("PUT /api/admin/variants/[id] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

// DELETE a variant
export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    const variant = await db.serviceVariant.delete({ where: { id } });
    // if no more variants, unset hasVariants on the parent
    const remaining = await db.serviceVariant.count({ where: { serviceId: variant.serviceId } });
    if (remaining === 0) {
      await db.service.update({
        where: { id: variant.serviceId },
        data: { hasVariants: false },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/variants/[id] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
