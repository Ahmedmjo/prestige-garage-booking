'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, AlertTriangle, AlertCircle, Info, CheckCheck, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
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
  const [hasViewed, setHasViewed] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  async function loadAlerts() {
    try {
      const res = await fetch('/api/alerts?unread=true')
      const data = await res.json()
      const newAlerts = Array.isArray(data) ? data : []
      // If new alerts arrived, reset viewed state
      if (newAlerts.length > alerts.length) {
        setHasViewed(false)
      }
      setAlerts(newAlerts)
    } catch (e) {
      // silent
    }
  }

  function handleBellClick() {
    if (!open) {
      // Opening — mark as viewed (color change) but keep alerts visible
      setHasViewed(true)
      loadAlerts()
    }
    setOpen(!open)
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
      setHasViewed(false)
      toast.success(lang === 'ar' ? 'تم تعليم الكل كمقروء' : 'Marked all as read')
    } catch (e) {
      toast.error(lang === 'ar' ? 'فشل التحديث' : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  async function markOneRead(id: string) {
    try {
      await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })
      setAlerts(prev => prev.filter(a => a.id !== id))
    } catch (e) {
      // silent
    }
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const warningCount = alerts.filter(a => a.severity === 'warning').length

  // "Viewed" state: bell color changes to indicate viewed
  const bellColor = alerts.length === 0
    ? '#666'  // no alerts: gray
    : hasViewed && !open
    ? '#888'  // viewed but not open: lighter gray (viewed state)
    : '#DC143C'  // unread: red

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        className="relative w-10 h-10 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#DC143C]/30 flex items-center justify-center"
        style={{ transition: 'background-color 0.15s, border-color 0.15s' }}
        aria-label={t('notifications')}
      >
        <Bell size={18} style={{ color: bellColor, transition: 'color 0.2s' }} />

        {/* Badge count — only shown when not viewed */}
        {alerts.length > 0 && !hasViewed && (
          <span
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
              criticalCount > 0
                ? 'bg-[#DC143C] text-white'
                : 'bg-[#FF9100] text-black'
            }`}
          >
            {alerts.length > 9 ? '9+' : alerts.length}
          </span>
        )}

        {/* "Viewed" indicator — green check mark when viewed but still has alerts */}
        {alerts.length > 0 && hasViewed && !open && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00C853] border border-black flex items-center justify-center">
            <Check size={8} className="text-white" strokeWidth={3} />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-12 z-50 w-80 md:w-96 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          style={{
            left: lang === 'en' ? 'auto' : '0',
            right: lang === 'en' ? '0' : 'auto',
          }}
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
                  {alerts.map((alert) => {
                    const Icon = alert.severity === 'critical' ? AlertCircle :
                                 alert.severity === 'warning' ? AlertTriangle : Info
                    const color = alert.severity === 'critical' ? '#DC143C' :
                                  alert.severity === 'warning' ? '#FF9100' : '#03DAC6'
                    return (
                      <div
                        key={alert.id}
                        className="p-2.5 rounded-lg bg-white/3 border-r-2 hover:bg-white/5 group"
                        style={{ borderColor: color, transition: 'background-color 0.15s' }}
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
                          <button
                            onClick={() => markOneRead(alert.id)}
                            className="p-1 rounded text-gray-500 hover:text-white opacity-0 group-hover:opacity-100"
                            style={{ transition: 'opacity 0.15s' }}
                            title={lang === 'ar' ? 'تعليم كمقروء' : 'Mark as read'}
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
