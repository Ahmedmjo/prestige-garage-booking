import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/employees/[id]/advances — add advance to employee
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const emp = await db.employee.findUnique({ where: { id } })
    if (!emp) return NextResponse.json({ error: 'موظف غير موجود' }, { status: 404 })

    const d = body.date ? new Date(body.date) : new Date()
    const advance = await db.advance.create({
      data: {
        employeeId: id,
        employeeName: emp.name,
        date: d,
        amount: Number(body.amount) || 0,
        notes: body.notes || null,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      },
    })

    return NextResponse.json(advance, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
