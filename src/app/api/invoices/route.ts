import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices — list all invoices
export async function GET() {
  try {
    const invoices = await db.invoice.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(invoices)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/invoices — add new invoice
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const total = Number(body.total) || 0
    const discount = Number(body.discount) || 0
    const net = body.net ? Number(body.net) : total - discount

    const invoice = await db.invoice.create({
      data: {
        deliveryNote: body.deliveryNote,
        date: body.date ? new Date(body.date) : null,
        description: body.description || null,
        total,
        discount,
        net,
        itemsCount: Number(body.itemsCount) || 0,
        notes: body.notes || null,
      },
    })
    return NextResponse.json(invoice, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
