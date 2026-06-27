import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { firewall, applySecurityHeaders, sanitizeInput } from '@/lib/firewall'

// GET /api/rolls — list all rolls with consumptions
export async function GET(req: NextRequest) {
  const check = await firewall(req)
  if (check.blocked) return check.response!

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const where: any = {}
    if (category && category !== 'all') where.rollCategory = category

    const rolls = await db.roll.findMany({
      where,
      include: { consumptions: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    })
    const response = NextResponse.json(rolls)
    return applySecurityHeaders(response)
  } catch (e: any) {
    const response = NextResponse.json({ error: e.message, code: 'INTERNAL_ERROR' }, { status: 500 })
    return applySecurityHeaders(response)
  }
}

// POST /api/rolls — create new roll (Protected by Firewall)
export async function POST(req: NextRequest) {
  const check = await firewall(req)
  if (check.blocked) return check.response!

  try {
    const rawBody = await req.json()
    const body = sanitizeInput(rawBody)

    // Auto-suggest code if not provided
    let code = body.code
    if (!code) {
      const brandPrefix = (body.brand || 'GEN').slice(0, 3).toUpperCase()
      const typePrefix = (body.type || 'GEN').slice(0, 3).toUpperCase()
      const count = await db.roll.count()
      code = `${brandPrefix}-${typePrefix}-${String(count + 1).padStart(3, '0')}`
    }

    // Check code uniqueness
    const existing = await db.roll.findUnique({ where: { code } })
    if (existing) {
      const response = NextResponse.json({ error: `كود الرول ${code} موجود مسبقاً`, code: 'DUPLICATE_CODE' }, { status: 400 })
      return applySecurityHeaders(response)
    }

    const totalLength = Number(body.totalLength) || 0
    const price = Number(body.price) || 0
    const rollCategory = body.rollCategory || 'ppf'

    const roll = await db.roll.create({
      data: {
        code,
        brand: body.brand || '',
        type: body.type || '',
        model: body.model || null,
        width: body.width ? Number(body.width) : null,
        totalLength,
        remainingLength: totalLength,
        price,
        supplier: body.supplier || null,
        rollCategory,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        notes: body.notes || null,
        status: 'active',
        carsCount: 0,
      },
    })

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

    const response = NextResponse.json(roll, { status: 201 })
    return applySecurityHeaders(response)
  } catch (e: any) {
    const response = NextResponse.json({ error: e.message, code: 'INTERNAL_ERROR' }, { status: 500 })
    return applySecurityHeaders(response)
  }
}
