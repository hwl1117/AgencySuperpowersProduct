'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
}

export default function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  // BUG FIX #6: 使用 ref 直接引用 video 元素
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }

  return (
    <div className="relative group rounded-xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video object-contain"
        playsInline
        muted={isMuted}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* 控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay() }}
            className="text-white hover:text-indigo-400 transition-colors"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-white hover:text-indigo-400 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          <div className="flex-1" />
          
          <button className="text-white hover:text-indigo-400 transition-colors">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* 标题 */}
      {title && (
        <div className="absolute top-4 left-4 right-4">
          <h3 className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-lg inline-block">
            {title}
          </h3>
        </div>
      )}
    </div>
  )
}