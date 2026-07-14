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

// PUT update branch
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
    if (body.address !== undefined) data.address = body.address;
    if (body.addressAr !== undefined) data.addressAr = body.addressAr;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.mapUrl !== undefined) data.mapUrl = body.mapUrl;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

    const updated = await db.branch.update({ where: { id }, data });
    return NextResponse.json({ branch: updated });
  } catch (e) {
    console.error("PUT /api/admin/branches/[id] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

// DELETE branch
export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    await db.branch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/branches/[id] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
