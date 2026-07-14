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

// GET all customers (with optional search)
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const q = req.nextUrl.searchParams.get("q");
    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { carModel: { contains: q } },
            { carPlate: { contains: q } },
          ],
        }
      : {};
    const customers = await db.customer.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      include: {
        _count: { select: { bookings: true } },
      },
    });
    return NextResponse.json({ customers });
  } catch (e) {
    console.error("GET /api/admin/customers error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

// DELETE a customer
export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
    await db.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/customers error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
