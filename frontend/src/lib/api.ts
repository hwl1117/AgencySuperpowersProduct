/**
 * VideoBrain API客户端 v2.5
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // 视频处理
  async processVideo(url: string, language: string = 'zh'): Promise<any> {
    return this.request('/api/videos/process', {
      method: 'POST',
      body: JSON.stringify({ url, language }),
    })
  }

  async getVideo(videoId: string | number): Promise<VideoResult> {
    return this.request(`/api/videos/${videoId}`)
  }

  async listVideos(page: number = 1, pageSize: number = 20, status?: string, platform?: string): Promise<{ total: number; page: number; page_size: number; videos: VideoResult[] }> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    if (status) params.append('status', status)
    if (platform) params.append('platform', platform)

    return this.request(`/api/videos?${params}`)
  }

  async batchProcessVideos(urls: string[]): Promise<any> {
    return this.request('/api/videos/batch', {
      method: 'POST',
      body: JSON.stringify(urls),
    })
  }

  // 视频编辑
  async updateVideo(videoId: string | number, data: Partial<VideoResult>): Promise<any> {
    return this.request(`/api/videos/${videoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 视频删除
  async deleteVideo(videoId: string | number): Promise<any> {
    return this.request(`/api/videos/${videoId}`, {
      method: 'DELETE',
    })
  }

  // 批量删除视频
  async batchDeleteVideos(ids: string[]): Promise<any> {
    return this.request('/api/videos/delete-batch', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  }

  // 知识库搜索
  async searchKnowledge(query: string, category?: string, platform?: string, limit: number = 10): Promise<{ success: boolean; results: SearchResult[]; total: number; error?: string }> {
    return this.request('/api/knowledge/search', {
      method: 'POST',
      body: JSON.stringify({ query, category, platform, limit }),
    })
  }

  async getKnowledgeEntry(videoId: string | number): Promise<any> {
    return this.request(`/api/knowledge/${videoId}`)
  }

  async listCategories(): Promise<any> {
    return this.request('/api/knowledge/categories/list')
  }

  async getStats(): Promise<StatsResult> {
    return this.request('/api/knowledge/stats')
  }

  async exportKnowledge(format: string = 'json'): Promise<any> {
    return this.request(`/api/knowledge/export?format=${format}`)
  }

  // 分类管理
  async getCategories(): Promise<any> {
    return this.request('/api/categories')
  }

  async createCategory(name: string, videoIds?: string[]): Promise<any> {
    return this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, video_ids: videoIds }),
    })
  }

  async renameCategory(oldName: string, newName: string): Promise<any> {
    return this.request(`/api/categories/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      body: JSON.stringify({ new_name: newName }),
    })
  }

  async deleteCategory(name: string): Promise<any> {
    return this.request(`/api/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    })
  }

  async moveToCategory(videoIds: string[], targetCategory: string): Promise<any> {
    return this.request('/api/categories/move', {
      method: 'POST',
      body: JSON.stringify({ video_ids: videoIds, target_category: targetCategory }),
    })
  }

  // 健康检查
  async healthCheck(): Promise<any> {
    return this.request('/health')
  }
}

// 导出单例
export const apiClient = new ApiClient()

// 导出类型
export interface VideoResult {
  id: string | number
  url: string
  platform: string
  title: string
  description: string
  duration: number
  status: string
  progress: number
  transcript: string
  summary: string
  one_line_summary: string
  key_points: string[]
  tags: string[]
  category: string
  created_at: string
  processed_at: string
  updated_at?: string
}

export interface SearchResult {
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

export interface StatsResult {
  total_entries: number
  categories: string[]
  category_count: number
  platform_distribution: Record<string, number>
}

export interface CategoryResult {
  name: string
  count: number
  videos: { id: string; title: string; platform: string; one_line_summary: string }[]
}