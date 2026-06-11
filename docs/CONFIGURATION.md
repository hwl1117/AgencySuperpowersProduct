# VideoBrain 配置指南

## 环境变量配置

### 必填配置

```env
# OpenAI API Key（必填）
OPENAI_API_KEY=sk-your-api-key-here
```

### 可选配置

```env
# MiMo API配置（backend-node使用）
MIMO_API_KEY=your-mimo-api-key
MIMO_API_URL=https://token-plan-sgp.xiaomimimo.com/v1/chat/completions
MIMO_MODEL=mimo-v2.5-pro

# 前端API地址
NEXT_PUBLIC_API_URL=http://localhost:8000

# 数据库配置
DATABASE_URL=sqlite:///./videobrain.db

# Redis配置
REDIS_URL=redis://localhost:6379/0

# 服务配置
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_PORT=3000

# 文件存储路径
DOWNLOAD_DIR=./downloads
AUDIO_DIR=./audio
KNOWLEDGE_BASE_DIR=./knowledge_base_db

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=./logs/app.log

# 视频处理配置
MAX_VIDEO_DURATION=600
MAX_FILE_SIZE=104857600
VIDEO_QUALITY=720p

# AI模型配置
OPENAI_MODEL=gpt-4
WHISPER_MODEL=whisper-1
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

---

## 配置文件说明

### `.env` 文件

主配置文件，包含所有环境变量。

**位置**: 项目根目录

**示例**:
```env
OPENAI_API_KEY=sk-xxx
DATABASE_URL=sqlite:///./videobrain.db
LOG_LEVEL=INFO
```

### `backend/config.py`

后端配置模块，读取环境变量并提供默认值。

**主要配置项**:
- `APP_NAME`: 应用名称
- `APP_VERSION`: 应用版本
- `DEBUG`: 调试模式
- `DATABASE_URL`: 数据库连接
- `OPENAI_API_KEY`: API密钥
- `MAX_VIDEO_DURATION`: 最大视频时长
- `MAX_FILE_SIZE`: 最大文件大小

### `docker-compose.yml`

Docker编排配置。

**服务**:
- `backend`: 后端API服务
- `frontend`: 前端Web服务
- `redis`: Redis缓存服务

---

## 详细配置说明

### 1. OpenAI 配置

```env
# API密钥（必填）
OPENAI_API_KEY=sk-xxx

# 使用的模型
OPENAI_MODEL=gpt-4          # 可选: gpt-4, gpt-3.5-turbo
WHISPER_MODEL=whisper-1      # 语音识别模型
EMBEDDING_MODEL=all-MiniLM-L6-v2  # 嵌入模型
```

**获取API Key**:
1. 访问 https://platform.openai.com/
2. 注册并登录
3. 进入 API Keys 页面
4. 创建新的 API Key

**费用说明**:
- GPT-4: ~$0.03/1K tokens
- GPT-3.5-turbo: ~$0.002/1K tokens
- Whisper: $0.006/分钟

### 2. 数据库配置

```env
# SQLite（默认）
DATABASE_URL=sqlite:///./videobrain.db

# PostgreSQL（推荐生产环境）
DATABASE_URL=postgresql://user:password@localhost:5432/videobrain

# MySQL
DATABASE_URL=mysql://user:password@localhost:3306/videobrain
```

### 3. Redis 配置

```env
# 本地Redis
REDIS_URL=redis://localhost:6379/0

# 远程Redis
REDIS_URL=redis://:password@redis-host:6379/0

# 禁用Redis（使用内存缓存）
# 不设置 REDIS_URL 即可
```

### 4. 文件存储配置

```env
# 视频下载目录
DOWNLOAD_DIR=./downloads

# 音频文件目录
AUDIO_DIR=./audio

# 知识库存储目录
KNOWLEDGE_BASE_DIR=./knowledge_base_db

# 临时文件目录
TEMP_DIR=./temp
```

### 5. 视频处理配置

```env
# 最大视频时长（秒）
MAX_VIDEO_DURATION=600  # 10分钟

# 最大文件大小（字节）
MAX_FILE_SIZE=104857600  # 100MB

# 视频质量
VIDEO_QUALITY=720p  # 可选: 360p, 480p, 720p, 1080p

# 音频格式
AUDIO_FORMAT=wav  # 可选: wav, mp3

# 音频采样率
AUDIO_SAMPLE_RATE=16000
```

### 6. AI概括配置

```env
# 摘要最大长度
MAX_SUMMARY_LENGTH=500

# 最大关键点数量
MAX_KEY_POINTS=10

# 最大标签数量
MAX_TAGS=10
```

### 7. 知识库配置

```env
# 嵌入模型
EMBEDDING_MODEL=all-MiniLM-L6-v2

# 文本分块大小
CHUNK_SIZE=1000

# 分块重叠
CHUNK_OVERLAP=200
```

### 8. 日志配置

```env
# 日志级别
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL

# 日志文件
LOG_FILE=./logs/app.log

# 日志轮转
LOG_MAX_BYTES=10485760  # 10MB
LOG_BACKUP_COUNT=5
```

### 9. 服务配置

```env
# API服务
API_HOST=0.0.0.0
API_PORT=8000

# 前端服务
FRONTEND_PORT=3000

# 调试模式
DEBUG=false
```

---

## Docker 配置

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=sqlite:///./videobrain.db
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - ./downloads:/app/downloads
      - ./audio:/app/audio
      - ./knowledge_base_db:/app/knowledge_base_db
    depends_on:
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://backend:8000
    depends_on:
      - backend

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### 环境变量覆盖

```bash
# 使用自定义环境文件
docker-compose --env-file .env.production up -d

# 或直接传递环境变量
OPENAI_API_KEY=sk-xxx docker-compose up -d
```

---

## Nginx 配置（生产环境）

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 文件上传大小限制
    client_max_body_size 100M;
}
```

---

## 配置验证

### 检查配置

```bash
# 检查环境变量
echo $OPENAI_API_KEY

# 检查服务状态
curl http://localhost:8000/health

# 检查配置文件
cat .env
```

### 测试API连接

```bash
# 测试OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

## 配置最佳实践

### 1. 安全性

- 不要将 `.env` 文件提交到版本控制
- 使用强密码
- 定期轮换API密钥
- 使用环境变量而非硬编码

### 2. 性能

- 生产环境使用 PostgreSQL
- 启用 Redis 缓存
- 根据负载调整 worker 数量
- 配置适当的文件大小限制

### 3. 可维护性

- 使用 `.env.example` 作为模板
- 文档化所有配置项
- 使用有意义的默认值
- 分离开发和生产配置