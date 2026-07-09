import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CHUNK_SIZE = 256 * 1024;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const offer = await db.offer.findUnique({
      where: { id },
      select: { videoUrl: true },
    });
    if (!offer?.videoUrl) return new NextResponse("Not found", { status: 404 });

    const v = offer.videoUrl;
    if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/uploads/") || v.startsWith("/api/uploads/")) {
      return NextResponse.redirect(v, { status: 302 });
    }

    const match = v.match(/^data:video\/([\w+.-]+);base64,(.+)$/);
    if (!match) return new NextResponse("Invalid format", { status: 400 });

    const buffer = Buffer.from(match[2], "base64");
    const total = buffer.length;
    const range = req.headers.get("range");

    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      if (m) {
        const start = m[1] ? parseInt(m[1], 10) : 0;
        const end = m[2] ? parseInt(m[2], 10) : total - 1;
        const clamped = Math.min(end, total - 1);
        if (start >= total || start > clamped) {
          return new NextResponse("Range not satisfiable", { status: 416, headers: { "Content-Range": `bytes */${total}` } });
        }
        return new NextResponse(buffer.subarray(start, clamped + 1), {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${clamped}/${total}`,
            "Accept-Ranges": "bytes",
            "Content-Length": (clamped - start + 1).toString(),
            "Content-Type": "video/mp4",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    const stream = new ReadableStream({
      start(controller) {
        for (let i = 0; i < total; i += CHUNK_SIZE) {
          controller.enqueue(new Uint8Array(buffer.subarray(i, Math.min(i + CHUNK_SIZE, total))));
        }
        controller.close();
      },
    });
    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Length": total.toString(),
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("GET /api/offers/[id]/video error", e);
    return new NextResponse("Failed", { status: 500 });
  }
}
