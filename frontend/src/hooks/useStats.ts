'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient, StatsResult } from '@/lib/api'

interface UseStatsReturn {
  stats: StatsResult | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<StatsResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await apiClient.getStats()
      setStats(data)
    } catch (err: any) {
      setError(err.message || '获取统计信息失败')
      console.error('获取统计信息失败:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats
  }
}