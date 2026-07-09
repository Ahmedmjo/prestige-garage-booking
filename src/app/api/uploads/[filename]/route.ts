import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;
    const safe = path.basename(filename);
    if (safe !== filename) {
      return NextResponse.json({ error: "invalid_filename" }, { status: 400 });
    }
    const filePath = path.join("/tmp", "uploads", safe);
    let fileStats;
    try {
      fileStats = await stat(filePath);
    } catch {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const ext = path.extname(safe).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".mp4": "video/mp4", ".webm": "video/webm", ".ogg": "video/ogg",
      ".mov": "video/quicktime", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
      ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
    };
    const contentType = contentTypes[ext] || "application/octet-stream";

    const range = req.headers.get("range");
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? parseInt(match[2], 10) : fileStats.size - 1;
        const chunkSize = end - start + 1;
        const buf = await readFile(filePath);
        return new NextResponse(buf.subarray(start, end + 1), {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${fileStats.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize.toString(),
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }
    const buf = await readFile(filePath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Length": fileStats.size.toString(),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("GET /api/uploads/[filename] error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
