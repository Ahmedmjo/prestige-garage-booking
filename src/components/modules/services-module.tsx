'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Wrench, Plus, Search, DollarSign, Car, User, CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Service {
  id: string
  code: string
  date: string
  plate: string | null
  clientName: string | null
  carType: string | null
  serviceType: string
  price: number
  paymentMethod: string | null
  technician: string | null
  notes: string | null
}

const SERVICE_TYPES = [
  'ديتيلنج كامل', 'ديتيلنج داخلي', 'ديتيلنج محرك', 'ديتيلنج سقف', 'ديتيلنج جنوط',
  'بوليش مستوى 1', 'بوليش مستوى 2', 'بوليش مستوى 3', 'تلميع فوانيس',
  'نانو سيراميك 3 سنوات', 'نانو سيراميك 5 سنوات', 'نانو سيراميك 8 سنوات',
  'عزل حراري كامل', 'عزل حراري نصف', 'عزل حراري فاميه',
  'بروتيكشن', 'فيلم حماية', 'أخرى',
]

const PAYMENT_METHODS = ['كاش', 'تحويل بنكي', 'بطاقة ائتمان', 'إنستاباي', 'آجل']

const TYPE_COLORS: Record<string, string> = {
  'ديتيلنج': '#03DAC6',
  'بوليش': '#FF9100',
  'نانو': '#BB86FC',
  'بروتيكشن': '#DC143C',
  'عزل': '#FFD600',
  'فيلم': '#00C853',
}

function getTypeColor(type: string): string {
  const key = Object.keys(TYPE_COLORS).find(k => type.includes(k))
  return key ? TYPE_COLORS[key] : '#888'
}

export function ServicesModule() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    setLoading(true)
    try {
      const res = await fetch('/api/services')
      const data = await res.json()
      setServices(data)
    } catch (e) {
      toast.error('فشل تحميل الخدمات')
    } finally {
      setLoading(false)
    }
  }

  const filtered = services.filter(s => {
    const matchesSearch = !search ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.clientName || '').includes(search) ||
      (s.carType || '').includes(search) ||
      (s.plate || '').includes(search)
    const matchesType = typeFilter === 'all' || s.serviceType === typeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    total: services.length,
    revenue: services.reduce((s, x) => s + x.price, 0),
    average: services.length > 0 ? services.reduce((s, x) => s + x.price, 0) / services.length : 0,
  }

  // Revenue by type
  const byType: Record<string, { count: number; total: number }> = {}
  for (const s of services) {
    if (!byType[s.serviceType]) byType[s.serviceType] = { count: 0, total: 0 }
    byType[s.serviceType].count++
    byType[s.serviceType].total += s.price
  }
  const typeStats = Object.entries(byType).sort((a, b) => b[1].total - a[1].total)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Wrench className="text-[#03DAC6]" />
            الخدمات والفواتير
          </h1>
          <p className="text-gray-400 mt-1">سجل العمليات والإيرادات حسب نوع الخدمة</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="prestige-gradient border-0 hover:opacity-90"
        >
          <Plus size={16} className="ml-1" />
          خدمة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="prestige-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wrench size={14} className="text-[#03DAC6]" />
            <p className="text-xs text-gray-400">إجمالي الخدمات</p>
          </div>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="prestige-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-[#DC143C]" />
            <p className="text-xs text-gray-400">إجمالي الإيرادات</p>
          </div>
          <p className="text-xl font-bold text-white mt-1">{stats.revenue.toLocaleString('ar-EG')}</p>
          <p className="text-xs text-gray-500">ج.م</p>
        </div>
        <div className="prestige-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-[#00C853]" />
            <p className="text-xs text-gray-400">متوسط السعر</p>
          </div>
          <p className="text-xl font-bold text-white mt-1">{Math.round(stats.average).toLocaleString('ar-EG')}</p>
          <p className="text-xs text-gray-500">ج.م</p>
        </div>
        <div className="prestige-card p-4">
          <p className="text-xs text-gray-400 mb-1">أنواع الخدمات</p>
          <p className="text-2xl font-bold text-white mt-1">{typeStats.length}</p>
        </div>
      </div>

      {/* Type breakdown */}
      <div className="prestige-card p-5">
        <h3 className="font-bold text-white mb-3">تحليل الإيرادات حسب نوع الخدمة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {typeStats.map(([type, data]) => (
            <div key={type} className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white font-medium">{type}</span>
                <div className="w-3 h-3 rounded-full" style={{ background: getTypeColor(type) }} />
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-gray-500">عدد الخدمات</p>
                  <p className="text-lg font-bold text-white">{data.count}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500">الإيراد</p>
                  <p className="text-lg font-bold" style={{ color: getTypeColor(type) }}>
                    {data.total.toLocaleString('ar-EG')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <Input
            placeholder="بحث بالكود أو العميل أو السيارة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#0A0A0A] border-white/10 text-white pr-10 placeholder:text-gray-600"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">كل الأنواع</option>
          {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Services table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">لا توجد خدمات</div>
      ) : (
        <div className="prestige-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right">
                  <th className="py-3 px-4 text-gray-400 font-medium">الكود</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">التاريخ</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">العميل</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">السيارة</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">اللوحة</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">الخدمة</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">الفني</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">الدفع</th>
                  <th className="py-3 px-4 text-gray-400 font-medium text-left">السعر</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/3"
                  >
                    <td className="py-3 px-4 font-mono text-[#DC143C] text-xs">{s.code}</td>
                    <td className="py-3 px-4 text-gray-300">{new Date(s.date).toLocaleDateString('ar-EG')}</td>
                    <td className="py-3 px-4 text-white">{s.clientName || '-'}</td>
                    <td className="py-3 px-4 text-gray-300">{s.carType || '-'}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{s.plate || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge
                        style={{ background: getTypeColor(s.serviceType) + '20', color: getTypeColor(s.serviceType), borderColor: getTypeColor(s.serviceType) + '40' }}
                        className="border text-xs"
                      >
                        {s.serviceType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{s.technician || '-'}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{s.paymentMethod || '-'}</td>
                    <td className="py-3 px-4 text-left font-bold text-[#00C853]">
                      {s.price.toLocaleString('ar-EG')} ج.م
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddServiceDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={loadServices} />
    </div>
  )
}

function AddServiceDialog({ open, onOpenChange, onSuccess }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    code: '', date: new Date().toISOString().split('T')[0],
    plate: '', clientName: '', carType: '',
    serviceType: 'ديتيلنج كامل', price: '',
    paymentMethod: 'كاش', technician: '', notes: '',
    commissionAmount: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!form.serviceType || !form.price) {
      toast.error('نوع الخدمة والسعر مطلوبان')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'فشل الإضافة')
      }
      toast.success('تم تسجيل الخدمة بنجاح')
      setForm({
        code: '', date: new Date().toISOString().split('T')[0],
        plate: '', clientName: '', carType: '',
        serviceType: 'ديتيلنج كامل', price: '',
        paymentMethod: 'كاش', technician: '', notes: '',
        commissionAmount: '',
      })
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
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-white">تسجيل خدمة جديدة</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div>
            <Label className="text-gray-400 text-xs">كود الخدمة</Label>
            <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="تلقائي إذا تُرك فارغاً" className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">التاريخ</Label>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">اسم العميل</Label>
            <Input value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">نوع السيارة</Label>
            <Input value={form.carType} onChange={e => setForm({ ...form, carType: e.target.value })} placeholder="مرسيدس" className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">رقم اللوحة</Label>
            <Input value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">نوع الخدمة *</Label>
            <select
              value={form.serviceType}
              onChange={e => setForm({ ...form, serviceType: e.target.value })}
              className="w-full bg-[#000] border border-white/10 rounded-md px-3 py-2 text-white mt-1"
            >
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-gray-400 text-xs">السعر (ج.م) *</Label>
            <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">طريقة الدفع</Label>
            <select
              value={form.paymentMethod}
              onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
              className="w-full bg-[#000] border border-white/10 rounded-md px-3 py-2 text-white mt-1"
            >
              {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-gray-400 text-xs">الفني</Label>
            <Input value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} placeholder="اسم الفني" className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">العمولة (ج.م)</Label>
            <Input type="number" value={form.commissionAmount} onChange={e => setForm({ ...form, commissionAmount: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div className="col-span-2">
            <Label className="text-gray-400 text-xs">ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400">إلغاء</Button>
          <Button onClick={handleSubmit} disabled={saving} className="prestige-gradient border-0">
            {saving ? 'جاري الحفظ...' : 'تسجيل الخدمة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
