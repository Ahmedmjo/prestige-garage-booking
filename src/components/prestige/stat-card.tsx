'use client'

import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: string
  trend?: number
  delay?: number
}

export function StatCard({ title, value, subtitle, icon: Icon, color = '#DC143C', trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="prestige-card p-5 group relative overflow-hidden"
    >
      {/* Glow effect */}
      <div
        className="absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"
        style={{ background: color }}
      />

      <div className="relative flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20`, color }}
        >
          <Icon size={22} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'text-xs px-2 py-1 rounded-md font-medium',
            trend >= 0 ? 'bg-[#00C853]/15 text-[#00C853]' : 'bg-[#DC143C]/15 text-[#DC143C]'
          )}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="relative">
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  )
}
