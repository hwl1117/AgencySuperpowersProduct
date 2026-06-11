'use client'

import { Brain, Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin absolute -bottom-1 -right-1" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          VideoBrain
        </h2>
        <p className="text-gray-600">
          加载中...
        </p>
      </div>
    </div>
  )
}