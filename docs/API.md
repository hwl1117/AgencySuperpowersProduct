# VideoBrain API 文档

## 基础信息

- **Base URL**: `http://localhost:8000`
- **API版本**: v1.0.0
- **认证方式**: 无（可扩展为JWT）

## 接口列表

### 1. 健康检查

```http
GET /health
```

**响应示例**:
```json
{
  "status": "healthy",
  "service": "VideoBrain API",
  "timestamp": "2024-01-01T00:00:00"
}
```

### 2. 处理视频

```http
POST /api/videos/process
Content-Type: application/json

{
  "url": "https://www.douyin.com/video/xxx",
  "language": "zh"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 是 | 视频链接 |
| language | string | 否 | 语言代码，默认"zh" |

**响应示例**:
```json
{
  "video_id": 1,
  "status": "pending",
  "message": "视频处理任务已创建"
}
```

**支持的平台**:
- 抖音 (douyin.com)
- B站 (bilibili.com)
- YouTube (youtube.com)
- 快手 (kuaishou.com)
- TikTok (tiktok.com)
- 小红书 (xiaohongshu.com)

### 3. 获取视频信息

```http
GET /api/videos/{video_id}
```

**响应示例**:
```json
{
  "id": 1,
  "url": "https://www.douyin.com/video/xxx",
  "platform": "douyin",
  "title": "视频标题",
  "description": "视频描述",
  "duration": 120,
  "status": "completed",
  "progress": 100,
  "transcript": "语音转文字内容...",
  "summary": "AI生成的摘要...",
  "key_points": ["关键点1", "关键点2"],
  "tags": ["标签1", "标签2"],
  "category": "科技",
  "created_at": "2024-01-01T00:00:00",
  "processed_at": "2024-01-01T00:05:00"
}
```

**状态说明**:
| 状态 | 说明 |
|------|------|
| pending | 等待处理 |
| downloading | 下载中 |
| processing | 处理中 |
| completed | 处理完成 |
| failed | 处理失败 |

### 4. 获取视频列表

```http
GET /api/videos?page=1&page_size=20&status=completed&platform=douyin
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| page_size | int | 否 | 每页数量，默认20 |
| status | string | 否 | 状态筛选 |
| platform | string | 否 | 平台筛选 |

**响应示例**:
```json
{
  "total": 100,
  "page": 1,
  "page_size": 20,
  "videos": [
    {
      "id": 1,
      "title": "视频标题",
      "platform": "douyin",
      "status": "completed",
      "category": "科技",
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

### 5. 批量处理视频

```http
POST /api/videos/batch
Content-Type: application/json

[
  "https://www.douyin.com/video/xxx",
  "https://www.bilibili.com/video/yyy"
]
```

**响应示例**:
```json
{
  "results": [
    {
      "url": "https://www.douyin.com/video/xxx",
      "video_id": 1,
      "status": "pending"
    },
    {
      "url": "https://www.bilibili.com/video/yyy",
      "video_id": 2,
      "status": "pending"
    }
  ],
  "total": 2
}
```

### 6. 重试视频处理

```http
POST /api/videos/{video_id}/retry
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| video_id | int | 是 | 视频ID |

**说明**: 重试失败、已完成或卡住的视频处理。会重置视频状态为 `pending` 并重新提交处理任务。

**响应示例**:
```json
{
  "video_id": 1,
  "status": "pending",
  "message": "重试任务已创建"
}
```

**错误响应**:
```json
{
  "detail": "只能重试失败、已完成或卡住的视频"
}
```

### 7. 搜索知识库

```http
POST /api/knowledge/search
Content-Type: application/json

{
  "query": "人工智能",
  "category": "科技",
  "difficulty": "intermediate",
  "limit": 10
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| query | string | 是 | 搜索关键词 |
| category | string | 否 | 分类筛选 |
| difficulty | string | 否 | 难度筛选 |
| limit | int | 否 | 返回数量，默认10 |

**响应示例**:
```json
{
  "success": true,
  "results": [
    {
      "doc_id": "video_1",
      "content": "知识内容...",
      "metadata": {
        "title": "视频标题",
        "summary": "摘要",
        "category": "科技",
        "tags": "[\"AI\", \"机器学习\"]",
        "source_platform": "douyin",
        "similarity": 0.85
      },
      "similarity": 0.85
    }
  ],
  "total": 1
}
```

### 7. 获取知识库条目

```http
GET /api/knowledge/{video_id}
```

**响应示例**:
```json
{
  "doc_id": "video_1",
  "content": "详细的知识内容...",
  "metadata": {
    "video_id": 1,
    "title": "视频标题",
    "summary": "摘要",
    "category": "科技",
    "tags": "[\"AI\", \"机器学习\"]",
    "difficulty_level": "intermediate",
    "source_url": "https://...",
    "source_platform": "douyin",
    "duration": 120
  }
}
```

### 8. 获取分类列表

```http
GET /api/knowledge/categories/list
```

**响应示例**:
```json
{
  "categories": ["科技", "教育", "商业", "生活", "娱乐"]
}
```

### 9. 获取知识库统计

```http
GET /api/knowledge/stats
```

**响应示例**:
```json
{
  "total_entries": 100,
  "categories": ["科技", "教育", "商业"],
  "category_count": 3,
  "platform_distribution": {
    "douyin": 40,
    "bilibili": 30,
    "youtube": 30
  }
}
```

### 10. 导出知识库

```http
GET /api/knowledge/export?format=json
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "video_1",
      "content": "知识内容...",
      "metadata": {...}
    }
  ],
  "format": "json",
  "count": 100
}
```

## 错误响应

所有接口的错误响应格式：

```json
{
  "detail": "错误信息"
}
```

**常见HTTP状态码**:
| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 使用示例

### Python

```python
import requests

# 处理视频
response = requests.post(
    "http://localhost:8000/api/videos/process",
    json={"url": "https://www.douyin.com/video/xxx"}
)
print(response.json())

# 搜索知识库
response = requests.post(
    "http://localhost:8000/api/knowledge/search",
    json={"query": "人工智能", "limit": 5}
)
print(response.json())
```

### JavaScript

```javascript
// 处理视频
const response = await fetch('http://localhost:8000/api/videos/process', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({url: 'https://www.douyin.com/video/xxx'})
});
const data = await response.json();
console.log(data);

// 搜索知识库
const searchResponse = await fetch('http://localhost:8000/api/knowledge/search', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({query: '人工智能', limit: 5})
});
const results = await searchResponse.json();
console.log(results);
```

### cURL

```bash
# 处理视频
curl -X POST http://localhost:8000/api/videos/process \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.douyin.com/video/xxx"}'

# 搜索知识库
curl -X POST http://localhost:8000/api/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{"query": "人工智能", "limit": 5}'
```