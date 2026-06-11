/**
 * VideoBrain 常量定义
 */

// 支持的平台
export const SUPPORTED_PLATFORMS = [
  { id: 'douyin', name: '抖音', icon: '🎵', color: 'bg-pink-100 text-pink-700' },
  { id: 'bilibili', name: 'B站', icon: '📺', color: 'bg-blue-100 text-blue-700' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', color: 'bg-red-100 text-red-700' },
  { id: 'kuaishou', name: '快手', icon: '🎬', color: 'bg-orange-100 text-orange-700' },
  { id: 'tiktok', name: 'TikTok', icon: '🎭', color: 'bg-gray-100 text-gray-700' },
  { id: 'xiaohongshu', name: '小红书', icon: '📕', color: 'bg-red-100 text-red-700' },
  { id: 'weixin_video', name: '微信视频号', icon: '💬', color: 'bg-green-100 text-green-700' }
] as const

// 处理状态
export const PROCESSING_STATUS = {
  PENDING: 'pending',
  DOWNLOADING: 'downloading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const

// 状态配置
export const STATUS_CONFIG = {
  pending: { label: '等待中', color: 'bg-yellow-100 text-yellow-700', icon: 'Clock' },
  downloading: { label: '下载中', color: 'bg-indigo-100 text-indigo-700', icon: 'Loader2' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700', icon: 'Loader2' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: 'CheckCircle' },
  failed: { label: '失败', color: 'bg-red-100 text-red-700', icon: 'XCircle' }
} as const

// 知识分类
export const KNOWLEDGE_CATEGORIES = [
  '科技',
  '教育',
  '商业',
  '生活',
  '娱乐',
  '健康',
  '艺术',
  '科学',
  '历史',
  '其他'
] as const

// 难度级别
export const DIFFICULTY_LEVELS = [
  { id: 'beginner', label: '入门', color: 'bg-green-100 text-green-700' },
  { id: 'intermediate', label: '中级', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'advanced', label: '高级', color: 'bg-red-100 text-red-700' }
] as const

// API配置
export const API_CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:8000',
  TIMEOUT: 30000, // 30秒
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000 // 1秒
} as const

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const

// 搜索配置
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 50,
  DEBOUNCE_DELAY: 300 // 300毫秒
} as const

// 视频处理配置
export const VIDEO_CONFIG = {
  MAX_DURATION: 600, // 10分钟
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  SUPPORTED_FORMATS: ['mp4', 'webm', 'mkv', 'avi', 'mov'],
  QUALITY_OPTIONS: ['360p', '480p', '720p', '1080p']
} as const

// 本地存储键
export const STORAGE_KEYS = {
  SEARCH_HISTORY: 'videobrain_search_history',
  RECENT_VIDEOS: 'videobrain_recent_videos',
  USER_PREFERENCES: 'videobrain_preferences'
} as const

// 正则表达式
export const REGEX_PATTERNS = {
  URL: /^https?:\/\/.+/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/
} as const

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  INVALID_URL: '请输入有效的视频链接',
  UNSUPPORTED_PLATFORM: '不支持的视频平台',
  PROCESSING_FAILED: '视频处理失败，请稍后重试',
  SEARCH_FAILED: '搜索失败，请稍后重试',
  LOAD_FAILED: '加载失败，请刷新页面重试'
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  VIDEO_SUBMITTED: '视频处理任务已提交',
  COPY_SUCCESS: '已复制到剪贴板',
  EXPORT_SUCCESS: '导出成功'
} as const