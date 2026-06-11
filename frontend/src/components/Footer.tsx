'use client'

import { Brain, Github, Heart } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo和描述 */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">VideoBrain</h3>
                <p className="text-sm text-gray-500">短视频智能知识库</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4 max-w-md">
              结合 Agency-Agents 与 Superpowers 的智能知识库系统，通过短视频平台链接，一键识别视频内容并概括优化成知识库。
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/yourusername/videobrain"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">快速链接</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm hover:text-white transition-colors">
                  处理视频
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm hover:text-white transition-colors">
                  搜索知识
                </Link>
              </li>
              <li>
                <Link href="/library" className="text-sm hover:text-white transition-colors">
                  知识库
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm hover:text-white transition-colors">
                  文档
                </Link>
              </li>
            </ul>
          </div>

          {/* 支持平台 */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">支持平台</h4>
            <ul className="space-y-2">
              <li className="text-sm">🎵 抖音</li>
              <li className="text-sm">📺 B站</li>
              <li className="text-sm">▶️ YouTube</li>
              <li className="text-sm">🎬 快手</li>
              <li className="text-sm">🎭 TikTok</li>
              <li className="text-sm">📕 小红书</li>
              <li className="text-sm">💬 微信视频号</li>
            </ul>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} VideoBrain v2.6. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Made with <Heart className="w-3 h-3 inline text-red-500" /> by VideoBrain Team
          </p>
        </div>
      </div>
    </footer>
  )
}