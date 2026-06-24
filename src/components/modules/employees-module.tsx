'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Plus, Search, DollarSign, Calendar,
  TrendingUp, Wallet, Award, UserCheck, UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface EmployeeData {
  id: string
  name: string
  baseSalary: number
  phone: string | null
  jobTitle: string | null
  status: string
  hireDate: string | null
  notes: string | null
  month: number
  year: number
  attendance: {
    present: number
    absent: number
    officialLeave: number
    weeklyLeave: number
    total: number
  }
  payroll: {
    paidDays: number
    dailyRate: number
    baseEarned: number
    totalCommissions: number
    totalAdvances: number
    penalties: number
    netSalary: number
  }
  commissionsList: any[]
  advancesList: any[]
}

export function EmployeesModule() {
  const [employees, setEmployees] = useState<EmployeeData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<EmployeeData | null>(null)

  useEffect(() => {
    loadEmployees()
  }, [month, year])

  async function loadEmployees() {
    setLoading(true)
    try {
      const res = await fetch(`/api/employees?month=${month}&year=${year}`)
      const data = await res.json()
      setEmployees(data)
    } catch (e) {
      toast.error('فشل تحميل بيانات الموظفين')
    } finally {
      setLoading(false)
    }
  }

  const filtered = employees.filter(e =>
    !search || e.name.includes(search) || (e.jobTitle || '').includes(search)
  )

  const totals = {
    netPayroll: employees.reduce((s, e) => s + e.payroll.netSalary, 0),
    totalCommissions: employees.reduce((s, e) => s + e.payroll.totalCommissions, 0),
    totalAdvances: employees.reduce((s, e) => s + e.payroll.totalAdvances, 0),
    totalBase: employees.reduce((s, e) => s + e.payroll.baseEarned, 0),
  }

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Users className="text-[#00C853]" />
            حسابات الموظفين
          </h1>
          <p className="text-gray-400 mt-1">إدارة الحضور والرواتب والعمولات والسلفيات</p>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          >
            {monthNames.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="prestige-gradient border-0 hover:opacity-90"
          >
            <Plus size={16} className="ml-1" />
            موظف جديد
          </Button>
        </div>
      </div>

      {/* Payroll summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="prestige-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} className="text-[#DC143C]" />
            <p className="text-xs text-gray-400">صافي الرواتب</p>
          </div>
          <p className="text-xl font-bold text-white">{totals.netPayroll.toLocaleString('ar-EG')}</p>
          <p className="text-xs text-gray-500">ج.م</p>
        </div>
        <div className="prestige-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-[#00C853]" />
            <p className="text-xs text-gray-400">الأساسي المستحق</p>
          </div>
          <p className="text-xl font-bold text-white">{totals.totalBase.toLocaleString('ar-EG')}</p>
          <p className="text-xs text-gray-500">ج.م</p>
        </div>
        <div className="prestige-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award size={14} className="text-[#FF9100]" />
            <p className="text-xs text-gray-400">إجمالي العمولات</p>
          </div>
          <p className="text-xl font-bold text-white">{totals.totalCommissions.toLocaleString('ar-EG')}</p>
          <p className="text-xs text-gray-500">ج.م</p>
        </div>
        <div className="prestige-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} className="text-[#FF1744]" />
            <p className="text-xs text-gray-400">إجمالي السلفيات</p>
          </div>
          <p className="text-xl font-bold text-white">{totals.totalAdvances.toLocaleString('ar-EG')}</p>
          <p className="text-xs text-gray-500">ج.م</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <Input
          placeholder="بحث بالاسم أو المسمى الوظيفي..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#0A0A0A] border-white/10 text-white pr-10 placeholder:text-gray-600"
        />
      </div>

      {/* Employees grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">لا يوجد موظفون</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((emp, idx) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="prestige-card p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#DC143C]/15 flex items-center justify-center">
                    <span className="text-lg font-bold text-[#DC143C]">
                      {emp.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{emp.name}</h3>
                    <p className="text-xs text-gray-400">{emp.jobTitle || 'موظف'}</p>
                  </div>
                </div>
                <Badge
                  className={emp.status === 'نشط'
                    ? 'bg-[#00C853]/15 text-[#00C853] border-[#00C853]/30'
                    : 'bg-[#DC143C]/15 text-[#DC143C] border-[#DC143C]/30'
                  }
                  variant="outline"
                >
                  {emp.status}
                </Badge>
              </div>

              {/* Attendance summary */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <AttBox label="حاضر" value={emp.attendance.present} color="#00C853" icon={UserCheck} />
                <AttBox label="غائب" value={emp.attendance.absent} color="#DC143C" icon={UserX} />
                <AttBox label="إجازة" value={emp.attendance.officialLeave} color="#03DAC6" icon={Calendar} />
                <AttBox label="راحة" value={emp.attendance.weeklyLeave} color="#888" icon={Calendar} />
              </div>

              {/* Payroll breakdown */}
              <div className="bg-black/40 rounded-lg p-3 space-y-2 text-sm">
                <PayRow label="الأساسي المستحق" value={emp.payroll.baseEarned} />
                <PayRow label="العمولات" value={emp.payroll.totalCommissions} color="#00C853" />
                <PayRow label="السلفيات" value={-emp.payroll.totalAdvances} color="#FF9100" />
                {emp.payroll.penalties > 0 && (
                  <PayRow label="الجزاءات" value={-emp.payroll.penalties} color="#DC143C" />
                )}
                <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                  <span className="font-bold text-white">صافي المرتب</span>
                  <span className="font-bold text-[#DC143C] text-lg">
                    {emp.payroll.netSalary.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedEmp(emp); setShowAdvanceDialog(true) }}
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs"
                >
                  <Plus size={12} className="ml-1" />
                  سلفة
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.info(`عرض تفاصيل ${emp.name} — قريباً`)}
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs"
                >
                  <Calendar size={12} className="ml-1" />
                  كشف الحضور
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Employee Dialog */}
      <AddEmployeeDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={loadEmployees} />

      {/* Advance Dialog */}
      <AdvanceDialog
        open={showAdvanceDialog}
        onOpenChange={setShowAdvanceDialog}
        employee={selectedEmp}
        onSuccess={loadEmployees}
      />
    </div>
  )
}

function AttBox({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <div className="text-center p-2 rounded-lg bg-white/5">
      <Icon size={14} className="mx-auto mb-1" style={{ color }} />
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

function PayRow({ label, value, color = '#fff' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="font-semibold" style={{ color }}>
        {value >= 0 ? '+' : ''}{value.toLocaleString('ar-EG')} ج.م
      </span>
    </div>
  )
}

function AddEmployeeDialog({ open, onOpenChange, onSuccess }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    name: '', baseSalary: '', phone: '', hireDate: '', jobTitle: '', notes: '', status: 'نشط',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!form.name || !form.baseSalary) {
      toast.error('الاسم والمرتب الأساسي مطلوبان')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'فشل الإضافة')
      }
      toast.success(`تم إضافة ${form.name} بنجاح`)
      setForm({ name: '', baseSalary: '', phone: '', hireDate: '', jobTitle: '', notes: '', status: 'نشط' })
      onOpenChange(false)
      onSuccess()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-white">إضافة موظف جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-gray-400 text-xs">الاسم *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">المرتب الأساسي (ج.م) *</Label>
            <Input type="number" value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">رقم الهاتف</Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">المسمى الوظيفي</Label>
            <Input value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" placeholder="فني بروتيكشن" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">تاريخ التعيين</Label>
            <Input type="date" value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400">إلغاء</Button>
          <Button onClick={handleSubmit} disabled={saving} className="prestige-gradient border-0">
            {saving ? 'جاري الحفظ...' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AdvanceDialog({ open, onOpenChange, employee, onSuccess }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  employee: EmployeeData | null
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (employee) {
      setForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' })
    }
  }, [employee, open])

  async function handleSubmit() {
    if (!employee || !form.amount) {
      toast.error('المبلغ مطلوب')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/employees/${employee.id}/advances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'فشل الإضافة')
      }
      toast.success(`تم تسجيل سلفة ${Number(form.amount).toLocaleString('ar-EG')} ج.م لـ ${employee.name}`)
      onOpenChange(false)
      onSuccess()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-white">تسجيل سلفة — {employee.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-gray-400 text-xs">المبلغ (ج.م) *</Label>
            <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">التاريخ</Label>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400">إلغاء</Button>
          <Button onClick={handleSubmit} disabled={saving} className="prestige-gradient border-0">
            {saving ? 'جاري الحفظ...' : 'تسجيل السلفة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
