'use client'

import { Brain, Github, BookOpen, Zap } from 'lucide-react'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">VideoBrain</h1>
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] font-medium">v2.6</span>
              </div>
              <p className="text-xs text-gray-500">短视频智能知识库</p>
            </div>
          </Link>

          {/* 导航 */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <Zap className="w-4 h-4" />
              处理视频
            </Link>
            <Link 
              href="/search"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              知识库
            </Link>
            <Link 
              href="/docs"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              文档
            </Link>
          </nav>

          {/* 右侧按钮 */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/yourusername/videobrain"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Github className="w-5 h-5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}