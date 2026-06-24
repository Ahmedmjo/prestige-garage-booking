'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Film,
  Users,
  Package,
  Wrench,
  Bot,
  Bell,
  Menu,
  X,
  TrendingUp,
  DollarSign,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dashboard } from '@/components/modules/dashboard'
import { RollsModule } from '@/components/modules/rolls-module'
import { EmployeesModule } from '@/components/modules/employees-module'
import { StockModule } from '@/components/modules/stock-module'
import { ServicesModule } from '@/components/modules/services-module'
import { AIChat } from '@/components/modules/ai-chat'

type TabId = 'dashboard' | 'rolls' | 'employees' | 'stock' | 'services' | 'ai'

const NAV_ITEMS: { id: TabId; label: string; icon: any; color: string }[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, color: '#DC143C' },
  { id: 'rolls', label: 'جرد الرولات', icon: Film, color: '#FF9100' },
  { id: 'employees', label: 'الموظفون', icon: Users, color: '#00C853' },
  { id: 'stock', label: 'المخزون', icon: Package, color: '#BB86FC' },
  { id: 'services', label: 'الخدمات', icon: Wrench, color: '#03DAC6' },
  { id: 'ai', label: 'مساعد برستيج', icon: Bot, color: '#DC143C' },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alertsCount, setAlertsCount] = useState(0)

  useEffect(() => {
    fetch('/api/alerts?unread=true')
      .then(r => r.json())
      .then(data => setAlertsCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
  }, [activeTab])

  return (
    <div className="min-h-screen bg-black text-white flex" dir="rtl">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 z-50 h-screen w-72 bg-[#050505] border-l border-white/5 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo / Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl prestige-gradient flex items-center justify-center prestige-glow">
              <span className="text-2xl font-black">P</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Prestige Garage</h1>
              <p className="text-xs text-gray-500">AI-OS · إدارة ذكية</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden mr-auto p-2 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#DC143C]/15 text-white border-r-2 border-[#DC143C]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} style={{ color: isActive ? item.color : undefined }} />
                <span className="flex-1 text-right">{item.label}</span>
                {item.id === 'ai' && (
                  <span className="w-2 h-2 rounded-full bg-[#DC143C] animate-pulse" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="glass-effect rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#DC143C]/20 flex items-center justify-center">
              <Bell size={14} className="text-[#DC143C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">تنبيهات نشطة</p>
              <p className="text-sm font-bold text-white">{alertsCount} تنبيه</p>
            </div>
            {alertsCount > 0 && (
              <Badge className="bg-[#DC143C] text-white text-xs">{alertsCount}</Badge>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 glass-effect border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg prestige-gradient flex items-center justify-center">
              <span className="text-sm font-black">P</span>
            </div>
            <span className="font-bold">Prestige Garage</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <Menu size={22} />
          </button>
        </header>

        {/* Module content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
              {activeTab === 'rolls' && <RollsModule />}
              {activeTab === 'employees' && <EmployeesModule />}
              {activeTab === 'stock' && <StockModule />}
              {activeTab === 'services' && <ServicesModule />}
              {activeTab === 'ai' && <AIChat />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
