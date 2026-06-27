import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

async function checkAuth(req: NextRequest) {
  const settings = await getSettings();
  const pin = req.headers.get("x-admin-pin");
  return pin === settings.adminPin;
}

// GET all branches (admin)
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const branches = await db.branch.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ branches });
}

// POST create branch
export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
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
}
