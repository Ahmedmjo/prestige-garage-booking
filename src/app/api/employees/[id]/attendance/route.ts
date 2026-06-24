import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/employees/[id]/attendance — get monthly attendance grid
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const attendance = await db.attendance.findMany({
      where: { employeeId: id, month, year },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ attendance, month, year })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/employees/[id]/attendance — update single day status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { date, status } = body
    const d = new Date(date)
    const month = d.getMonth() + 1
    const year = d.getFullYear()

    const emp = await db.employee.findUnique({ where: { id } })
    if (!emp) return NextResponse.json({ error: 'موظف غير موجود' }, { status: 404 })

    const attendance = await db.attendance.upsert({
      where: { employeeId_date: { employeeId: id, date: d } },
      update: { status },
      create: {
        employeeId: id,
        employeeName: emp.name,
        date: d,
        status,
        month,
        year,
      },
    })

    return NextResponse.json(attendance)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
