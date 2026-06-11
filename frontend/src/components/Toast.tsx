'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastProps {
  toasts: ToastItem[]
  onRemove: (id: number) => void
}

let globalId = 0
const listeners: Set<(t: ToastItem) => void> = new Set()

export function showToast(type: ToastType, message: string) {
  const toast: ToastItem = { id: ++globalId, type, message }
  listeners.forEach(fn => fn(toast))
}

export default function ToastContainer({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--success)' }} />,
    error: <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--error)' }} />,
    info: <Info className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--info)' }} />,
  }

  const bgColors: Record<ToastType, string> = {
    success: 'status-success',
    error: 'status-error',
    info: 'status-info',
  }

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-in ${bgColors[toast.type]}`}
          style={{ animation: 'slideIn 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards' }}
        >
          {icons[toast.type]}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export { listeners }
