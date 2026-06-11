'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { Search, Link, Brain, BookOpen, Zap, Loader2, CheckCircle, AlertCircle, Tag, Clock, BarChart3, FileText, X, ChevronDown, ChevronUp, ExternalLink, Copy, Download, Edit3, Trash2, FolderPlus, Move, Save, Plus, GripVertical, Check, ArrowRight, LayoutGrid, List, Filter, MoreVertical, Folder, FolderOpen, Keyboard, Sun, Moon } from 'lucide-react'
import ToastContainer, { showToast, listeners } from '@/components/Toast'
import type { ToastType } from '@/components/Toast'
import dynamic from 'next/dynamic'

// 动态导入 Shader 组件（避免 SSR 报错，WebGL 需要浏览器环境）
const VideoBrainShader = dynamic(() => import('@/components/VideoBrainShader'), {
  ssr: false,
  loading: () => <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))', opacity: 0.15 }} />
})

interface VideoResult {
  id: string
  url: string
  platform: string
  title: string
  description: string
  duration: number
  status: string
  progress: number
  processing_detail: string
  transcript: string
  transcript_preview: string
  transcript_length: number
  has_transcript: boolean
  summary: string
  one_line_summary: string
  key_points: string[]
  tags: string[]
  category: string
  created_at: string
  processed_at: string
}

interface SearchResult {
  doc_id: string
  content: string
  metadata: {
    title: string
    summary: string
    one_line_summary: string
    category: string
    tags: string
    source_platform: string
    source_url: string
    similarity: number
    has_transcript: boolean
    transcript_length: number
    video_id: string
  }
  similarity: number
}

interface CategoryInfo {
  name: string
  count: number
  videos: { id: string; title: string; platform: string; one_line_summary: string }[]
}

const API = 'http://localhost:8000'

export default function Home() {
  const [videoUrl, setVideoUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingDetail, setProcessingDetail] = useState('')
  const [videoResults, setVideoResults] = useState<VideoResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [activeTab, setActiveTab] = useState<'process' | 'search' | 'library'>('process')
  const [stats, setStats] = useState({ total_entries: 0, categories: [] as string[], category_count: 0, platform_distribution: {} as Record<string, number> })
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showFullTranscript, setShowFullTranscript] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true)

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<VideoResult>>({})
  const [editKeyPointInput, setEditKeyPointInput] = useState('')
  const [editTagInput, setEditTagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // 删除状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<VideoResult | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBatchActions, setShowBatchActions] = useState(false)

  // 分类管理状态
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [uncategorized, setUncategorized] = useState<CategoryInfo>({ name: '未分类', count: 0, videos: [] })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [showMoveToCategory, setShowMoveToCategory] = useState(false)
  const [moveTargetVideoIds, setMoveTargetVideoIds] = useState<string[]>([])

  // 删除分类确认
  const [showDeleteCatConfirm, setShowDeleteCatConfirm] = useState<string | null>(null)

  // 排序状态
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest')

  // Toast 通知
  const [toasts, setToasts] = useState<{ id: number; type: ToastType; message: string }[]>([])

  // 主题状态
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // 字体大小状态
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')

  useEffect(() => {
    // 注册 toast 监听
    const handler = (toast: { id: number; type: ToastType; message: string }) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 3000)
    }
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [])

  // 初始化主题和字体大小
  useEffect(() => {
    const savedTheme = localStorage.getItem('videobrain-theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      // 检测系统主题偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const defaultTheme = prefersDark ? 'dark' : 'light'
      setTheme(defaultTheme)
      document.documentElement.setAttribute('data-theme', defaultTheme)
    }

    // 初始化字体大小
    const savedFontSize = localStorage.getItem('videobrain-font-size') as 'small' | 'medium' | 'large' | null
    if (savedFontSize) {
      setFontSize(savedFontSize)
      document.documentElement.setAttribute('data-font-size', savedFontSize)
    }
  }, [])

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('videobrain-theme', newTheme)
  }

  // 切换字体大小
  const toggleFontSize = () => {
    const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large']
    const currentIndex = sizes.indexOf(fontSize)
    const newSize = sizes[(currentIndex + 1) % sizes.length]
    setFontSize(newSize)
    document.documentElement.setAttribute('data-font-size', newSize)
    localStorage.setItem('videobrain-font-size', newSize)
  }

  // 获取字体大小显示文本
  const getFontSizeLabel = () => {
    switch (fontSize) {
      case 'small': return '小'
      case 'medium': return '中'
      case 'large': return '大'
    }
  }

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+S 保存编辑
      if (e.ctrlKey && e.key === 's' && isEditing) { e.preventDefault(); saveEditing() }
      // Ctrl+K 跳转搜索
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setActiveTab('search') }
      // Ctrl+L 跳转知识库
      if (e.ctrlKey && e.key === 'l') { e.preventDefault(); setActiveTab('library') }
      // Escape 关闭弹窗
      if (e.key === 'Escape') {
        if (showDeleteConfirm) setShowDeleteConfirm(false)
        else if (showMoveToCategory) setShowMoveToCategory(false)
        else if (showDeleteCatConfirm) setShowDeleteCatConfirm(null)
        else if (showDetail) { setShowDetail(false); setIsEditing(false) }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isEditing, showDeleteConfirm, showMoveToCategory, showDeleteCatConfirm, showDetail])

  useEffect(() => { fetchStats(); fetchAllVideos(); fetchCategories() }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch(API + '/api/knowledge/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) { console.error('获取统计失败:', error) }
  }

  const fetchAllVideos = async () => {
    setIsLoadingLibrary(true)
    try {
      const response = await fetch(API + '/api/videos?page=1&page_size=100')
      const data = await response.json()
      if (data.videos && data.videos.length > 0) {
        setVideoResults(data.videos)
      }
    } catch (error) { console.error('获取视频列表失败:', error) }
    setIsLoadingLibrary(false)
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(API + '/api/categories')
      const data = await response.json()
      setCategories(data.categories || [])
      setUncategorized(data.uncategorized || { name: '未分类', count: 0, videos: [] })
    } catch (error) { console.error('获取分类失败:', error) }
  }

  const handleProcessVideo = async () => {
    if (!videoUrl.trim()) {
      showToast('info', '请先粘贴视频链接')
      return
    }
    setIsProcessing(true)
    setProcessingStatus('正在提交处理任务...')
    setProcessingProgress(0)
    setProcessingDetail('')
    try {
      const response = await fetch(API + '/api/videos/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl })
      })
      const data = await response.json()
      if (data.video_id) {
        setProcessingStatus('视频处理中，请稍候...')
        pollVideoStatus(data.video_id)
      } else if (data.detail) {
        setProcessingStatus('错误: ' + data.detail)
        setIsProcessing(false)
      }
    } catch (error) {
      setProcessingStatus('处理失败，请检查网络连接')
      setIsProcessing(false)
    }
  }

  // BUG FIX #1: 使用 ref 存储 polling interval，确保组件卸载时清理
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // BUG FIX #1: 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  const pollVideoStatus = async (videoId: string) => {
    // BUG FIX #1: 清理之前的轮询（防止重复处理导致多个interval）
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(API + '/api/videos/' + videoId)
        const data = await response.json()
        setProcessingProgress(data.progress || 0)
        setProcessingDetail(data.processing_detail || '')
        const statusMap: Record<string, string> = { 'downloading': '正在下载视频...', 'extracting': '正在提取音频...', 'transcribing': '正在进行语音转文字...', 'analyzing': '正在进行AI深度分析...', 'completed': '处理完成！', 'failed': '处理失败' }
        setProcessingStatus(statusMap[data.status] || '处理中...')
        if (data.status === 'completed') {
          if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null }
          setProcessingStatus('处理完成！')
          setProcessingProgress(100)
          setIsProcessing(false)
          setVideoUrl('')
          setVideoResults(prev => [data, ...prev.filter(v => v.id !== data.id)])
          fetchStats(); fetchCategories()
          setSelectedVideo(data); setShowDetail(true)
          showToast('success', '视频处理完成！已自动打开详情')
        } else if (data.status === 'failed') {
          if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null }
          const errMsg = data.processing_detail || data.error_message || '未知错误'
          setProcessingStatus('处理失败: ' + errMsg)
          setIsProcessing(false)
          showToast('error', '视频处理失败: ' + errMsg)
        }
      } catch (error) {
        if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null }
        setProcessingStatus('获取状态失败')
        setIsProcessing(false)
      }
    }, 2000)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showToast('info', '请输入搜索关键词')
      return
    }
    try {
      const response = await fetch(API + '/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 20 })
      })
      const data = await response.json()
      setSearchResults(data.results || [])
      if (data.results?.length === 0) {
        showToast('info', '未找到相关内容，试试其他关键词')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      showToast('error', '搜索失败，请检查网络')
    }
  }

  const openVideoDetail = async (videoId: string, startEdit = false) => {
    try {
      const response = await fetch(API + '/api/videos/' + videoId)
      const data = await response.json()
      setSelectedVideo(data)
      setShowDetail(true)
      setShowFullTranscript(false)
      // 修复竞态：在视频加载完成后直接进入编辑模式
      if (startEdit) {
        setEditForm({
          title: data.title || '',
          summary: data.summary || '',
          one_line_summary: data.one_line_summary || '',
          key_points: [...(data.key_points || [])],
          tags: [...(data.tags || [])],
          category: data.category || '',
          description: data.description || '',
        })
        setIsEditing(true)
      } else {
        setIsEditing(false)
      }
    } catch (error) { console.error('获取视频详情失败:', error) }
  }

  const copyTranscript = () => {
    if (selectedVideo?.transcript) {
      navigator.clipboard.writeText(selectedVideo.transcript).then(() => {
        setCopied(true)
        showToast('success', '已复制转录全文到剪贴板')
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => showToast('error', '复制失败'))
    }
  }

  // ===== 编辑功能 =====
  const startEditing = () => {
    if (!selectedVideo) return
    setEditForm({
      title: selectedVideo.title || '',
      summary: selectedVideo.summary || '',
      one_line_summary: selectedVideo.one_line_summary || '',
      key_points: [...(selectedVideo.key_points || [])],
      tags: [...(selectedVideo.tags || [])],
      category: selectedVideo.category || '',
      description: selectedVideo.description || '',
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditForm({})
    setEditKeyPointInput('')
    setEditTagInput('')
  }

  const saveEditing = async () => {
    if (!selectedVideo) return
    setIsSaving(true)
    try {
      const response = await fetch(API + '/api/videos/' + selectedVideo.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      const data = await response.json()
      if (data.success) {
        setSelectedVideo(data.video)
        setIsEditing(false)
        setEditForm({})
        setVideoResults(prev => prev.map(v => v.id === data.video.id ? { ...v, ...data.video } : v))
        fetchCategories()
        fetchStats()
        showToast('success', '保存成功！知识条目已更新')
      } else {
        showToast('error', '保存失败: ' + (data.detail || '未知错误'))
      }
    } catch (error) {
      console.error('保存失败:', error)
      showToast('error', '保存失败，请检查网络连接')
    }
    setIsSaving(false)
  }

  const addKeyPoint = () => {
    if (!editKeyPointInput.trim()) return
    setEditForm(prev => ({ ...prev, key_points: [...(prev.key_points || []), editKeyPointInput.trim()] }))
    setEditKeyPointInput('')
  }

  const removeKeyPoint = (index: number) => {
    setEditForm(prev => ({ ...prev, key_points: (prev.key_points || []).filter((_, i) => i !== index) }))
  }

  const addTag = () => {
    if (!editTagInput.trim()) return
    const newTag = editTagInput.trim().replace(/^#/, '')
    if (newTag && !(editForm.tags || []).includes(newTag)) {
      setEditForm(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }))
    }
    setEditTagInput('')
  }

  const removeTag = (index: number) => {
    setEditForm(prev => ({ ...prev, tags: (prev.tags || []).filter((_, i) => i !== index) }))
  }

  // ===== 删除功能 =====
  const confirmDelete = (video: VideoResult) => {
    setDeleteTarget(video)
    setShowDeleteConfirm(true)
  }

  const executeDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const response = await fetch(API + '/api/videos/' + deleteTarget.id, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        const title = deleteTarget.title
        setVideoResults(prev => prev.filter(v => v.id !== deleteTarget.id))
        setShowDeleteConfirm(false)
        setDeleteTarget(null)
        setShowDetail(false)
        setSelectedVideo(null)
        fetchStats()
        fetchCategories()
        showToast('success', `已删除「${title}」`)
      }
    } catch (error) {
      console.error('删除失败:', error)
      showToast('error', '删除失败，请重试')
    }
    setIsDeleting(false)
  }

  const toggleSelectVideo = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllVideos = () => {
    const filtered = getFilteredVideos()
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(v => v.id)))
    }
  }

  const batchDelete = async () => {
    if (selectedIds.size === 0) return
    setIsDeleting(true)
    try {
      const response = await fetch(API + '/api/videos/delete-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      })
      const data = await response.json()
      if (data.success) {
        const count = data.deleted_count || selectedIds.size
        setVideoResults(prev => prev.filter(v => !selectedIds.has(v.id)))
        setSelectedIds(new Set())
        setShowBatchActions(false)
        fetchStats()
        fetchCategories()
        showToast('success', `已批量删除 ${count} 个视频`)
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      showToast('error', '批量删除失败，请重试')
    }
    setIsDeleting(false)
  }

  const batchMoveToCategory = async (categoryName: string) => {
    if (selectedIds.size === 0) return
    try {
      const response = await fetch(API + '/api/categories/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_ids: Array.from(selectedIds), target_category: categoryName })
      })
      const data = await response.json()
      if (data.success) {
        setVideoResults(prev => prev.map(v => selectedIds.has(v.id) ? { ...v, category: categoryName } : v))
        const count = selectedIds.size
        setSelectedIds(new Set())
        setShowMoveToCategory(false)
        fetchCategories()
        fetchStats()
        showToast('success', `已将 ${count} 个视频移入「${categoryName || '未分类'}」`)
      }
    } catch (error) {
      console.error('移动分类失败:', error)
      showToast('error', '移动失败，请重试')
    }
  }

  // ===== 分类管理 =====
  const createCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      await fetch(API + '/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
      })
      showToast('success', `分类「${newCategoryName.trim()}」已创建`)
      setNewCategoryName('')
      fetchCategories()
    } catch (error) {
      console.error('创建分类失败:', error)
      showToast('error', '创建分类失败')
    }
  }

  const renameCategory = async (oldName: string) => {
    if (!renameValue.trim() || renameValue === oldName) { setRenamingCategory(null); return }
    try {
      await fetch(API + '/api/categories/' + encodeURIComponent(oldName), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: renameValue.trim() })
      })
      showToast('success', `分类已重命名：${oldName} → ${renameValue.trim()}`)
      setRenamingCategory(null)
      setRenameValue('')
      fetchCategories()
      fetchAllVideos()
      fetchStats()
    } catch (error) {
      console.error('重命名分类失败:', error)
      showToast('error', '重命名失败')
    }
  }

  const deleteCategory = async (name: string) => {
    try {
      await fetch(API + '/api/categories/' + encodeURIComponent(name), { method: 'DELETE' })
      showToast('success', `分类「${name}」已删除，视频已移入未分类`)
      setShowDeleteCatConfirm(null)
      if (selectedCategory === name) setSelectedCategory(null)
      fetchCategories()
      fetchAllVideos()
      fetchStats()
    } catch (error) {
      console.error('删除分类失败:', error)
      showToast('error', '删除分类失败')
    }
  }

  // 过滤并排序视频列表
  const getFilteredVideos = () => {
    let list = videoResults
    if (selectedCategory === null) list = videoResults
    else if (selectedCategory === '') list = videoResults.filter(v => !v.category)
    else list = videoResults.filter(v => v.category === selectedCategory)

    // 排序
    if (sortBy === 'newest') list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === 'oldest') list = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    else if (sortBy === 'title') list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''))

    return list
  }

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = { 'douyin': '🎵', 'bilibili': '📺', 'youtube': '▶️', 'kuaishou': '🎬', 'tiktok': '🎭', 'xiaohongshu': '📕', 'weixin_video': '💬', 'unknown': '🎥' }
    return icons[platform] || '🎥'
  }

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = { 'douyin': '抖音', 'bilibili': 'B站', 'youtube': 'YouTube', 'kuaishou': '快手', 'tiktok': 'TikTok', 'xiaohongshu': '小红书', 'weixin_video': '微信视频号', 'unknown': '未知' }
    return names[platform] || platform
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { 'completed': 'tag tag-green', 'processing': 'tag tag-blue', 'downloading': 'tag tag-amber', 'extracting': 'tag tag-amber', 'transcribing': 'tag tag-amber', 'analyzing': 'tag tag-purple', 'pending': 'tag tag-neutral', 'failed': 'tag tag-red' }
    return colors[status] || 'tag tag-neutral'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = { 'completed': '已完成', 'downloading': '下载中', 'extracting': '提取中', 'transcribing': '转录中', 'analyzing': '分析中', 'pending': '等待中', 'failed': '失败' }
    return texts[status] || status
  }

  // 相对时间格式化
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return days + '天前'
    if (hours > 0) return hours + '小时前'
    if (minutes > 0) return minutes + '分钟前'
    return '刚刚'
  }

  // 复制全部知识条目
  const copyAllResults = () => {
    const text = filteredVideos.map(v => {
      const parts = ['📌 ' + (v.title || '未标题')]
      if (v.one_line_summary) parts.push('💡 ' + v.one_line_summary)
      if (v.summary) parts.push('📝 ' + v.summary)
      if (v.key_points?.length) parts.push('🔑 关键点：\n' + v.key_points.map((p, i) => (i+1) + '. ' + p).join('\n'))
      if (v.tags?.length) parts.push('🏷️ ' + v.tags.map(t => '#' + t).join(' '))
      parts.push('---')
      return parts.join('\n')
    }).join('\n\n')
    navigator.clipboard.writeText(text).then(() => {
      showToast('success', `已复制 ${filteredVideos.length} 条知识到剪贴板`)
    }).catch(() => showToast('error', '复制失败'))
  }

  const filteredVideos = getFilteredVideos()

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* 全页面 Shader 动画背景 */}
      <div className="fixed inset-0" style={{ zIndex: 0 }}>
        <VideoBrainShader key={theme} />
        {/* 半透明遮罩保证文字可读 */}
        <div className="absolute inset-0" style={{
          background: theme === 'dark'
            ? 'rgba(9, 9, 11, 0.65)'
            : 'rgba(255, 255, 255, 0.2)',
          zIndex: 1,
        }} />
      </div>

      {/* 页面内容层 */}
      <div className="relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-[var(--border)]" style={{ background: theme === 'dark' ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left: Logo + Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/VideoBrain.png" alt="VideoBrain" className="w-9 h-9 object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient leading-tight">VideoBrain</h1>
              <p className="text-[10px] text-ink-ghost leading-tight">智能知识库</p>
            </div>
          </div>

          {/* Center: Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-muted)' }}>
            {[{ key: 'process', icon: Zap, label: '处理视频' }, { key: 'search', icon: Search, label: '搜索知识' }, { key: 'library', icon: BookOpen, label: '知识库' }].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={'px-4 py-2 rounded-lg transition-all text-sm font-medium ' + (activeTab === tab.key ? 'btn-primary' : 'text-ink-muted hover:text-ink')}>
                <div className="flex items-center gap-1.5"><tab.icon className="w-4 h-4" />{tab.label}</div>
              </button>
            ))}
          </div>

          {/* Right: Stats + Controls */}
          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{stats.total_entries} 条目</span>
              </div>
              <div className="w-px h-4 bg-[var(--border)]"></div>
              <div className="flex items-center gap-1">
                <Folder className="w-3.5 h-3.5" />
                <span>{stats.category_count} 分类</span>
              </div>
            </div>
            {/* Theme & Font Controls */}
            <div className="flex items-center gap-1.5">
              <button onClick={toggleFontSize} className="theme-toggle font-size-toggle" data-font-size={fontSize} title={`字体大小: ${getFontSizeLabel()} (点击切换)`}>
                A
                <span className="font-size-tooltip">字体: {getFontSizeLabel()}</span>
              </button>
              <button onClick={toggleTheme} className="theme-toggle" title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Process Tab */}
        {activeTab === 'process' && (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg overflow-hidden">
                <img src="/VideoBrain.png" alt="VideoBrain" className="w-16 h-16 object-cover" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-ink mb-3">开始构建你的知识库</h2>
              <p className="text-ink-secondary text-base mb-8 max-w-xl mx-auto">粘贴任意短视频链接，AI 自动提取、分析、结构化存储到你的私有知识库</p>
            </div>

            {/* Input Card */}
            <div className="card-custom p-6 mb-6">
              <div className="flex gap-3 mb-4">
                <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="粘贴视频链接或抖音分享文本..." className="flex-1 input-custom py-3.5 text-base" disabled={isProcessing} onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleProcessVideo()} />
                <button onClick={async () => { try { const text = await navigator.clipboard.readText(); if (text) setVideoUrl(text) } catch {} }} disabled={isProcessing} className="btn-secondary px-4 py-3.5" title="从剪贴板粘贴">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={handleProcessVideo} disabled={isProcessing || !videoUrl.trim()} className="btn-primary px-8 py-3.5 text-base font-semibold">
                  {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />处理中</> : <><Zap className="w-5 h-5" />开始处理</>}
                </button>
              </div>

              {/* Platform Tags */}
              <div className="flex flex-wrap gap-2">
                {[{ name: '抖音', icon: '🎵', pattern: /douyin|iesdouyin|v\.douyin/ }, { name: 'B站', icon: '📺', pattern: /bilibili|b23\.tv/ }, { name: 'YouTube', icon: '▶️', pattern: /youtube|youtu\.be/ }, { name: '快手', icon: '🎬', pattern: /kuaishou|gifshow/ }, { name: 'TikTok', icon: '🎭', pattern: /tiktok/ }, { name: '小红书', icon: '📕', pattern: /xiaohongshu|xhslink/ }, { name: '视频号', icon: '💬', pattern: /weixin|wxurl|sourl/ }].map(p => {
                  const isDetected = videoUrl && p.pattern.test(videoUrl.toLowerCase())
                  return (
                    <span key={p.name} className={'px-3 py-1.5 rounded-lg text-xs transition-all cursor-default ' + (isDetected ? 'tag tag-purple font-semibold' : 'tag')}>{p.icon} {p.name}</span>
                  )
                })}
              </div>
            </div>

            {/* Processing Status */}
            {processingStatus && (
              <div className={'p-5 rounded-xl mb-6 animate-fade-in ' + (processingStatus.includes('完成') ? 'status-success' : processingStatus.includes('失败') || processingStatus.includes('错误') ? 'status-error' : 'status-success')}>
                <div className="flex items-center gap-3 mb-3">
                  {processingStatus.includes('完成') ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : processingStatus.includes('失败') || processingStatus.includes('错误') ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />}
                  <span className="font-semibold">{processingStatus}</span>
                </div>
                {isProcessing && processingProgress > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-ink-muted">处理进度</span>
                      <span className="text-xs font-bold text-primary">{processingProgress}%</span>
                    </div>
                    <div className="w-full progress-bar h-2"><div className="progress-fill h-2 rounded-full transition-all duration-500" style={{ width: processingProgress + '%' }}></div></div>
                  </div>
                )}
                {processingDetail && <p className="text-sm text-ink-secondary mt-2">{processingDetail}</p>}
              </div>
            )}

            {/* Processing Steps */}
            <div className="card-custom p-6">
              <h3 className="text-sm font-semibold text-ink-secondary mb-5">处理流程</h3>
              <div className="flex items-center justify-between">
                {[{ icon: Link, label: '解析链接', desc: '识别平台', progress: [10] }, { icon: Download, label: '下载视频', desc: '获取源文件', progress: [10, 20, 25] }, { icon: FileText, label: '语音转文字', desc: 'Whisper引擎', progress: [35, 40, 45, 55] }, { icon: Brain, label: 'AI深度分析', desc: 'MiMo模型', progress: [70] }, { icon: BookOpen, label: '知识入库', desc: '结构化存储', progress: [100] }].map((step, i) => {
                  const isActive = isProcessing && step.progress.some(p => processingProgress >= p - 5 && processingProgress < p + 15)
                  const isDone = isProcessing && processingProgress > Math.max(...step.progress) + 10 || (!isProcessing && processingProgress === 100 && i < 5)
                  return (
                    <div key={i} className="flex items-center">
                      <div className="text-center">
                        <div className={'w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all ' + (isActive ? 'shadow-custom-glow animate-pulse' : '')} style={isDone ? { background: 'var(--success-bg)' } : isActive ? { background: 'var(--primary-subtle)' } : { background: 'var(--surface-muted)' }}>
                          <step.icon className={'w-5 h-5 ' + (isActive ? 'icon-primary' : isDone ? 'icon-success' : 'text-ink-ghost')} />
                        </div>
                        <div className={'text-xs font-medium ' + (isActive ? 'text-primary' : isDone ? 'text-success' : 'text-ink')}>{step.label}</div>
                        <div className="text-[10px] text-ink-muted mt-0.5">{step.desc}</div>
                      </div>
                      {i < 4 && <div className="w-8 h-px mx-1" style={{ background: isDone ? 'var(--success)' : 'var(--border)' }}></div>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            {/* Search Header */}
            <div className="card-custom p-6 mb-6">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-ghost" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="输入关键词搜索知识库..." className="w-full input-custom py-3.5 pl-12 text-base" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                </div>
                <button onClick={handleSearch} className="btn-primary px-8 py-3.5 text-base font-semibold">搜索</button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-ink-secondary">找到 {searchResults.length} 条相关知识</h3>
                </div>
                {searchResults.map((result, i) => (
                  <div key={i} className="card-custom p-5 cursor-pointer group" onClick={() => { const vid = videoResults.find(v => v.id === result.metadata.video_id); if (vid) openVideoDetail(vid.id); }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-ink group-hover:text-primary transition-colors">{result.metadata.title || '未命名'}</h4>
                        <p className="text-sm text-ink-secondary mt-1 line-clamp-2">{result.metadata.summary || result.metadata.one_line_summary || result.content?.substring(0, 150) || '暂无摘要'}</p>
                      </div>
                      <span className={'ml-3 flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold ' + (result.similarity >= 0.7 ? 'tag tag-green' : result.similarity >= 0.4 ? 'tag tag-amber' : 'tag')}>{(result.similarity * 100).toFixed(0)}% 匹配</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-muted">
                      <span className="flex items-center gap-1">{getPlatformIcon(result.metadata.source_platform)} {getPlatformName(result.metadata.source_platform)}</span>
                      {result.metadata.category && <span className="tag">{result.metadata.category}</span>}
                      {result.metadata.has_transcript && <span className="flex items-center gap-0.5 icon-success">📄 含全文</span>}
                      {result.metadata.source_url && (
                        <a href={result.metadata.source_url} target="_blank" rel="noopener noreferrer" className="link-primary flex items-center gap-0.5 ml-auto" onClick={e => e.stopPropagation()}>
                          <ExternalLink className="w-3 h-3" />原视频
                        </a>
                      )}
                    </div>
                    {result.metadata.tags && (() => {
                      try {
                        const tags = JSON.parse(result.metadata.tags)
                        if (Array.isArray(tags) && tags.length > 0) {
                          return (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {tags.slice(0, 5).map((tag: string, i: number) => (
                                <span key={i} className="tag tag-purple">#{tag}</span>
                              ))}
                            </div>
                          )
                        }
                      } catch {}
                      return null
                    })()}
                  </div>
                ))}
              </div>
            )}

            {/* Empty Search */}
            {searchResults.length === 0 && searchQuery && (
              <div className="text-center py-16">
                <Search className="w-12 h-12 mx-auto mb-4 text-ink-ghost opacity-40" />
                <p className="text-ink-secondary font-medium">未找到相关知识</p>
                <p className="text-sm text-ink-muted mt-1">尝试使用不同的关键词搜索</p>
              </div>
            )}

            {/* Initial State */}
            {!searchQuery && (
              <div className="text-center py-16">
                <Search className="w-12 h-12 mx-auto mb-4 text-ink-ghost opacity-40" />
                <p className="text-ink-secondary font-medium">搜索你的知识库</p>
                <p className="text-sm text-ink-muted mt-1">输入关键词查找已保存的视频知识</p>
              </div>
            )}
          </div>
        )}

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="animate-fade-in-up">
            <div className="flex gap-6">
              {/* Category Sidebar */}
              <aside className="w-60 flex-shrink-0">
                <div className="card-custom p-4 sticky top-24">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-ink flex items-center gap-2"><Folder className="w-4 h-4 icon-primary" />内容分区</h3>
                    <button onClick={() => setShowCategoryManager(!showCategoryManager)} className="text-primary hover-text-primary" title="管理分类"><FolderPlus className="w-4 h-4" /></button>
                  </div>

                  <div className="space-y-1">
                    <button onClick={() => setSelectedCategory(null)} className={'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ' + (selectedCategory === null ? 'sidebar-item active' : 'sidebar-item')}>
                      <span className="flex items-center gap-2">📋 全部</span>
                      <span className="text-xs bg-[var(--sidebar-badge)] px-2 py-0.5 rounded-full">{videoResults.length}</span>
                    </button>
                    {categories.map((cat) => (
                      <div key={cat.name} className="group">
                        {renamingCategory === cat.name ? (
                          <div className="flex items-center gap-1 px-1">
                            <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="flex-1 px-2 py-1 text-xs input-custom" autoFocus onKeyDown={(e) => e.key === 'Enter' && renameCategory(cat.name)} onBlur={() => setRenamingCategory(null)} />
                            <button onClick={() => renameCategory(cat.name)} className="icon-success"><Check className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setSelectedCategory(cat.name)} className={'category-btn ' + (selectedCategory === cat.name ? 'active' : '')}>
                            <span className="flex items-center gap-2 truncate">
                              <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{cat.name}</span>
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs bg-[var(--sidebar-badge)] px-2 py-0.5 rounded-full">{cat.count}</span>
                              <button onClick={(e) => { e.stopPropagation(); setRenamingCategory(cat.name); setRenameValue(cat.name) }} className="opacity-0 group-hover:opacity-100 text-ink-ghost hover-text-primary transition-opacity"><Edit3 className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); setShowDeleteCatConfirm(cat.name) }} className="opacity-0 group-hover:opacity-100 text-ink-ghost hover-text-error transition-opacity"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </button>
                        )}
                      </div>
                    ))}
                    {uncategorized.count > 0 && (
                      <button onClick={() => setSelectedCategory('')} className={'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ' + (selectedCategory === '' ? 'sidebar-item active' : 'sidebar-item')}>
                        <span className="flex items-center gap-2">📁 未分类</span>
                        <span className="text-xs bg-[var(--sidebar-badge)] px-2 py-0.5 rounded-full">{uncategorized.count}</span>
                      </button>
                    )}
                  </div>

                  {showCategoryManager && (
                    <div className="mt-4 pt-4 divider">
                      <div className="flex gap-2">
                        <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="新分类名..." className="flex-1 px-3 py-2 text-xs input-custom" onKeyDown={(e) => e.key === 'Enter' && createCategory()} />
                        <button onClick={createCategory} className="btn-primary px-3 py-2 text-xs"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )}

                  {selectedIds.size > 0 && (
                    <div className="mt-4 pt-4 divider space-y-1.5">
                      <p className="text-xs text-ink-muted px-1">已选 {selectedIds.size} 项</p>
                      <button onClick={() => setShowMoveToCategory(true)} className="w-full text-left px-3 py-2 text-xs text-primary hover-bg-surface rounded-lg flex items-center gap-2"><Move className="w-3 h-3" />移动到分类</button>
                      <button onClick={() => { if (confirm(`确定要删除选中的 ${selectedIds.size} 个视频吗？此操作不可撤销。`)) batchDelete() }} className="w-full text-left px-3 py-2 text-xs text-error hover-bg-surface rounded-lg flex items-center gap-2"><Trash2 className="w-3 h-3" />批量删除</button>
                      <button onClick={() => setSelectedIds(new Set())} className="w-full text-left px-3 py-2 text-xs text-ink-muted hover-bg-surface rounded-lg">取消选择</button>
                    </div>
                  )}
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                      {selectedCategory === null ? '全部知识' : selectedCategory === '' ? '未分类' : selectedCategory}
                      <span className="text-sm font-normal text-ink-muted">({filteredVideos.length})</span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {filteredVideos.length > 0 && (
                      <>
                        <button onClick={selectAllVideos} className="btn-ghost text-xs">
                          {selectedIds.size === filteredVideos.length ? '取消全选' : '全选'}
                        </button>
                        <button onClick={copyAllResults} className="btn-ghost text-xs" title="复制当前分类下的所有知识内容"><Copy className="w-3 h-3" />复制全部</button>
                        <button onClick={() => {
                          const exportData = filteredVideos.map(v => ({ title: v.title, url: v.url, platform: v.platform, category: v.category, summary: v.summary, one_line_summary: v.one_line_summary, key_points: v.key_points, tags: v.tags, transcript: v.transcript }))
                          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a'); a.href = url; a.download = 'videobrain-export.json'; a.click()
                          URL.revokeObjectURL(url)
                          showToast('success', `已导出 ${filteredVideos.length} 条知识`)
                        }} className="btn-ghost text-xs" title="导出为JSON文件"><Download className="w-3 h-3" />导出</button>
                      </>
                    )}
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="form-select text-xs py-1.5 px-2.5">
                      <option value="newest">最新</option>
                      <option value="oldest">最早</option>
                      <option value="title">按标题</option>
                    </select>
                    <button onClick={() => { fetchAllVideos(); fetchStats(); fetchCategories() }} className="btn-ghost text-xs">刷新</button>
                  </div>
                </div>

                {/* Video List */}
                {filteredVideos.length > 0 ? (
                  <div className="space-y-3">
                    {filteredVideos.map((video) => (
                      <div key={video.id} className={'card-custom p-5 group transition-all ' + (selectedIds.has(video.id) ? 'selected-ring' : '')}>
                        <div className="flex items-start gap-4">
                          <input type="checkbox" checked={selectedIds.has(video.id)} onChange={() => toggleSelectVideo(video.id)} className="mt-1.5 w-4 h-4 form-checkbox rounded cursor-pointer flex-shrink-0" />
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openVideoDetail(video.id)}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h4 className="text-base font-semibold text-ink leading-snug">{video.title}</h4>
                              <span className="text-xs text-ink-ghost flex-shrink-0">{formatRelativeTime(video.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted mb-2">
                              <span className="flex items-center gap-1">{getPlatformIcon(video.platform)} {getPlatformName(video.platform)}</span>
                              <span className={'tag ' + (video.status === 'completed' ? 'tag-green' : video.status === 'failed' ? 'tag-red' : 'tag-amber')}>{getStatusText(video.status)}</span>
                              {video.category && <span className="tag tag-purple">{video.category}</span>}
                              {video.has_transcript && <span className="icon-success">📄 {video.transcript_length || 0}字</span>}
                            </div>
                            {video.one_line_summary && <p className="text-sm text-ink-secondary mb-2 leading-relaxed">{video.one_line_summary}</p>}
                            {video.summary && <p className="text-xs text-ink-muted line-clamp-2 mb-3">{video.summary}</p>}
                            {video.key_points && video.key_points.length > 0 && (
                              <div className="mb-3">
                                <ul className="space-y-1">
                                  {video.key_points.slice(0, 3).map((point: string, i: number) => (
                                    <li key={i} className="text-xs text-ink-secondary flex items-start gap-2"><span className="text-[var(--primary)] mt-0.5 flex-shrink-0">•</span>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {video.tags && video.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {video.tags.slice(0, 5).map((tag: string, i: number) => (
                                  <span key={i} className="tag tag-purple">#{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); openVideoDetail(video.id, true) }} className="p-2 text-ink-ghost hover:text-[var(--primary)] hover:bg-[var(--tag-purple-bg)] rounded-lg transition-colors" title="编辑"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); confirmDelete(video) }} className="p-2 text-ink-ghost hover:text-[var(--error)] hover:bg-[var(--error-bg)] rounded-lg transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card-custom text-center py-16">
                    <BookOpen className="w-14 h-14 mx-auto mb-4 text-ink-ghost opacity-30" />
                    {isLoadingLibrary ? (
                      <><p className="text-sm font-medium text-ink-secondary">正在加载知识库...</p><Loader2 className="w-5 h-5 animate-spin mx-auto mt-3 text-[var(--primary)]" /></>
                    ) : selectedCategory !== null ? (
                      <><p className="text-sm font-medium text-ink-secondary">该分类下暂无内容</p><p className="text-xs mt-1 text-ink-muted">尝试切换到其他分类或处理新的视频</p></>
                    ) : (
                      <><p className="text-sm font-medium text-ink-secondary">知识库为空</p><p className="text-xs mt-1 text-ink-muted">切换到「处理视频」标签页，粘贴视频链接开始构建你的知识库 🚀</p></>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetail && selectedVideo && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-12 pb-12 overflow-y-auto" onClick={() => { setShowDetail(false); setIsEditing(false) }}>
            <div className="card-custom shadow-custom-xl max-w-3xl w-full mx-4 my-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 rounded-t-2xl border-b border-[var(--border)] px-6 py-4 flex items-start justify-between z-10" style={{ background: 'var(--surface)' }}>
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getPlatformIcon(selectedVideo.platform)}</span>
                    <span className="text-xs text-ink-muted">{getPlatformName(selectedVideo.platform)}</span>
                    {selectedVideo.category && <span className="tag tag-purple">{selectedVideo.category}</span>}
                  </div>
                  {isEditing ? (
                    <input value={editForm.title || ''} onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))} className="text-xl font-bold text-ink w-full border-b-2 border-theme-focus outline-none pb-1" />
                  ) : (
                    <h2 className="text-xl font-bold text-ink">{selectedVideo.title}</h2>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isEditing && (
                    <>
                      <button onClick={startEditing} className="btn-ghost text-xs px-3 py-1.5"><Edit3 className="w-3 h-3" />编辑</button>
                      <button onClick={() => confirmDelete(selectedVideo)} className="btn-ghost text-xs px-3 py-1.5 text-[var(--error)]"><Trash2 className="w-3 h-3" />删除</button>
                    </>
                  )}
                  {isEditing && (
                    <>
                      <button onClick={saveEditing} disabled={isSaving} className="btn-primary text-xs px-3 py-1.5"><Save className="w-3 h-3" />{isSaving ? '保存中...' : '保存'}</button>
                      <button onClick={cancelEditing} className="btn-secondary text-xs px-3 py-1.5">取消</button>
                    </>
                  )}
                  <button onClick={() => { setShowDetail(false); setIsEditing(false) }} className="w-8 h-8 bg-[var(--surface-muted)] hover:bg-[var(--surface-active)] rounded-full flex items-center justify-center transition-colors ml-1"><X className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {isEditing && (
                  <div>
                    <h3 className="text-sm font-semibold text-ink-secondary mb-3 flex items-center gap-2"><Folder className="w-4 h-4 icon-primary" />分类</h3>
                    <div className="flex gap-2 flex-wrap">
                      {categories.map(cat => (
                        <button key={cat.name} onClick={() => setEditForm(prev => ({ ...prev, category: cat.name }))} className={'px-3 py-1.5 rounded-lg text-xs transition-colors ' + (editForm.category === cat.name ? 'tag tag-purple font-semibold' : 'tag')}>{cat.name}</button>
                      ))}
                      <button onClick={() => setEditForm(prev => ({ ...prev, category: '' }))} className={'px-3 py-1.5 rounded-lg text-xs transition-colors ' + (editForm.category === '' ? 'tag font-semibold' : 'tag')}>无分类</button>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div>
                    <h3 className="text-sm font-semibold text-ink-secondary mb-2">一句话摘要</h3>
                    <input value={editForm.one_line_summary || ''} onChange={(e) => setEditForm(prev => ({ ...prev, one_line_summary: e.target.value }))} className="input-custom w-full py-2.5" placeholder="一句话描述视频内容..." />
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-ink-secondary mb-3 flex items-center gap-2"><Brain className="w-4 h-4 icon-primary" />AI 深度摘要</h3>
                  {isEditing ? (
                    <textarea value={editForm.summary || ''} onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))} rows={4} className="input-custom w-full py-2.5 resize-y" />
                  ) : selectedVideo.summary ? (
                    <div className="bg-[var(--tag-purple-bg)] rounded-xl p-4"><p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">{selectedVideo.summary}</p></div>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-ink-secondary mb-3 flex items-center gap-2"><Zap className="w-4 h-4 icon-warning" />关键要点</h3>
                  {isEditing ? (
                    <div className="space-y-2">
                      {(editForm.key_points || []).map((point, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-[var(--tag-amber-bg)] text-[var(--tag-amber-text)] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                          <input value={point} onChange={(e) => { const kp = [...(editForm.key_points || [])]; kp[i] = e.target.value; setEditForm(prev => ({ ...prev, key_points: kp })) }} className="input-custom flex-1 py-1.5 text-sm" />
                          <button onClick={() => removeKeyPoint(i)} className="text-[var(--error)] hover:opacity-80"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input value={editKeyPointInput} onChange={(e) => setEditKeyPointInput(e.target.value)} placeholder="添加新的关键点..." className="input-custom flex-1 py-2 text-sm" onKeyDown={(e) => e.key === 'Enter' && addKeyPoint()} />
                        <button onClick={addKeyPoint} className="btn-secondary text-xs px-3 py-2"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : selectedVideo.key_points && selectedVideo.key_points.length > 0 ? (
                    <div className="space-y-2">
                      {selectedVideo.key_points.map((point: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 bg-[var(--tag-purple-bg)] rounded-lg p-3">
                          <span className="w-6 h-6 bg-[var(--tag-amber-bg)] text-[var(--tag-amber-text)] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                          <span className="text-sm text-ink-secondary leading-relaxed">{point}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-ink-secondary mb-3 flex items-center gap-2"><Tag className="w-4 h-4 icon-success" />标签</h3>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {(editForm.tags || []).map((tag, i) => (
                          <span key={i} className="tag tag-green text-xs px-3 py-1.5 flex items-center gap-1">#{tag}<button onClick={() => removeTag(i)} className="ml-1 hover:opacity-80"><X className="w-3 h-3" /></button></span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={editTagInput} onChange={(e) => setEditTagInput(e.target.value)} placeholder="添加标签..." className="input-custom flex-1 py-2 text-sm" onKeyDown={(e) => e.key === 'Enter' && addTag()} />
                        <button onClick={addTag} className="btn-secondary text-xs px-3 py-2"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : selectedVideo.tags && selectedVideo.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedVideo.tags.map((tag: string, i: number) => (
                        <span key={i} className="tag tag-green text-xs px-3 py-1.5">#{tag}</span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {selectedVideo.has_transcript && selectedVideo.transcript && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-ink-secondary flex items-center gap-2"><FileText className="w-4 h-4 icon-info" />完整内容文本 <span className="text-xs font-normal text-ink-muted">({selectedVideo.transcript_length || selectedVideo.transcript.length}字)</span></h3>
                      <div className="flex gap-2">
                        <button onClick={copyTranscript} className="btn-ghost text-xs px-3 py-1.5"><Copy className="w-3 h-3" />{copied ? '已复制!' : '复制全文'}</button>
                        {!isEditing && (
                          <button onClick={() => setShowFullTranscript(!showFullTranscript)} className="btn-ghost text-xs px-3 py-1.5">
                            {showFullTranscript ? <><ChevronUp className="w-3 h-3" />收起</> : <><ChevronDown className="w-3 h-3" />展开全文</>}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={'bg-surface-muted rounded-xl p-5 text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap ' + (showFullTranscript || isEditing ? '' : 'max-h-48 overflow-hidden relative')}>
                      {selectedVideo.transcript}
                      {!showFullTranscript && !isEditing && selectedVideo.transcript.length > 300 && <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[var(--surface-muted)] to-transparent"></div>}
                    </div>
                  </div>
                )}

                {(!selectedVideo.has_transcript || !selectedVideo.transcript) && selectedVideo.status === 'completed' && (
                  <div className="status-error">⚠️ 该视频暂未获取到完整的内容文本，可能是由于下载或转录过程中出现问题。</div>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-[var(--border)]">
                  <span className="text-xs text-ink-muted">原始链接：</span>
                  <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer" className="text-xs link-primary flex items-center gap-1 truncate">{selectedVideo.url?.substring(0, 60)}... <ExternalLink className="w-3 h-3 flex-shrink-0" /></a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && deleteTarget && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
            <div className="card-custom shadow-custom-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[var(--error-bg)] rounded-full flex items-center justify-center"><Trash2 className="w-5 h-5 icon-error" /></div>
                <h3 className="text-lg font-bold text-ink">确认删除</h3>
              </div>
              <p className="text-sm text-ink-secondary mb-3">确定要删除以下视频及其知识条目吗？</p>
              <div className="bg-[var(--surface-muted)] rounded-lg p-3 mb-4">
                <p className="font-medium text-sm text-ink">{deleteTarget.title}</p>
                <p className="text-xs text-ink-muted mt-1">{getPlatformIcon(deleteTarget.platform)} {getPlatformName(deleteTarget.platform)} · {deleteTarget.category || '未分类'}</p>
              </div>
              <p className="text-xs text-[var(--error)] mb-5">⚠️ 此操作不可撤销，将同时删除视频记录和知识库条目。</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-sm px-5 py-2.5">取消</button>
                <button onClick={executeDelete} disabled={isDeleting} className="btn-primary text-sm px-5 py-2.5">
                  {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" />删除中...</> : <><Trash2 className="w-4 h-4" />确认删除</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Move to Category Dialog */}
        {showMoveToCategory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center" onClick={() => setShowMoveToCategory(false)}>
            <div className="card-custom shadow-custom-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2"><Move className="w-5 h-5 icon-primary" />移动到分类</h3>
              <p className="text-xs text-ink-muted mb-4">选择要将 {selectedIds.size} 个视频移动到的分类：</p>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {categories.map(cat => (
                  <button key={cat.name} onClick={() => batchMoveToCategory(cat.name)} className="w-full text-left px-4 py-3 hover-bg-surface rounded-lg text-sm text-ink-secondary hover-text-primary transition-colors flex items-center gap-2">
                    <Folder className="w-4 h-4" />{cat.name}<span className="text-xs text-ink-muted ml-auto">({cat.count})</span>
                  </button>
                ))}
                <button onClick={() => batchMoveToCategory('')} className="w-full text-left px-4 py-3 hover-bg-surface rounded-lg text-sm text-ink-muted transition-colors flex items-center gap-2">
                  <Folder className="w-4 h-4" />取消分类
                </button>
              </div>
              <div className="mt-5 flex justify-end">
                <button onClick={() => setShowMoveToCategory(false)} className="btn-secondary text-sm px-5 py-2.5">关闭</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Category Confirmation */}
        {showDeleteCatConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center" onClick={() => setShowDeleteCatConfirm(null)}>
            <div className="card-custom shadow-custom-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[var(--warning-bg)] rounded-full flex items-center justify-center"><Trash2 className="w-5 h-5 icon-warning" /></div>
                <h3 className="text-lg font-bold text-ink">删除分类</h3>
              </div>
              <p className="text-sm text-ink-secondary mb-2">确定要删除分类 &quot;<strong>{showDeleteCatConfirm}</strong>&quot; 吗？</p>
              <p className="text-xs text-ink-muted mb-5">该分类下的视频将变为&quot;未分类&quot;状态，视频本身不会被删除。</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteCatConfirm(null)} className="btn-secondary text-sm px-5 py-2.5">取消</button>
                <button onClick={() => deleteCategory(showDeleteCatConfirm)} className="btn-primary text-sm px-5 py-2.5">删除分类</button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 py-8 border-t border-[var(--border)]">
          <p className="text-xs text-ink-muted">VideoBrain v2.6 — 短视频智能知识库</p>
          <p className="text-[10px] text-ink-ghost mt-1">Ctrl+K 搜索 · Ctrl+L 知识库 · Ctrl+S 保存 · Esc 关闭</p>
        </footer>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>{/* 内容层闭合 */}
    </div>
  )
}
