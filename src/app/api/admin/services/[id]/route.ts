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
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    const service = await db.service.findUnique({
      where: { id },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    if (!service) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ service });
  } catch (e) {
    console.error("GET /api/admin/services/[id] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

// PUT update service
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
  } catch (e) {
    console.error("PUT /api/admin/services/[id] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

// DELETE service (variants cascade)
export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    await db.service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/services/[id] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
