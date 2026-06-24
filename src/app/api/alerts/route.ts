import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/alerts — list alerts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const onlyUnread = searchParams.get('unread') === 'true'
    const where = onlyUnread ? { isRead: false } : {}
    const alerts = await db.alert.findMany({
      where,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(alerts)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
