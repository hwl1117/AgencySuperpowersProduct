'use client'

import { useState, useCallback, useRef } from 'react'
import { apiClient, VideoResult } from '@/lib/api'

interface UseVideoProcessorOptions {
  onProgress?: (progress: number) => void
  onComplete?: (result: VideoResult) => void
  onError?: (error: string) => void
}

interface UseVideoProcessorReturn {
  isProcessing: boolean
  progress: number
  status: string
  result: VideoResult | null
  error: string | null
  processVideo: (url: string) => Promise<void>
  reset: () => void
}

export function useVideoProcessor(options: UseVideoProcessorOptions = {}): UseVideoProcessorReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<VideoResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoIdRef = useRef<number | null>(null)

  const reset = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setIsProcessing(false)
    setProgress(0)
    setStatus('')
    setResult(null)
    setError(null)
    videoIdRef.current = null
  }, [])

  const pollVideoStatus = useCallback(async (videoId: number) => {
    try {
      const data = await apiClient.getVideo(videoId)
      
      setProgress(data.progress || 0)
      setStatus(data.status)

      if (data.status === 'completed') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setIsProcessing(false)
        setResult(data)
        options.onComplete?.(data)
      } else if (data.status === 'failed') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setIsProcessing(false)
        const errMsg = (data as any).error_message || '处理失败'
        setError(errMsg)
        options.onError?.(errMsg)
      }
    } catch (err) {
      console.error('轮询状态失败:', err)
    }
  }, [options])

  const processVideo = useCallback(async (url: string) => {
    try {
      reset()
      setIsProcessing(true)
      setStatus('提交处理任务...')
      setError(null)

      const response = await apiClient.processVideo(url)
      
      if (response.video_id) {
        videoIdRef.current = response.video_id
        setStatus('视频处理中...')
        
        // 开始轮询状态
        pollIntervalRef.current = setInterval(() => {
          if (videoIdRef.current) {
            pollVideoStatus(videoIdRef.current)
          }
        }, 3000)
      }
    } catch (err: any) {
      setIsProcessing(false)
      setError(err.message || '处理失败')
      options.onError?.(err.message || '处理失败')
    }
  }, [reset, pollVideoStatus, options])

  return {
    isProcessing,
    progress,
    status,
    result,
    error,
    processVideo,
    reset
  }
}