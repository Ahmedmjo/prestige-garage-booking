'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Package, Plus, Search, ArrowDownCircle, ArrowUpCircle,
  AlertTriangle, XCircle, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface StockItem {
  id: string
  name: string
  category: string
  unit: string
  totalReceived: number
  totalWithdrawn: number
  currentQty: number
  minLevel: number
  status: string
  unitPrice: number
}

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: '📦' },
  { id: 'ديتيلنج', label: 'ديتيلنج', icon: '🧴' },
  { id: 'بوليش وكوتينج', label: 'بوليش وكوتينج', icon: '✨' },
  { id: 'أدوات ومعدات', label: 'أدوات ومعدات', icon: '🔧' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  'كافي': { label: 'كافي', color: '#00C853', bg: 'rgba(0,200,83,0.12)', icon: CheckCircle2 },
  'منخفض': { label: 'منخفض', color: '#FF9100', bg: 'rgba(255,145,0,0.12)', icon: AlertTriangle },
  'نفد': { label: 'نفد', color: '#DC143C', bg: 'rgba(220,20,60,0.12)', icon: XCircle },
}

export function StockModule() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [showMovementDialog, setShowMovementDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)

  useEffect(() => {
    loadItems()
  }, [category])

  async function loadItems() {
    setLoading(true)
    try {
      const res = await fetch(`/api/stock${category !== 'all' ? `?category=${encodeURIComponent(category)}` : ''}`)
      const data = await res.json()
      setItems(data)
    } catch (e) {
      toast.error('فشل تحميل المخزون')
    } finally {
      setLoading(false)
    }
  }

  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))

  const stats = {
    total: items.length,
    low: items.filter(i => i.status === 'منخفض').length,
    out: items.filter(i => i.status === 'نفد').length,
    value: items.reduce((s, i) => s + (i.currentQty * i.unitPrice), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Package className="text-[#BB86FC]" />
            المخزون والخامات
          </h1>
          <p className="text-gray-400 mt-1">إدارة خامات الديتيلنج والبوليش والأدوات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="prestige-card p-4">
          <p className="text-xs text-gray-400">إجمالي الأصناف</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="prestige-card p-4">
          <p className="text-xs text-gray-400">مخزون منخفض</p>
          <p className="text-2xl font-bold text-[#FF9100] mt-1">{stats.low}</p>
        </div>
        <div className="prestige-card p-4">
          <p className="text-xs text-gray-400">نفد من المخزون</p>
          <p className="text-2xl font-bold text-[#DC143C] mt-1">{stats.out}</p>
        </div>
        <div className="prestige-card p-4">
          <p className="text-xs text-gray-400">قيمة المخزون</p>
          <p className="text-xl font-bold text-white mt-1">{Math.round(stats.value).toLocaleString('ar-EG')}</p>
          <p className="text-xs text-gray-500">ج.م</p>
        </div>
      </div>

      {/* Category tabs */}
      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="bg-[#0A0A0A] border border-white/10 p-1 flex-wrap h-auto">
          {CATEGORIES.map(c => (
            <TabsTrigger
              key={c.id}
              value={c.id}
              className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white text-gray-400"
            >
              <span className="ml-1">{c.icon}</span>
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <Input
          placeholder="بحث عن صنف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#0A0A0A] border-white/10 text-white pr-10 placeholder:text-gray-600"
        />
      </div>

      {/* Items table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">لا توجد أصناف</div>
      ) : (
        <div className="prestige-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-right">
                  <th className="py-3 px-4 text-gray-400 font-medium">الصنف</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">الفئة</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">الوحدة</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">المستلم</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">المسحوب</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">الحالي</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">حد أدنى</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">الحالة</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG['كافي']
                  const StatusIcon = status.icon
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/3"
                    >
                      <td className="py-3 px-4 text-white font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-gray-400">{item.category}</td>
                      <td className="py-3 px-4 text-gray-400">{item.unit}</td>
                      <td className="py-3 px-4 text-gray-300">{item.totalReceived}</td>
                      <td className="py-3 px-4 text-gray-300">{item.totalWithdrawn}</td>
                      <td className="py-3 px-4 font-bold text-white">{item.currentQty}</td>
                      <td className="py-3 px-4 text-gray-500">{item.minLevel}</td>
                      <td className="py-3 px-4">
                        <Badge
                          style={{ background: status.bg, color: status.color, borderColor: status.color + '40' }}
                          className="border text-xs flex items-center gap-1 w-fit"
                        >
                          <StatusIcon size={10} />
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setSelectedItem(item); setShowMovementDialog(true) }}
                            className="p-1.5 rounded-md bg-[#00C853]/15 text-[#00C853] hover:bg-[#00C853]/25"
                            title="استلام"
                          >
                            <ArrowDownCircle size={14} />
                          </button>
                          <button
                            onClick={() => { setSelectedItem(item); setShowMovementDialog(true) }}
                            className="p-1.5 rounded-md bg-[#FF9100]/15 text-[#FF9100] hover:bg-[#FF9100]/25"
                            title="سحب"
                          >
                            <ArrowUpCircle size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movement Dialog */}
      <MovementDialog
        open={showMovementDialog}
        onOpenChange={setShowMovementDialog}
        item={selectedItem}
        onSuccess={loadItems}
      />
    </div>
  )
}

function MovementDialog({ open, onOpenChange, item, onSuccess }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: StockItem | null
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    movementType: 'استلام',
    quantity: '',
    unitPrice: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    deliveryNote: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setForm({
        movementType: 'استلام',
        quantity: '',
        unitPrice: String(item.unitPrice || ''),
        date: new Date().toISOString().split('T')[0],
        notes: '',
        deliveryNote: '',
      })
    }
  }, [item, open])

  async function handleSubmit() {
    if (!item || !form.quantity) {
      toast.error('الكمية مطلوبة')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/stock/${item.id}/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'فشل التسجيل')
      }
      toast.success(`تم ${form.movementType} ${form.quantity} ${item.unit} من ${item.name}`)
      onOpenChange(false)
      onSuccess()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-white">حركة مخزون — {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-white/5 rounded-lg p-3 text-sm flex justify-between">
            <span className="text-gray-400">الرصيد الحالي:</span>
            <span className="font-bold text-white">{item.currentQty} {item.unit}</span>
          </div>
          <div>
            <Label className="text-gray-400 text-xs">نوع الحركة</Label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setForm({ ...form, movementType: 'استلام' })}
                className={`flex-1 py-2 rounded-md text-sm font-medium ${
                  form.movementType === 'استلام'
                    ? 'bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/40'
                    : 'bg-white/5 text-gray-400 border border-white/10'
                }`}
              >
                <ArrowDownCircle size={14} className="inline ml-1" />
                استلام
              </button>
              <button
                onClick={() => setForm({ ...form, movementType: 'سحب' })}
                className={`flex-1 py-2 rounded-md text-sm font-medium ${
                  form.movementType === 'سحب'
                    ? 'bg-[#FF9100]/20 text-[#FF9100] border border-[#FF9100]/40'
                    : 'bg-white/5 text-gray-400 border border-white/10'
                }`}
              >
                <ArrowUpCircle size={14} className="inline ml-1" />
                سحب
              </button>
            </div>
          </div>
          <div>
            <Label className="text-gray-400 text-xs">الكمية *</Label>
            <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">سعر الوحدة (ج.م)</Label>
            <Input type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">رقم إذن التسليم</Label>
            <Input value={form.deliveryNote} onChange={e => setForm({ ...form, deliveryNote: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" placeholder="DN 1234" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">ملاحظات</Label>
            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-[#000] border-white/10 text-white mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400">إلغاء</Button>
          <Button onClick={handleSubmit} disabled={saving} className="prestige-gradient border-0">
            {saving ? 'جاري الحفظ...' : 'تسجيل الحركة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
