'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Clock, Tag, BookOpen, ExternalLink, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { apiClient, VideoResult } from '@/lib/api'
import { LoadingSpinner, StatusBadge, PlatformBadge } from '@/components'
import { formatDuration, formatDate, copyToClipboard } from '@/lib/utils'

export default function VideoDetailPage() {
  const params = useParams()
  const videoId = params.id as string

  const [video, setVideo] = useState<VideoResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchVideo()
  }, [videoId])

  const fetchVideo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiClient.getVideo(videoId)
      setVideo(data as VideoResult)
    } catch (err: any) {
      setError(err.message || '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="加载视频详情..." />
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">加载失败</h2>
          <p className="text-gray-600 mb-6">{error || '视频不存在'}</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </Link>

      {/* 视频信息卡片 */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {video.title || '未命名视频'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <PlatformBadge platform={video.platform} size="sm" />
              <StatusBadge status={video.status} size="sm" />
              {video.duration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(video.duration)}
                </span>
              )}
            </div>
          </div>
          
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
          >
            <ExternalLink className="w-4 h-4" />
            查看原视频
          </a>
        </div>

        {video.description && (
          <p className="text-gray-600 mb-4">{video.description}</p>
        )}

        <div className="text-sm text-gray-500">
          处理时间：{video.processed_at ? formatDate(video.processed_at) : '处理中...'}
        </div>
      </div>

      {/* 摘要 */}
      {video.summary && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            内容摘要
          </h2>
          <p className="text-gray-700 leading-relaxed">{video.summary}</p>
          
          <button
            onClick={() => handleCopy(video.summary)}
            className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                复制摘要
              </>
            )}
          </button>
        </div>
      )}

      {/* 关键点 */}
      {video.key_points && video.key_points.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">关键点</h2>
          <ul className="space-y-3">
            {video.key_points.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  {i + 1}
                </span>
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 标签 */}
      {video.tags && video.tags.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            标签
          </h2>
          <div className="flex flex-wrap gap-2">
            {video.tags.map((tag, i) => (
              <span 
                key={i}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 语音转文字 */}
      {video.transcript && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">语音转文字</h2>
            <button
              onClick={() => handleCopy(video.transcript)}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制全文
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 max-h-96 overflow-y-auto">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {video.transcript}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}