import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stock — list all stock items by category
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const where = category && category !== 'all' ? { category } : {}
    const items = await db.stockItem.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(items)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/stock — add stock item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const item = await db.stockItem.create({
      data: {
        name: body.name,
        category: body.category || 'أخرى',
        unit: body.unit || 'وحدة',
        totalReceived: Number(body.totalReceived) || 0,
        totalWithdrawn: Number(body.totalWithdrawn) || 0,
        currentQty: Number(body.currentQty) || 0,
        minLevel: Number(body.minLevel) || 0,
        unitPrice: Number(body.unitPrice) || 0,
        status: body.status || 'كافي',
      },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
