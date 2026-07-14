import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, generateSessionToken, normalizePhone, isValidPhone } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

    const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!isValidPhone(phone)) return NextResponse.json({ error: "invalid_phone", message: "رقم هاتف غير صحيح" }, { status: 400 });

    const customer = await db.customer.findUnique({ where: { phone } });
    if (!customer || !customer.password) {
      return NextResponse.json({ error: "invalid_credentials", message: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    if (!verifyPassword(password, customer.password)) {
      return NextResponse.json({ error: "invalid_credentials", message: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    const token = generateSessionToken();
    await db.customer.update({ where: { id: customer.id }, data: { sessionToken: token } });

    return NextResponse.json({ customer: { id: customer.id, name: customer.name, phone: customer.phone }, token });
  } catch (e) {
    console.error("POST /api/auth/login error", e);
    return NextResponse.json({ error: "server_error", message: "تعذّر تسجيل الدخول" }, { status: 500 });
  }
}
