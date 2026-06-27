import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { firewall, applySecurityHeaders, sanitizeInput } from '@/lib/firewall'

// GET /api/employees — FIXED SALARY MODEL (Protected by Firewall)
export async function GET(req: NextRequest) {
  const check = await firewall(req)
  if (check.blocked) return check.response!

  try {
    const { searchParams } = new URL(req.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const employees = await db.employee.findMany({
      include: {
        attendance: { where: { month, year } },
        advances: { where: { month, year } },
        commissions: { where: { month, year } },
        penalties: { where: { month, year } },
      },
      orderBy: { name: 'asc' },
    })

    const result = employees.map(emp => {
      const presentDays = emp.attendance.filter(a => a.status === 'ح').length
      const absentDays = emp.attendance.filter(a => a.status === 'غ').length
      const officialLeaveDays = emp.attendance.filter(a => a.status === 'إ').length
      const weeklyLeaveDays = emp.attendance.filter(a => a.status === 'ر').length

      const fixedSalary = emp.baseSalary
      const totalCommissions = emp.commissions.reduce((s, c) => s + c.amount, 0)
      const totalAdvances = emp.advances.reduce((s, a) => s + a.amount, 0)
      const totalPenalties = emp.penalties.reduce((s, p) => s + p.amount, 0)
      const netSalary = fixedSalary + totalCommissions - totalAdvances - totalPenalties

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
          fixedSalary,
          totalCommissions,
          totalAdvances,
          totalPenalties,
          netSalary: Math.round(netSalary),
        },
        commissionsList: emp.commissions,
        advancesList: emp.advances,
        penaltiesList: emp.penalties,
      }
    })

    const response = NextResponse.json(result)
    return applySecurityHeaders(response)
  } catch (e: any) {
    const response = NextResponse.json({ error: e.message, code: 'INTERNAL_ERROR' }, { status: 500 })
    return applySecurityHeaders(response)
  }
}

// POST /api/employees — add new employee (Protected by Firewall)
export async function POST(req: NextRequest) {
  const check = await firewall(req)
  if (check.blocked) return check.response!

  try {
    const rawBody = await req.json()
    const body = sanitizeInput(rawBody)

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
    const response = NextResponse.json(emp, { status: 201 })
    return applySecurityHeaders(response)
  } catch (e: any) {
    const response = NextResponse.json({ error: e.message, code: 'INTERNAL_ERROR' }, { status: 500 })
    return applySecurityHeaders(response)
  }
}
