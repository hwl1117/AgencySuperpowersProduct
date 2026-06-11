# VideoBrain 安装指南

## 系统要求

### 最低要求
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 20.04+
- **内存**: 4GB RAM
- **存储**: 10GB 可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **内存**: 8GB+ RAM
- **存储**: 50GB+ 可用空间
- **CPU**: 4核+

### 软件依赖
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+

---

## 方式一：Docker 安装（推荐）

### 1. 安装 Docker

#### Windows
1. 下载 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. 运行安装程序
3. 启动 Docker Desktop

#### macOS
```bash
# 使用 Homebrew
brew install --cask docker

# 或下载 Docker Desktop
# https://www.docker.com/products/docker-desktop/
```

#### Ubuntu/Debian
```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 将用户添加到 docker 组
sudo usermod -aG docker $USER
```

### 2. 克隆项目

```bash
git clone https://github.com/yourusername/videobrain.git
cd videobrain
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 必填：OpenAI API Key
OPENAI_API_KEY=sk-your-api-key-here

# 可选配置
DATABASE_URL=sqlite:///./videobrain.db
REDIS_URL=redis://redis:6379/0
```

### 4. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps
```

### 5. 访问应用

- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

---

## 方式二：本地安装

### 1. 安装 Python

#### Windows
1. 下载 [Python 3.11](https://www.python.org/downloads/)
2. 运行安装程序
3. 勾选 "Add Python to PATH"

#### macOS
```bash
# 使用 Homebrew
brew install python@3.11
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install python3.11 python3.11-venv python3-pip
```

### 2. 安装 Node.js

#### Windows/macOS
1. 下载 [Node.js 18+](https://nodejs.org/)
2. 运行安装程序

#### Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. 安装 FFmpeg

#### Windows
```bash
# 使用 Chocolatey
choco install ffmpeg

# 或下载 https://ffmpeg.org/download.html
```

#### macOS
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

### 4. 克隆项目

```bash
git clone https://github.com/yourusername/videobrain.git
cd videobrain
```

### 5. 安装后端依赖

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 6. 安装前端依赖

```bash
cd ../frontend
npm install
```

### 7. 配置环境变量

```bash
cd ..
cp .env.example .env
```

编辑 `.env` 文件填入 OpenAI API Key。

### 8. 启动服务

#### 启动后端
```bash
cd backend
uvicorn api.main:app --reload --port 8000
```

#### 启动前端（新终端）
```bash
cd frontend
npm run dev
```

### 9. 访问应用

- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

---

## 验证安装

### 1. 健康检查

```bash
# 检查后端
curl http://localhost:8000/health

# 预期响应
# {"status":"healthy","service":"VideoBrain API","timestamp":"..."}
```

### 2. 前端检查

打开浏览器访问 http://localhost:3000，应该看到 VideoBrain 界面。

### 3. 测试处理

1. 在输入框粘贴一个视频链接
2. 点击"开始处理"
3. 等待处理完成

---

## 常见安装问题

### Docker 相关

**问题**: `docker-compose: command not found`
```bash
# 安装 docker-compose
sudo apt-get install docker-compose-plugin

# 或使用新版命令
docker compose up -d
```

**问题**: `permission denied`
```bash
# 将用户添加到 docker 组
sudo usermod -aG docker $USER
# 重新登录
```

### Python 相关

**问题**: `pip: command not found`
```bash
# 使用 pip3
pip3 install -r requirements.txt
```

**问题**: `ModuleNotFoundError`
```bash
# 确保激活了虚拟环境
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

### Node.js 相关

**问题**: `npm: command not found`
```bash
# 重新安装 Node.js
# https://nodejs.org/
```

**问题**: `EACCES: permission denied`
```bash
# 修复权限
sudo chown -R $(whoami) ~/.npm
```

### FFmpeg 相关

**问题**: `ffmpeg: command not found`
```bash
# 检查安装
which ffmpeg

# 重新安装
# Windows: choco install ffmpeg
# macOS: brew install ffmpeg
# Linux: sudo apt install ffmpeg
```

---

## 更新 VideoBrain

### Docker 方式
```bash
# 拉取最新代码
git pull

# 重新构建
docker-compose build --no-cache

# 重启服务
docker-compose up -d
```

### 本地方式
```bash
# 拉取最新代码
git pull

# 更新后端依赖
cd backend
pip install -r requirements.txt

# 更新前端依赖
cd ../frontend
npm install
```

---

## 卸载 VideoBrain

### Docker 方式
```bash
# 停止服务
docker-compose down

# 删除镜像
docker rmi videobrain-backend videobrain-frontend

# 删除数据（可选）
rm -rf downloads audio knowledge_base_db
```

### 本地方式
```bash
# 删除项目目录
rm -rf videobrain
```