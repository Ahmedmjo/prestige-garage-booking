'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, AlertTriangle, AlertCircle, Info, CheckCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { formatNumber } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface AlertItem {
  id: string
  type: string
  severity: string
  title: string
  message: string
  createdAt: string
}

export function NotificationBell() {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadAlerts() {
    try {
      const res = await fetch('/api/alerts?unread=true')
      const data = await res.json()
      setAlerts(Array.isArray(data) ? data : [])
    } catch (e) {
      // silent
    }
  }

  async function markAllRead() {
    setLoading(true)
    try {
      for (const a of alerts) {
        await fetch(`/api/alerts/${a.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        })
      }
      setAlerts([])
      toast.success(lang === 'ar' ? 'تم تعليم الكل كمقروء' : 'Marked all as read')
    } catch (e) {
      toast.error(lang === 'ar' ? 'فشل التحديث' : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const warningCount = alerts.filter(a => a.severity === 'warning').length

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open) loadAlerts() }}
        className="relative w-10 h-10 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#DC143C]/30 transition-all flex items-center justify-center"
        aria-label={t('notifications')}
      >
        <Bell size={18} className="text-gray-300" />

        {/* Badge count */}
        {alerts.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
              criticalCount > 0
                ? 'bg-[#DC143C] text-white animate-pulse'
                : 'bg-[#FF9100] text-black'
            }`}
          >
            {alerts.length > 9 ? '9+' : alerts.length}
          </motion.span>
        )}

        {/* Pulsing ring */}
        {criticalCount > 0 && (
          <span className="absolute inset-0 rounded-lg border-2 border-[#DC143C] animate-ping opacity-30" />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-12 left-0 w-80 md:w-96 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#DC143C]" />
                <h3 className="font-bold text-white text-sm">{t('notifications')}</h3>
                {alerts.length > 0 && (
                  <Badge className="bg-[#DC143C]/20 text-[#DC143C] border-[#DC143C]/30 text-xs">
                    {alerts.length}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                {alerts.length > 0 && (
                  <button
                    onClick={markAllRead}
                    disabled={loading}
                    className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white"
                    title={t('markAllRead')}
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Summary bar */}
            {alerts.length > 0 && (
              <div className="px-3 py-2 bg-black/30 border-b border-white/5 flex gap-3 text-xs">
                {criticalCount > 0 && (
                  <span className="flex items-center gap-1 text-[#DC143C]">
                    <AlertCircle size={12} />
                    {criticalCount} {lang === 'ar' ? 'حرجة' : 'critical'}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="flex items-center gap-1 text-[#FF9100]">
                    <AlertTriangle size={12} />
                    {warningCount} {lang === 'ar' ? 'تحذيرات' : 'warnings'}
                  </span>
                )}
              </div>
            )}

            {/* Alerts list */}
            <ScrollArea className="max-h-96">
              <div className="p-2">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell size={32} className="mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-500">{t('noNotifications')}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {alerts.map((alert, idx) => {
                      const icon = alert.severity === 'critical' ? AlertCircle :
                                   alert.severity === 'warning' ? AlertTriangle : Info
                      const Icon = icon
                      const color = alert.severity === 'critical' ? '#DC143C' :
                                    alert.severity === 'warning' ? '#FF9100' : '#03DAC6'
                      return (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="p-2.5 rounded-lg bg-white/3 border-r-2 hover:bg-white/5 transition-colors"
                          style={{ borderColor: color }}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                              style={{ background: color + '20' }}
                            >
                              <Icon size={14} style={{ color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{alert.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{alert.message}</p>
                              <p className="text-[10px] text-gray-600 mt-1">
                                {new Date(alert.createdAt).toLocaleString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
