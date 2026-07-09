import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, generateSessionToken, normalizePhone, isValidPhone } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 2) return NextResponse.json({ error: "invalid_name", message: "الاسم قصير جداً" }, { status: 400 });
    if (!isValidPhone(phone)) return NextResponse.json({ error: "invalid_phone", message: "رقم هاتف غير صحيح" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "weak_password", message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });

    const existing = await db.customer.findUnique({ where: { phone }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "phone_taken", message: "هذا الرقم مسجل بالفعل، سجّل الدخول" }, { status: 409 });

    const passwordHash = hashPassword(password);
    const token = generateSessionToken();

    const customer = await db.customer.create({
      data: { name, phone, password: passwordHash, sessionToken: token },
      select: { id: true, name: true, phone: true },
    });

    return NextResponse.json({ customer, token });
  } catch (e) {
    console.error("POST /api/auth/register error", e);
    return NextResponse.json({ error: "server_error", message: "تعذّر إنشاء الحساب" }, { status: 500 });
  }
}
