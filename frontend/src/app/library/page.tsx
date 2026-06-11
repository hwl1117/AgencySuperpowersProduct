'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Brain, Tag, Filter } from 'lucide-react'
import { apiClient, VideoResult } from '@/lib/api'
import { KnowledgeCard, LoadingSpinner, StatsCard } from '@/components'
import { KNOWLEDGE_CATEGORIES } from '@/lib/constants'

export default function LibraryPage() {
  const [videos, setVideos] = useState<VideoResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 获取视频列表和统计信息
      const [videosResponse, statsResponse] = await Promise.all([
        apiClient.listVideos(1, 50, 'completed'),
        apiClient.getStats()
      ])

      setVideos((videosResponse as any).videos || [])
      setStats(statsResponse)
    } catch (err: any) {
      setError(err.message || '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 按分类筛选
  const filteredVideos = selectedCategory
    ? videos.filter(v => v.category === selectedCategory)
    : videos

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="加载知识库..." />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="w-10 h-10 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">知识库</h1>
        </div>
        <p className="text-gray-600">
          浏览已处理的视频知识，按分类探索
        </p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard
            icon={BookOpen}
            label="知识条目"
            value={stats.total_entries}
            color="indigo"
          />
          <StatsCard
            icon={Tag}
            label="知识分类"
            value={stats.category_count}
            color="purple"
          />
          <StatsCard
            icon={Filter}
            label="支持平台"
            value={Object.keys(stats.platform_distribution || {}).length}
            color="pink"
          />
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* 分类标签 */}
      {stats?.categories && stats.categories.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            按分类筛选
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {stats.categories.map((category: string) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 知识列表 */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVideos.map((video) => (
            <KnowledgeCard
              key={video.id}
              title={video.title || '未命名'}
              summary={video.summary || ''}
              category={video.category || '未分类'}
              tags={video.tags || []}
              platform={video.platform}
              duration={video.duration}
              sourceUrl={video.url}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {selectedCategory ? '该分类下暂无知识' : '知识库为空'}
          </h3>
          <p className="text-gray-500">
            {selectedCategory 
              ? '尝试选择其他分类或清除筛选条件'
              : '请先处理一些视频来构建知识库'
            }
          </p>
        </div>
      )}
    </div>
  )
}