import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/alerts/[id] — mark as read
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const alert = await db.alert.update({
      where: { id },
      data: { isRead: body.isRead ?? true },
    })
    return NextResponse.json(alert)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
