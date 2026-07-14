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
    if (body.title !== undefined) data.title = body.title;
    if (body.titleAr !== undefined) data.titleAr = body.titleAr;
    if (body.description !== undefined) data.description = body.description;
    if (body.descriptionAr !== undefined) data.descriptionAr = body.descriptionAr;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
    if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl || null;
    if (body.serviceId !== undefined) data.serviceId = body.serviceId || null;
    if (body.discountPct !== undefined) data.discountPct = body.discountPct ? Number(body.discountPct) : null;
    if (body.oldPrice !== undefined) data.oldPrice = body.oldPrice ? Number(body.oldPrice) : null;
    if (body.newPrice !== undefined) data.newPrice = body.newPrice ? Number(body.newPrice) : null;
    if (body.startDate !== undefined) data.startDate = body.startDate;
    if (body.endDate !== undefined) data.endDate = body.endDate;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

    const updated = await db.offer.update({ where: { id }, data });
    return NextResponse.json({ offer: updated });
  } catch (e) {
    console.error("PUT /api/admin/offers/[id] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    await db.offer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/offers/[id] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
