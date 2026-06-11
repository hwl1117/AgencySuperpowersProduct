'use client'

import { useState, useCallback } from 'react'
import { apiClient, SearchResult } from '@/lib/api'

interface UseSearchOptions {
  defaultQuery?: string
  defaultCategory?: string
  defaultPlatform?: string
}

interface UseSearchReturn {
  query: string
  setQuery: (query: string) => void
  category: string | undefined
  setCategory: (category: string | undefined) => void
  platform: string | undefined
  setPlatform: (platform: string | undefined) => void
  results: SearchResult[]
  isSearching: boolean
  error: string | null
  totalResults: number
  search: () => Promise<void>
  clearResults: () => void
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const [query, setQuery] = useState(options.defaultQuery || '')
  const [category, setCategory] = useState(options.defaultCategory)
  const [platform, setPlatform] = useState(options.defaultPlatform)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState(0)

  const search = useCallback(async () => {
    if (!query.trim()) {
      setError('请输入搜索关键词')
      return
    }

    try {
      setIsSearching(true)
      setError(null)

      // BUG FIX #4: 修复参数名，difficulty -> platform
      const response = await apiClient.searchKnowledge(
        query,
        category,
        platform,
        20
      ) as any

      if (response.success) {
        setResults(response.results || [])
        setTotalResults(response.total || 0)
      } else {
        setError(response.error || '搜索失败')
        setResults([])
        setTotalResults(0)
      }
    } catch (err: any) {
      setError(err.message || '搜索失败')
      setResults([])
      setTotalResults(0)
    } finally {
      setIsSearching(false)
    }
  }, [query, category, platform])

  const clearResults = useCallback(() => {
    setResults([])
    setTotalResults(0)
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    category,
    setCategory,
    platform,
    setPlatform,
    results,
    isSearching,
    error,
    totalResults,
    search,
    clearResults
  }
}