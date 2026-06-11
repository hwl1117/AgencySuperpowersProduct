'use client'

interface PlatformBadgeProps {
  platform: string
  size?: 'sm' | 'md' | 'lg'
}

const platformConfig: Record<string, { icon: string; name: string; color: string }> = {
  douyin: { icon: '🎵', name: '抖音', color: 'bg-pink-100 text-pink-700' },
  bilibili: { icon: '📺', name: 'B站', color: 'bg-blue-100 text-blue-700' },
  youtube: { icon: '▶️', name: 'YouTube', color: 'bg-red-100 text-red-700' },
  kuaishou: { icon: '🎬', name: '快手', color: 'bg-orange-100 text-orange-700' },
  tiktok: { icon: '🎭', name: 'TikTok', color: 'bg-gray-100 text-gray-700' },
  xiaohongshu: { icon: '📕', name: '小红书', color: 'bg-red-100 text-red-700' },
  weixin_video: { icon: '💬', name: '微信视频号', color: 'bg-green-100 text-green-700' }
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base'
}

export default function PlatformBadge({ platform, size = 'md' }: PlatformBadgeProps) {
  const config = platformConfig[platform] || { icon: '🎥', name: platform, color: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}>
      <span>{config.icon}</span>
      <span>{config.name}</span>
    </span>
  )
}