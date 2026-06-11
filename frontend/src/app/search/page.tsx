'use client'

import { useState } from 'react'
import { Search, Filter, BookOpen, Tag, Brain } from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'
import { KnowledgeCard, SearchInput, LoadingSpinner } from '@/components'
import { KNOWLEDGE_CATEGORIES, SUPPORTED_PLATFORMS } from '@/lib/constants'

export default function SearchPage() {
  const {
    query,
    setQuery,
    category,
    setCategory,
    platform: searchPlatform,
    setPlatform: setSearchPlatform,
    results,
    isSearching,
    error,
    totalResults,
    search
  } = useSearch()

  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="w-10 h-10 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">知识库搜索</h1>
        </div>
        <p className="text-gray-600">
          搜索已处理的视频知识，快速找到您需要的信息
        </p>
      </div>

      {/* 搜索区域 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <SearchInput
              value={query}
              onChange={setQuery}
              onSubmit={search}
              placeholder="输入关键词搜索知识库..."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            筛选
          </button>
          <button
            onClick={search}
            disabled={isSearching}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSearching ? (
              <LoadingSpinner size="sm" text="" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            搜索
          </button>
        </div>

        {/* 筛选器 */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              {/* 分类筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  分类
                </label>
                <select
                  value={category || ''}
                  onChange={(e) => setCategory(e.target.value || undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">全部分类</option>
                  {KNOWLEDGE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* 平台筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  平台
                </label>
                <select
                  value={searchPlatform || ''}
                  onChange={(e) => setSearchPlatform(e.target.value || undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">全部平台</option>
                  {SUPPORTED_PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                  ))}
                  <option value="weixin_video">💬 微信视频号</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* 搜索结果 */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              找到 {totalResults} 条相关知识
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((result, i) => (
              <KnowledgeCard
                key={i}
                title={result.metadata.title || '未命名'}
                summary={result.metadata.summary || result.content}
                category={result.metadata.category || '未分类'}
                tags={(() => { try { return JSON.parse(result.metadata.tags || '[]') } catch { return [] } })()}
                platform={result.metadata.source_platform || 'unknown'}
                similarity={result.similarity}
                sourceUrl={result.metadata.source_url}
              />
            ))}
          </div>
        </div>
      )}

      {/* 无结果 */}
      {results.length === 0 && query && !isSearching && !error && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            未找到相关知识
          </h3>
          <p className="text-gray-500">
            尝试使用不同的关键词或调整筛选条件
          </p>
        </div>
      )}

      {/* 初始状态 */}
      {results.length === 0 && !query && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            开始搜索
          </h3>
          <p className="text-gray-500">
            输入关键词搜索已处理的视频知识
          </p>
        </div>
      )}
    </div>
  )
}