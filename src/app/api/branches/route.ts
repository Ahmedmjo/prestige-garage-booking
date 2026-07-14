import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public: GET active branches
export async function GET() {
  try {
    const branches = await db.branch.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ branches });
  } catch (e) {
    console.error("GET /api/branches error", e);
    return NextResponse.json({ branches: [] }, { status: 500 });
  }
}
