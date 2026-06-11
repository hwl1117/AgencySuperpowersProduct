# VideoBrain Backend

VideoBrain 后端服务，基于 FastAPI 构建。

## 技术栈

- **Python 3.11** - 主要语言
- **FastAPI** - Web 框架
- **SQLAlchemy** - ORM
- **ChromaDB** - 向量数据库
- **yt-dlp** - 视频下载
- **FFmpeg** - 音视频处理
- **OpenAI API** - AI 服务

## 目录结构

```
backend/
├── api/                    # API 接口
│   ├── main.py            # 主 API 文件
│   └── __init__.py
├── services/              # 业务服务
│   ├── video_downloader.py    # 视频下载
│   ├── audio_extractor.py     # 音频提取
│   ├── speech_to_text.py      # 语音转文字
│   ├── visual_analyzer.py     # 视觉分析
│   ├── ai_summarizer.py       # AI 概括
│   ├── knowledge_base.py      # 知识库管理
│   └── __init__.py
├── models/                # 数据模型
│   ├── database.py        # 数据库模型
│   └── __init__.py
├── middleware/            # 中间件
│   ├── error_handler.py   # 错误处理
│   ├── request_logger.py  # 请求日志
│   └── __init__.py
├── utils/                 # 工具函数
│   ├── logger.py          # 日志工具
│   ├── validators.py      # 验证工具
│   ├── file_utils.py      # 文件工具
│   ├── cache.py           # 缓存工具
│   ├── exceptions.py      # 自定义异常
│   └── __init__.py
├── migrations/            # 数据库迁移
│   ├── versions/          # 迁移版本
│   ├── env.py             # 迁移环境
│   └── script.py.mako     # 迁移模板
├── config.py              # 配置文件
├── requirements.txt       # Python 依赖
├── alembic.ini            # Alembic 配置
├── Dockerfile             # Docker 配置
└── __init__.py
```

## 开发

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
uvicorn api.main:app --reload --port 8000
```

## 环境变量

创建 `.env` 文件：

```env
OPENAI_API_KEY=your_api_key_here
DATABASE_URL=sqlite:///./videobrain.db
REDIS_URL=redis://localhost:6379/0
```

## API 接口

### 视频处理

- `POST /api/videos/process` - 处理视频
- `GET /api/videos/{id}` - 获取视频信息
- `GET /api/videos` - 获取视频列表
- `POST /api/videos/batch` - 批量处理

### 知识库

- `POST /api/knowledge/search` - 搜索知识库
- `GET /api/knowledge/{id}` - 获取知识条目
- `GET /api/knowledge/categories/list` - 获取分类列表
- `GET /api/knowledge/stats` - 获取统计信息
- `GET /api/knowledge/export` - 导出知识库

### 系统

- `GET /health` - 健康检查

## 服务说明

### VideoDownloader

视频下载服务，支持多平台：
- 抖音
- B站
- YouTube
- 快手
- TikTok
- 小红书

### AudioExtractor

音频提取服务，使用 FFmpeg：
- 提取音频轨道
- 提取关键帧
- 音频格式转换

### SpeechToTextService

语音转文字服务，使用 OpenAI Whisper：
- 音频转录
- 大文件分片处理
- 多语言支持

### VisualAnalyzer

视觉分析服务，使用 GPT-4V：
- 关键帧分析
- 文字提取
- 内容概括

### AISummarizer

AI 概括服务，使用 GPT-4：
- 内容摘要生成
- 关键点提取
- 知识分类

### KnowledgeBaseManager

知识库管理服务，使用 ChromaDB：
- 向量存储
- 语义搜索
- 知识导出

## 数据库

### 表结构

- **videos** - 视频记录表
- **knowledge_entries** - 知识库条目表
- **processing_tasks** - 处理任务表

### 迁移

```bash
# 生成迁移
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

## 测试

```bash
# 运行所有测试
pytest tests/ -v

# 运行特定测试
pytest tests/test_api.py -v

# 生成覆盖率报告
pytest tests/ --cov=services --cov-report=html
```