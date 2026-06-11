'use client'

import { Tag, Clock, ExternalLink, BarChart3 } from 'lucide-react'

interface KnowledgeCardProps {
  title: string
  summary: string
  category: string
  tags: string[]
  platform: string
  similarity?: number
  duration?: number
  sourceUrl?: string
  onClick?: () => void
}

const platformIcons: Record<string, string> = {
  douyin: '🎵',
  bilibili: '📺',
  youtube: '▶️',
  kuaishou: '🎬',
  tiktok: '🎭',
  xiaohongshu: '📕',
  weixin_video: '💬'
}

const platformNames: Record<string, string> = {
  douyin: '抖音',
  bilibili: 'B站',
  youtube: 'YouTube',
  kuaishou: '快手',
  tiktok: 'TikTok',
  xiaohongshu: '小红书',
  weixin_video: '微信视频号'
}

export default function KnowledgeCard({
  title,
  summary,
  category,
  tags,
  platform,
  similarity,
  duration,
  sourceUrl,
  onClick
}: KnowledgeCardProps) {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border border-gray-100 hover:border-indigo-200"
      onClick={onClick}
    >
      {/* 头部 */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
          {title}
        </h3>
        {similarity !== undefined && (
          <span className="ml-3 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm whitespace-nowrap">
            {(similarity * 100).toFixed(1)}%
          </span>
        )}
      </div>

      {/* 摘要 */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {summary}
      </p>

      {/* 元信息 */}
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          {platformIcons[platform] || '🎥'}
          {platformNames[platform] || platform}
        </span>
        <span className="flex items-center gap-1">
          <Tag className="w-4 h-4" />
          {category}
        </span>
        {duration && (
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>

      {/* 标签 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 5).map((tag, i) => (
            <span 
              key={i}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 5 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              +{tags.length - 5}
            </span>
          )}
        </div>
      )}

      {/* 操作 */}
      {sourceUrl && (
        <div className="pt-4 border-t border-gray-100">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
            查看原视频
          </a>
        </div>
      )}
    </div>
  )
}