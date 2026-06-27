import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

async function checkAuth(req: NextRequest) {
  const settings = await getSettings();
  const pin = req.headers.get("x-admin-pin");
  return pin === settings.adminPin;
}

// PUT update branch
export async function PUT(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.pathname.split("/").pop();
  const body = await req.json();
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
}

// DELETE branch
export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.pathname.split("/").pop();
  await db.branch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
