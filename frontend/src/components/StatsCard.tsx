'use client'

import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  color?: 'indigo' | 'purple' | 'pink' | 'green' | 'blue'
}

const colorClasses = {
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-600',
    value: 'text-indigo-700'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    value: 'text-purple-700'
  },
  pink: {
    bg: 'bg-pink-100',
    text: 'text-pink-600',
    value: 'text-pink-700'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    value: 'text-green-700'
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    value: 'text-blue-700'
  }
}

export default function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  color = 'indigo' 
}: StatsCardProps) {
  const colors = colorClasses[color]

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
        </div>
      </div>
    </div>
  )
}