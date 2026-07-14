import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public: GET active offers (within date range)
export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const offers = await db.offer.findMany({
      where: {
        isActive: true,
        startDate: { lte: today },
        endDate: { gte: today },
      },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ offers });
  } catch (e) {
    console.error("GET /api/offers error", e);
    return NextResponse.json({ offers: [] }, { status: 500 });
  }
}
