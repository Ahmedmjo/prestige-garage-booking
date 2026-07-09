import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import type { ServiceItem, ServiceVariant } from "@/lib/types";

function mapService(s: any): ServiceItem {
  return {
    id: s.id,
    name: s.name,
    nameAr: s.nameAr,
    category: s.category as ServiceItem["category"],
    subCategory: s.subCategory,
    description: s.description,
    descriptionAr: s.descriptionAr,
    price: s.price,
    duration: s.duration,
    icon: s.icon,
    color: s.color,
    hasVariants: s.hasVariants,
    priceNote: s.priceNote,
    imageUrl: s.imageUrl,
    isActive: s.isActive,
    sortOrder: s.sortOrder,
    variants: (s.variants ?? []).map((v: any): ServiceVariant => ({
      id: v.id,
      serviceId: v.serviceId,
      name: v.name,
      nameAr: v.nameAr,
      price: v.price,
      duration: v.duration,
      lifespanDays: v.lifespanDays,
      sortOrder: v.sortOrder,
      isActive: v.isActive,
    })),
  };
}

export async function GET() {
  try {
    const services = await db.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    });
    const data: ServiceItem[] = services.map(mapService);
    return NextResponse.json({ services: data });
  } catch (e) {
    console.error("GET /api/services error", e);
    return NextResponse.json({ services: [], error: "failed" }, { status: 500 });
  }
}

// Admin: create a new service (with optional variants)
export async function POST(req: NextRequest) {
  try {
    const settings = await getSettings();
    const auth = req.headers.get("x-admin-pin");
    if (auth !== settings.adminPin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const created = await db.service.create({
      data: {
        name: body.name,
        nameAr: body.nameAr || body.name,
        category: body.category,
        subCategory: body.subCategory || null,
        description: body.description || null,
        descriptionAr: body.descriptionAr || null,
        price: Number(body.price) || 0,
        duration: Number(body.duration) || 60,
        icon: body.icon || null,
        color: body.color || null,
        hasVariants: body.hasVariants ?? false,
        priceNote: body.priceNote || null,
        imageUrl: body.imageUrl || null,
        isActive: body.isActive ?? true,
        sortOrder: Number(body.sortOrder) || 0,
        variants: body.variants?.length
          ? {
              create: body.variants.map((v: any, i: number) => ({
                name: v.name,
                nameAr: v.nameAr || v.name,
                price: Number(v.price) || 0,
                duration: v.duration ? Number(v.duration) : null,
                sortOrder: v.sortOrder ?? i,
                isActive: true,
              })),
            }
          : undefined,
      },
      include: { variants: true },
    });
    return NextResponse.json({ service: mapService(created) });
  } catch (e) {
    console.error("POST /api/services error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
