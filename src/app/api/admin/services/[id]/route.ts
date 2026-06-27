import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

async function checkAuth(req: NextRequest) {
  const settings = await getSettings();
  const pin = req.headers.get("x-admin-pin");
  return pin === settings.adminPin;
}

// GET all services (including inactive) for admin, WITH variants
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const services = await db.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json({ services });
}

// PUT update service
export async function PUT(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.pathname.split("/").pop();
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.nameAr !== undefined) data.nameAr = body.nameAr;
  if (body.category !== undefined) data.category = body.category;
  if (body.subCategory !== undefined) data.subCategory = body.subCategory || null;
  if (body.description !== undefined) data.description = body.description;
  if (body.descriptionAr !== undefined) data.descriptionAr = body.descriptionAr;
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.duration !== undefined) data.duration = Number(body.duration);
  if (body.icon !== undefined) data.icon = body.icon;
  if (body.color !== undefined) data.color = body.color;
  if (body.hasVariants !== undefined) data.hasVariants = Boolean(body.hasVariants);
  if (body.priceNote !== undefined) data.priceNote = body.priceNote;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

  const updated = await db.service.update({
    where: { id },
    data,
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json({ service: updated });
}

// DELETE service (variants cascade)
export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.pathname.split("/").pop();
  await db.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
