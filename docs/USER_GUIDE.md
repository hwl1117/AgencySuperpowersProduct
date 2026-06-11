# VideoBrain 用户指南

## 简介

VideoBrain 是一款智能知识库系统，能够自动分析短视频内容并生成结构化知识。只需粘贴视频链接，系统即可：

1. 下载并分析视频内容
2. 提取语音并转为文字
3. 分析视频关键帧
4. 生成结构化知识摘要
5. 存入可搜索的知识库

## 快速开始

### 1. 访问系统

打开浏览器，访问 http://localhost:3000

### 2. 处理视频

1. 在首页输入框中粘贴短视频链接
2. 点击"开始处理"按钮
3. 等待处理完成（通常需要2-5分钟）

**支持的平台**：
- 抖音
- B站
- YouTube
- 快手
- TikTok
- 小红书

### 3. 查看结果

处理完成后，您可以：
- 查看视频摘要
- 阅读关键点
- 浏览标签和分类
- 查看完整知识文档

## 功能详解

### 处理视频

#### 输入链接

支持以下格式的链接：

```
抖音: https://www.douyin.com/video/xxx
B站: https://www.bilibili.com/video/BVxxx
YouTube: https://www.youtube.com/watch?v=xxx
快手: https://www.kuaishou.com/f/xxx
TikTok: https://www.tiktok.com/@user/video/xxx
小红书: https://www.xiaohongshu.com/explore/xxx
```

#### 处理流程

1. **解析链接** - 识别平台和视频ID
2. **下载视频** - 获取视频文件
3. **提取音频** - 分离音视频轨道
4. **语音转文字** - 使用Whisper API转录
5. **视觉分析** - 分析关键帧内容
6. **AI概括** - 生成结构化知识
7. **存入知识库** - 向量数据库存储

#### 处理状态

| 状态 | 说明 |
|------|------|
| ⏳ pending | 等待处理 |
| ⬇️ downloading | 下载中 |
| ⚙️ processing | 处理中 |
| ✅ completed | 处理完成 |
| ❌ failed | 处理失败 |

### 搜索知识库

#### 关键词搜索

1. 切换到"搜索知识"标签
2. 输入搜索关键词
3. 点击"搜索"按钮
4. 查看搜索结果

#### 高级搜索

支持以下筛选条件：
- **分类筛选** - 按知识分类筛选
- **难度筛选** - 按难度级别筛选
- **平台筛选** - 按视频平台筛选

#### 搜索技巧

- 使用具体关键词获得更精确结果
- 尝试同义词或相关词汇
- 使用引号搜索完整短语

### 浏览知识库

#### 分类浏览

1. 切换到"知识库"标签
2. 点击分类标签筛选
3. 浏览该分类下的所有知识

#### 知识详情

每个知识条目包含：
- **标题** - 视频标题
- **摘要** - AI生成的内容摘要
- **关键点** - 提取的核心要点
- **标签** - 相关主题标签
- **分类** - 知识分类
- **来源** - 原始视频链接

### 批量处理

#### 批量导入

```python
import requests

urls = [
    "https://www.douyin.com/video/xxx",
    "https://www.bilibili.com/video/yyy",
    "https://www.youtube.com/watch?v=zzz"
]

response = requests.post(
    "http://localhost:8000/api/videos/batch",
    json=urls
)
print(response.json())
```

#### 查看处理进度

```python
# 获取视频状态
response = requests.get(f"http://localhost:8000/api/videos/{video_id}")
data = response.json()
print(f"状态: {data['status']}, 进度: {data['progress']}%")
```

## 高级功能

### 知识导出

#### 导出为JSON

```bash
curl http://localhost:8000/api/knowledge/export?format=json > knowledge.json
```

#### 导出为Markdown

```python
import requests

response = requests.get("http://localhost:8000/api/knowledge/export")
data = response.json()

# 转换为Markdown
for entry in data['data']:
    print(f"# {entry['metadata']['title']}")
    print(f"\n{entry['content']}")
    print("\n---\n")
```

### API集成

#### Python示例

```python
import requests

class VideoBrainClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
    
    def process_video(self, url):
        response = requests.post(
            f"{self.base_url}/api/videos/process",
            json={"url": url}
        )
        return response.json()
    
    def search(self, query, limit=10):
        response = requests.post(
            f"{self.base_url}/api/knowledge/search",
            json={"query": query, "limit": limit}
        )
        return response.json()
    
    def get_video(self, video_id):
        response = requests.get(f"{self.base_url}/api/videos/{video_id}")
        return response.json()

# 使用示例
client = VideoBrainClient()

# 处理视频
result = client.process_video("https://www.douyin.com/video/xxx")
print(f"视频ID: {result['video_id']}")

# 搜索知识
results = client.search("人工智能")
for r in results['results']:
    print(f"- {r['metadata']['title']}")
```

## 常见问题

### Q: 处理失败怎么办？

A: 检查以下几点：
1. 视频链接是否正确
2. 视频是否可以正常访问
3. OpenAI API Key是否有效
4. 网络连接是否正常

### Q: 处理时间太长？

A: 处理时间取决于：
- 视频时长（通常1-2分钟视频需要2-5分钟处理）
- 网络速度（下载视频）
- API响应速度

### Q: 支持哪些视频格式？

A: 支持所有主流视频格式：
- MP4
- WebM
- MKV
- AVI
- MOV

### Q: 如何提高搜索准确度？

A: 尝试以下方法：
1. 使用更具体的关键词
2. 结合多个关键词搜索
3. 使用筛选条件缩小范围
4. 尝试同义词或相关词汇

### Q: 知识库容量有限制吗？

A: 默认使用SQLite数据库，适合小规模使用。如需大规模部署，建议：
1. 使用PostgreSQL数据库
2. 配置更大的存储空间
3. 定期清理不需要的数据

## 最佳实践

### 1. 视频选择

- 选择内容质量高的视频
- 避免过长的视频（建议5分钟以内）
- 选择有清晰语音的视频

### 2. 关键词优化

- 使用准确的关键词
- 结合行业术语
- 尝试不同的表述方式

### 3. 知识管理

- 定期整理知识库
- 删除重复或低质量内容
- 建立知识分类体系

### 4. 团队协作

- 共享知识库访问权限
- 建立统一的标签规范
- 定期同步和备份数据

## 技术支持

如有问题，请通过以下方式联系：

- GitHub Issues: https://github.com/yourusername/videobrain/issues
- 邮箱: support@videobrain.com
- 文档: https://videobrain.readthedocs.io