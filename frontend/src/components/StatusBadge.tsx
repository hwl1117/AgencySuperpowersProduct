'use client'

import { CheckCircle, Clock, Loader2, AlertCircle, XCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
  completed: {
    icon: CheckCircle,
    label: '已完成',
    color: 'bg-green-100 text-green-700'
  },
  processing: {
    icon: Loader2,
    label: '处理中',
    color: 'bg-blue-100 text-blue-700'
  },
  pending: {
    icon: Clock,
    label: '等待中',
    color: 'bg-yellow-100 text-yellow-700'
  },
  downloading: {
    icon: Loader2,
    label: '下载中',
    color: 'bg-indigo-100 text-indigo-700'
  },
  extracting: {
    icon: Loader2,
    label: '提取中',
    color: 'bg-yellow-100 text-yellow-700'
  },
  transcribing: {
    icon: Loader2,
    label: '转录中',
    color: 'bg-blue-100 text-blue-700'
  },
  analyzing: {
    icon: Loader2,
    label: '分析中',
    color: 'bg-purple-100 text-purple-700'
  },
  failed: {
    icon: XCircle,
    label: '失败',
    color: 'bg-red-100 text-red-700'
  }
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    icon: AlertCircle, 
    label: status, 
    color: 'bg-gray-100 text-gray-700' 
  }
  
  const Icon = config.icon
  const isAnimating = ['processing', 'downloading', 'extracting', 'transcribing', 'analyzing'].includes(status)

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}>
      <Icon className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
      <span>{config.label}</span>
    </span>
  )
}