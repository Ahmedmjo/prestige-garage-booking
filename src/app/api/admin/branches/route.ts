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

// GET all branches (admin)
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const branches = await db.branch.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ branches });
  } catch (e) {
    console.error("GET /api/admin/branches error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

// POST create branch
export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    const branch = await db.branch.create({
      data: {
        name: body.name,
        nameAr: body.nameAr || body.name,
        address: body.address || null,
        addressAr: body.addressAr || null,
        phone: body.phone || null,
        mapUrl: body.mapUrl || null,
        isActive: body.isActive ?? true,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });
    return NextResponse.json({ branch });
  } catch (e) {
    console.error("POST /api/admin/branches error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
