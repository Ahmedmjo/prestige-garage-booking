import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = await getSettings();
    // accept either pin or password (admin password)
    const ok =
      body.pin === settings.adminPin ||
      (body.username === "admin" && body.password === "prestige2024");
    if (!ok) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
    }
    return NextResponse.json({ ok: true, pin: settings.adminPin });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
