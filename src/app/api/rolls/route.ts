import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/rolls — list all rolls with consumptions
export async function GET() {
  try {
    const rolls = await db.roll.findMany({
      include: { consumptions: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(rolls)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/rolls — create new roll
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const totalLength = Number(body.totalLength) || 0
    const price = Number(body.price) || 0

    const roll = await db.roll.create({
      data: {
        code: body.code,
        brand: body.brand || '',
        type: body.type || '',
        model: body.model || null,
        width: body.width ? Number(body.width) : null,
        totalLength,
        remainingLength: totalLength,
        price,
        supplier: body.supplier || null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        notes: body.notes || null,
        status: 'active',
      },
    })

    // Auto-create alert if low
    if (totalLength <= 2) {
      await db.alert.create({
        data: {
          type: 'roll_low',
          severity: totalLength <= 0 ? 'critical' : 'warning',
          title: `رول جديد ${roll.code} - مخزون منخفض`,
          message: `تم إضافة رول ${roll.brand} ${roll.type} بطول ${totalLength}م فقط`,
          relatedId: roll.id,
          relatedType: 'roll',
        },
      })
    }

    return NextResponse.json(roll, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
