import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/stock/[id]/movements — record new stock movement (receive/withdraw)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const item = await db.stockItem.findUnique({ where: { id } })
    if (!item) return NextResponse.json({ error: 'الصنف غير موجود' }, { status: 404 })

    const qty = Number(body.quantity) || 0
    const unitPrice = Number(body.unitPrice) || item.unitPrice
    const totalCost = qty * unitPrice
    const movementType = body.movementType || 'استلام'

    // Create movement record
    const movement = await db.stockMovement.create({
      data: {
        itemId: item.id,
        itemName: item.name,
        date: body.date ? new Date(body.date) : new Date(),
        materialType: item.category,
        movementType,
        quantity: qty,
        unit: item.unit,
        unitPrice,
        totalCost,
        notes: body.notes || null,
        deliveryNote: body.deliveryNote || null,
      },
    })

    // Update stock item
    let newQty = item.currentQty
    let newReceived = item.totalReceived
    let newWithdrawn = item.totalWithdrawn
    if (movementType === 'استلام') {
      newQty += qty
      newReceived += qty
    } else {
      newQty -= qty
      newWithdrawn += qty
    }
    let newStatus = 'كافي'
    if (newQty <= 0) newStatus = 'نفد'
    else if (newQty < item.minLevel) newStatus = 'منخفض'

    const updatedItem = await db.stockItem.update({
      where: { id: item.id },
      data: {
        currentQty: newQty,
        totalReceived: newReceived,
        totalWithdrawn: newWithdrawn,
        status: newStatus,
      },
    })

    // Auto-create alert if low/out
    if (newStatus !== 'كافي' && item.status === 'كافي') {
      await db.alert.create({
        data: {
          type: 'low_stock',
          severity: newStatus === 'نفد' ? 'critical' : 'warning',
          title: `مخزون ${item.name} ${newStatus === 'نفد' ? 'نفد' : 'منخفض'}`,
          message: `الصنف ${item.name} (${item.category}) — الكمية الحالية ${newQty} ${item.unit}`,
          relatedId: item.id,
          relatedType: 'stock_item',
        },
      })
    }

    return NextResponse.json({ movement, item: updatedItem }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET /api/stock/[id]/movements — list movements for item
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const movements = await db.stockMovement.findMany({
      where: { itemId: id },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(movements)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
