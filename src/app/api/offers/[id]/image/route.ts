import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const offer = await db.offer.findUnique({
      where: { id },
      select: { imageUrl: true },
    });
    if (!offer?.imageUrl) return new NextResponse("Not found", { status: 404 });

    const v = offer.imageUrl;
    if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/uploads/") || v.startsWith("/api/uploads/")) {
      return NextResponse.redirect(v, { status: 302 });
    }

    const match = v.match(/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,(.+)$/);
    if (!match) return new NextResponse("Invalid format", { status: 400 });

    const ext = match[1];
    const contentType = ext === "svg+xml" ? "image/svg+xml" : ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
    const buffer = Buffer.from(match[2], "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Length": buffer.length.toString(),
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("GET /api/offers/[id]/image error", e);
    return new NextResponse("Failed", { status: 500 });
  }
}
