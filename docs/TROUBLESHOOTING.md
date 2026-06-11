# VideoBrain 故障排除指南

## 常见问题及解决方案

### 1. 启动问题

#### 问题: Docker 启动失败

**症状**: `docker-compose up` 报错

**解决方案**:
```bash
# 检查 Docker 是否运行
docker --version
docker-compose --version

# 检查端口是否被占用
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

#### 问题: Python 依赖安装失败

**症状**: `pip install` 报错

**解决方案**:
```bash
# 升级 pip
pip install --upgrade pip

# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 安装系统依赖 (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install ffmpeg libsm6 libxext6 libxrender-dev
```

### 2. API Key 问题

#### 问题: OpenAI API Key 无效

**症状**: `API_KEY_ERROR` 或 `401 Unauthorized`

**解决方案**:
1. 检查 `.env` 文件中的 API Key
2. 确保 API Key 以 `sk-` 开头
3. 检查 API Key 是否有足够的额度
4. 测试 API Key:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

### 3. 视频处理问题

#### 问题: 视频下载失败

**症状**: `VIDEO_DOWNLOAD_ERROR`

**解决方案**:
1. 检查视频链接是否有效
2. 确认平台是否支持
3. 检查网络连接
4. 尝试使用代理:
   ```env
   HTTP_PROXY=http://proxy:port
   HTTPS_PROXY=http://proxy:port
   ```

#### 问题: 音频提取失败

**症状**: `AUDIO_EXTRACTION_ERROR`

**解决方案**:
1. 检查 FFmpeg 是否安装:
   ```bash
   ffmpeg -version
   ```
2. 安装 FFmpeg:
   ```bash
   # Ubuntu/Debian
   sudo apt install ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Windows
   choco install ffmpeg
   ```

#### 问题: 语音转文字失败

**症状**: `TRANSCRIPTION_ERROR`

**解决方案**:
1. 检查音频文件是否正常
2. 确认 OpenAI API 可用
3. 检查文件大小（限制 25MB）
4. 尝试使用更短的音频

### 4. 数据库问题

#### 问题: 数据库连接失败

**症状**: `数据库连接错误`

**解决方案**:
1. 检查数据库配置
2. 确保数据库服务运行
3. 检查防火墙设置
4. SQLite 检查文件权限:
   ```bash
   ls -la videobrain.db
   chmod 666 videobrain.db
   ```

### 5. 前端问题

#### 问题: 页面加载失败

**症状**: 白屏或错误页面

**解决方案**:
1. 检查后端服务是否运行
2. 查看浏览器控制台错误
3. 清除浏览器缓存
4. 检查 API URL 配置:
   ```env
   API_URL=http://localhost:8000
   ```

#### 问题: 搜索无结果

**症状**: 搜索返回空结果

**解决方案**:
1. 确认已有处理完成的视频
2. 尝试不同的关键词
3. 检查知识库状态:
   ```bash
   curl http://localhost:8000/api/knowledge/stats
   ```

### 6. 性能问题

#### 问题: 处理速度慢

**解决方案**:
1. 增加服务器资源
2. 使用更快的网络
3. 选择更短的视频
4. 优化配置:
   ```env
   MAX_VIDEO_DURATION=300
   VIDEO_QUALITY=480p
   ```

#### 问题: 内存不足

**解决方案**:
1. 增加系统内存
2. 增加 swap 空间:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```
3. 限制并发处理数

## 日志查看

### Docker 日志
```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 应用日志
```bash
# 后端日志
tail -f logs/app.log

# 实时日志
docker-compose logs -f --tail=100
```

## 调试模式

### 启用调试日志
```env
LOG_LEVEL=DEBUG
```

### 开发模式
```bash
# 后端开发模式
cd backend
uvicorn api.main:app --reload --log-level debug

# 前端开发模式
cd frontend
npm run dev
```

## 获取帮助

### 检查服务状态
```bash
# 健康检查
curl http://localhost:8000/health

# 前端状态
curl http://localhost:3000
```

### 收集诊断信息
```bash
# 系统信息
uname -a
docker --version
python --version
node --version

# 服务状态
docker-compose ps
docker stats --no-stream
```

### 提交问题

如果问题仍未解决，请提交 Issue：

1. 访问 [GitHub Issues](https://github.com/yourusername/videobrain/issues)
2. 使用 Bug Report 模板
3. 包含以下信息：
   - 操作系统版本
   - Docker 版本
   - 错误日志
   - 复现步骤