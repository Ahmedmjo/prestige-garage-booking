import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/employees — list all employees with related data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const employees = await db.employee.findMany({
      include: {
        attendance: { where: { month, year } },
        advances: { where: { month, year } },
        commissions: { where: { month, year } },
      },
      orderBy: { name: 'asc' },
    })

    // Compute payroll for each employee
    const result = employees.map(emp => {
      const presentDays = emp.attendance.filter(a => a.status === 'ح').length
      const absentDays = emp.attendance.filter(a => a.status === 'غ').length
      const officialLeaveDays = emp.attendance.filter(a => a.status === 'إ').length
      const weeklyLeaveDays = emp.attendance.filter(a => a.status === 'ر').length
      // paid days = present + official leave (إ) — weekly leave (ر) and absence (غ) are unpaid
      const paidDays = presentDays + officialLeaveDays
      const dailyRate = emp.baseSalary / 30
      const baseEarned = dailyRate * paidDays

      const totalCommissions = emp.commissions.reduce((s, c) => s + c.amount, 0)
      const totalAdvances = emp.advances.reduce((s, a) => s + a.amount, 0)
      const penalties = emp.attendance.reduce((s, a) => s + (a.penalties || 0), 0)

      const netSalary = baseEarned + totalCommissions - totalAdvances - penalties

      return {
        id: emp.id,
        name: emp.name,
        baseSalary: emp.baseSalary,
        phone: emp.phone,
        jobTitle: emp.jobTitle,
        status: emp.status,
        hireDate: emp.hireDate,
        notes: emp.notes,
        month,
        year,
        attendance: {
          present: presentDays,
          absent: absentDays,
          officialLeave: officialLeaveDays,
          weeklyLeave: weeklyLeaveDays,
          total: emp.attendance.length,
        },
        payroll: {
          paidDays,
          dailyRate: Math.round(dailyRate),
          baseEarned: Math.round(baseEarned),
          totalCommissions,
          totalAdvances,
          penalties,
          netSalary: Math.round(netSalary),
        },
        commissionsList: emp.commissions,
        advancesList: emp.advances,
      }
    })

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/employees — add new employee
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const emp = await db.employee.create({
      data: {
        name: body.name,
        baseSalary: Number(body.baseSalary) || 0,
        phone: body.phone || null,
        hireDate: body.hireDate ? new Date(body.hireDate) : null,
        jobTitle: body.jobTitle || null,
        status: body.status || 'نشط',
        notes: body.notes || null,
      },
    })
    return NextResponse.json(emp, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
