import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

    const settings = await getSettings();

    // Check admin credentials from settings (not hardcoded)
    const adminUser = body.username;
    const adminPass = body.password;
    const storedUser = settings.adminUser || "admin";
    const storedPass = settings.adminPassword || "";

    if (adminUser === storedUser && adminPass === storedPass && storedPass) {
      return NextResponse.json({ ok: true });
    }

    // Also check PIN (for mobile app)
    if (body.pin && body.pin === settings.adminPin) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "invalid" }, { status: 401 });
  } catch (e) {
    console.error("POST /api/admin/login error", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
