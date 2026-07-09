import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public: GET active offers (within date range)
//
// PERFORMANCE: imageUrl/videoUrl may contain multi-MB base64 data URLs.
// We strip base64 values from the list response (keep only small URL
// strings) and add hasVideo/hasImage boolean flags so the frontend
// knows whether to render the video card.
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
    const lightweightOffers = offers.map((o) => ({
      ...o,
      imageUrl:
        o.imageUrl && !o.imageUrl.startsWith("data:") ? o.imageUrl : null,
      videoUrl:
        o.videoUrl && !o.videoUrl.startsWith("data:") ? o.videoUrl : null,
      hasVideo: !!o.videoUrl,
      hasImage: !!o.imageUrl,
    }));
    return NextResponse.json({ offers: lightweightOffers });
  } catch (e) {
    console.error("GET /api/offers error", e);
    return NextResponse.json({ offers: [] }, { status: 500 });
  }
}
