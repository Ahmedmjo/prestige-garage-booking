import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

async function checkAuth(req: NextRequest) {
  const settings = await getSettings();
  const pin = req.headers.get("x-admin-pin");
  return pin === settings.adminPin;
}

// PUT update a variant (price, name, duration, active)
export async function PUT(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.pathname.split("/").pop();
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.nameAr !== undefined) data.nameAr = body.nameAr;
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.duration !== undefined) data.duration = body.duration ? Number(body.duration) : null;
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  const updated = await db.serviceVariant.update({ where: { id }, data });
  return NextResponse.json({ variant: updated });
}

// DELETE a variant
export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.pathname.split("/").pop();
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
}
