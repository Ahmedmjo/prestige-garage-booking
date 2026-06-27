import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET a single booking by ref or id
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    const booking = await db.booking.findUnique({
      where: { id },
      include: { service: true },
    });
    if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
