# VideoBrain 部署指南

## 部署方式

### 1. Docker部署（推荐）

#### 前置要求
- Docker 20.10+
- Docker Compose 2.0+
- OpenAI API Key

#### 部署步骤

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/videobrain.git
cd videobrain

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 OpenAI API Key

# 3. 启动服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f
```

#### 访问服务
- 前端界面: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

### 2. 本地开发部署

#### 前置要求
- Python 3.11+
- Node.js 18+
- FFmpeg
- OpenAI API Key

#### 后端部署

```bash
# 1. 进入后端目录
cd backend

# 2. 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 安装依赖
pip install -r requirements.txt

# 4. 配置环境变量
export OPENAI_API_KEY=your_api_key_here

# 5. 启动服务
uvicorn api.main:app --reload --port 8000
```

#### 前端部署

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖
npm install

# 3. 配置环境变量
export API_URL=http://localhost:8000

# 4. 启动开发服务器
npm run dev
```

### 3. 生产环境部署

#### 使用Gunicorn（后端）

```bash
# 安装Gunicorn
pip install gunicorn

# 启动服务
gunicorn api.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

#### 使用Nginx（反向代理）

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
}
```

#### 使用Systemd（服务管理）

创建 `/etc/systemd/system/videobrain-backend.service`:

```ini
[Unit]
Description=VideoBrain Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/videobrain/backend
Environment="PATH=/path/to/videobrain/backend/venv/bin"
ExecStart=/path/to/videobrain/backend/venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

创建 `/etc/systemd/system/videobrain-frontend.service`:

```ini
[Unit]
Description=VideoBrain Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/videobrain/frontend
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable videobrain-backend videobrain-frontend
sudo systemctl start videobrain-backend videobrain-frontend
```

## 环境变量配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| OPENAI_API_KEY | OpenAI API密钥 | 必填 |
| DATABASE_URL | 数据库连接URL | sqlite:///./videobrain.db |
| REDIS_URL | Redis连接URL | redis://localhost:6379/0 |
| API_HOST | API服务地址 | 0.0.0.0 |
| API_PORT | API服务端口 | 8000 |
| FRONTEND_PORT | 前端服务端口 | 3000 |
| DOWNLOAD_DIR | 视频下载目录 | ./downloads |
| AUDIO_DIR | 音频文件目录 | ./audio |
| KNOWLEDGE_BASE_DIR | 知识库目录 | ./knowledge_base_db |
| LOG_LEVEL | 日志级别 | INFO |

## 性能优化

### 1. 数据库优化

```python
# 使用PostgreSQL替代SQLite
DATABASE_URL=postgresql://user:password@localhost:5432/videobrain
```

### 2. 缓存配置

```python
# 使用Redis缓存
REDIS_URL=redis://localhost:6379/0
```

### 3. 并发处理

```bash
# 增加Gunicorn worker数量
gunicorn api.main:app -w 8 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### 4. 文件存储

```bash
# 使用对象存储（如AWS S3）
# 配置相应的环境变量
```

## 监控和日志

### 日志配置

```python
# 在 .env 中配置
LOG_LEVEL=INFO
LOG_FILE=/var/log/videobrain/app.log
```

### 健康检查

```bash
# 检查后端服务
curl http://localhost:8000/health

# 检查前端服务
curl http://localhost:3000
```

### 性能监控

推荐使用：
- Prometheus + Grafana
- New Relic
- Datadog

## 安全配置

### 1. HTTPS配置

```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 2. 防火墙配置

```bash
# 只开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. API认证

```python
# 在 main.py 中添加JWT认证
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

@app.get("/protected")
async def protected_route(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # 验证token
    pass
```

## 故障排除

### 常见问题

1. **FFmpeg未安装**
   ```bash
   # Ubuntu/Debian
   sudo apt install ffmpeg
   
   # CentOS/RHEL
   sudo yum install ffmpeg
   ```

2. **OpenAI API Key错误**
   ```bash
   # 检查环境变量
   echo $OPENAI_API_KEY
   ```

3. **端口被占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :8000
   # 或
   netstat -tulpn | grep 8000
   ```

4. **内存不足**
   ```bash
   # 查看内存使用
   free -h
   # 增加swap
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

## 扩展部署

### 水平扩展

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
    ports:
      - "8000-8002:8000"
```

### 负载均衡

```nginx
upstream videobrain_backend {
    server localhost:8000;
    server localhost:8001;
    server localhost:8002;
}

server {
    location /api {
        proxy_pass http://videobrain_backend;
    }
}
```