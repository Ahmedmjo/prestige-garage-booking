import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

async function checkAuth(req: NextRequest) {
  const settings = await getSettings();
  const pin = req.headers.get("x-admin-pin");
  return pin === settings.adminPin;
}

export async function PUT(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.pathname.split("/").pop();
  const body = await req.json();
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
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.pathname.split("/").pop();
  await db.offer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
