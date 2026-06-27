import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

async function checkAuth(req: NextRequest) {
  const settings = await getSettings();
  const pin = req.headers.get("x-admin-pin");
  return pin === settings.adminPin;
}

export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const offers = await db.offer.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ offers });
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const offer = await db.offer.create({
    data: {
      title: body.title,
      titleAr: body.titleAr || body.title,
      description: body.description || null,
      descriptionAr: body.descriptionAr || null,
      imageUrl: body.imageUrl || null,
      videoUrl: body.videoUrl || null,
      serviceId: body.serviceId || null,
      discountPct: body.discountPct ? Number(body.discountPct) : null,
      oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
      newPrice: body.newPrice ? Number(body.newPrice) : null,
      startDate: body.startDate,
      endDate: body.endDate,
      isActive: body.isActive ?? true,
      sortOrder: Number(body.sortOrder) || 0,
    },
  });
  return NextResponse.json({ offer });
}
