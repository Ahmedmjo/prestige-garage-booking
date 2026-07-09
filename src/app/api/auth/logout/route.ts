import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (body?.id) {
      await db.customer.update({ where: { id: body.id }, data: { sessionToken: null } }).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
