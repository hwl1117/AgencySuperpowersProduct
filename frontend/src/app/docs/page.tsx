'use client'

import { BookOpen, Code, Zap, Brain, Search, Link, ArrowRight } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="w-10 h-10 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">文档中心</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          VideoBrain 使用指南和API文档
        </p>
      </div>

      {/* 快速开始 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6 text-indigo-600" />
          快速开始
        </h2>
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">安装依赖</h3>
                <p className="text-gray-600 text-sm">
                  安装 Node.js 18+、Python 3.10+（Whisper 依赖）、FFmpeg，然后运行 <code className="bg-gray-100 px-2 py-1 rounded">npm install</code> 安装前后端依赖
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">一键启动</h3>
                <p className="text-gray-600 text-sm">
                  双击运行 <code className="bg-gray-100 px-2 py-1 rounded">start-videobrain.bat</code>，自动启动后端 (8000) 和前端 (3000) 并打开浏览器
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">开始使用</h3>
                <p className="text-gray-600 text-sm">
                  粘贴视频链接（支持分享文本自动提取），等待下载 → Whisper 转录 → MiMo AI 分析，即可获得结构化知识
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 核心功能 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Brain className="w-6 h-6 text-indigo-600" />
          核心功能
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <Link className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">视频处理</h3>
            <p className="text-gray-600 text-sm">
              支持抖音、B站、YouTube、快手、TikTok、小红书等平台，一键处理视频内容
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">MiMo AI 分析</h3>
            <p className="text-gray-600 text-sm">
              使用小米 MiMo v2.5 Pro 模型进行内容理解，自动提取标题、摘要、关键要点，生成结构化知识，并能修正 Whisper 转录中的技术术语错误
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">智能相似度搜索</h3>
            <p className="text-gray-600 text-sm">
              加权关键词相似度算法（标题35%，一句话摘要25%，摘要20%，标签15%，全文10%），支持多关键词叠加，快速精准匹配
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">知识管理</h3>
            <p className="text-gray-600 text-sm">
              结构化存储，按分类和标签组织，支持导出和分享
            </p>
          </div>
        </div>
      </section>

      {/* API文档 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Code className="w-6 h-6 text-indigo-600" />
          API文档
        </h2>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <p className="text-gray-600 mb-4">
            完整的API文档请访问：
          </p>
          <a 
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            http://localhost:8000/docs
            <ArrowRight className="w-4 h-4" />
          </a>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-2">常用接口</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/videos/process</code> - 处理视频</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/knowledge/search</code> - 搜索知识库</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/videos/{'{id}'}</code> - 获取视频信息</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/knowledge/stats</code> - 获取统计信息</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 支持平台 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">支持平台</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: '🎵', name: '抖音', url: 'douyin.com' },
            { icon: '📺', name: 'B站', url: 'bilibili.com' },
            { icon: '▶️', name: 'YouTube', url: 'youtube.com' },
            { icon: '🎬', name: '快手', url: 'kuaishou.com' },
            { icon: '🎭', name: 'TikTok', url: 'tiktok.com' },
            { icon: '📕', name: '小红书', url: 'xiaohongshu.com' },
            { icon: '💬', name: '微信视频号', url: 'channels.weixin.qq.com' }
          ].map((platform) => (
            <div key={platform.name} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-3xl mb-2">{platform.icon}</div>
              <div className="font-semibold text-gray-900">{platform.name}</div>
              <div className="text-xs text-gray-500">{platform.url}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 常见问题 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">常见问题</h2>
        
        <div className="space-y-4">
          {[
            {
              q: '处理一个视频需要多长时间？',
              a: '通常需要1-5分钟，取决于视频时长、平台和网络速度。抖音和微信视频号会通过Puppeteer抓取页面数据并尝试下载视频流进行语音转录。'
            },
            {
              q: '支持哪些平台？',
              a: '抖音、B站、YouTube、快手、TikTok、小红书、微信视频号，共7+个平台。支持直接链接和App分享文本（自动提取URL和解析短链接）。'
            },
            {
              q: 'AI 分析使用什么模型？',
              a: '使用小米 MiMo v2.5 Pro 模型，不仅能分析内容生成结构化知识，还能自动修正 Whisper 语音转录中的技术术语错误。'
            },
            {
              q: '如何提高搜索准确度？',
              a: '使用具体关键词，结合分类和平台筛选。搜索算法采用加权匹配：标题(35%) > 一句话摘要(25%) > 摘要(20%) > 标签(15%) > 全文内容(10%)。'
            }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
              <p className="text-gray-600 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}