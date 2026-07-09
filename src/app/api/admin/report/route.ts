import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

async function checkAuth(req: NextRequest): Promise<boolean> {
  try {
    const settings = await getSettings();
    const pin = req.headers.get("x-admin-pin");
    return !!pin && pin === settings.adminPin;
  } catch (e) {
    console.error("admin checkAuth error", e);
    return false;
  }
}

// GET /api/admin/report?type=daily|monthly|financial&date=YYYY-MM-DD&month=YYYY-MM
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const type = req.nextUrl.searchParams.get("type") || "daily";
    const date = req.nextUrl.searchParams.get("date");
    const month = req.nextUrl.searchParams.get("month");

    let where: Record<string, unknown> = {};

    if (type === "daily" && date) {
      where = { date };
    } else if (type === "monthly" && month) {
      // month = YYYY-MM, match all dates starting with it
      where = { date: { startsWith: month } };
    } else if (type === "financial") {
      // financial = all completed bookings
      where = { status: "completed" };
      if (month) where = { ...where, date: { startsWith: month } };
    }

    const bookings = await db.booking.findMany({
      where,
      include: { service: true, branch: true },
      orderBy: { date: "asc" },
    });

    // Group by service
    const byService: Record<string, { name: string; nameAr: string; count: number; revenue: number }> = {};
    // Group by date (for daily/monthly breakdown)
    const byDate: Record<string, { count: number; revenue: number }> = {};
    // Group by category
    const byCategory: Record<string, { count: number; revenue: number }> = {};

    let totalRevenue = 0;
    const totalBookings = bookings.length;

    for (const b of bookings) {
      totalRevenue += b.totalPrice;
      const svc = b.service;
      if (svc) {
        const key = svc.id;
        if (!byService[key]) byService[key] = { name: svc.name, nameAr: svc.nameAr, count: 0, revenue: 0 };
        byService[key].count++;
        byService[key].revenue += b.totalPrice;

        const cat = svc.category;
        if (!byCategory[cat]) byCategory[cat] = { count: 0, revenue: 0 };
        byCategory[cat].count++;
        byCategory[cat].revenue += b.totalPrice;
      }
      if (!byDate[b.date]) byDate[b.date] = { count: 0, revenue: 0 };
      byDate[b.date].count++;
      byDate[b.date].revenue += b.totalPrice;
    }

    return NextResponse.json({
      type,
      bookings,
      summary: {
        totalBookings,
        totalRevenue,
        completedCount: bookings.filter((b) => b.status === "completed").length,
        pendingCount: bookings.filter((b) => b.status === "pending").length,
        inProgressCount: bookings.filter((b) => b.status === "in_progress").length,
      },
      byService: Object.values(byService),
      byCategory: Object.entries(byCategory).map(([k, v]) => ({ category: k, ...v })),
      byDate: Object.entries(byDate).map(([k, v]) => ({ date: k, ...v })),
    });
  } catch (e) {
    console.error("GET /api/admin/report error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
