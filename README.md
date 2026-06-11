# VideoBrain - 短视频智能知识库

<p align="center">
  <strong>结合 Agency-Agents 与 Superpowers 的智能知识库系统</strong>
</p>

<p align="center">
  通过短视频平台链接，一键识别视频内容，自动生成结构化知识
</p>

---

## ✨ 核心特性

- 🎬 **多平台支持** - 抖音、B站、YouTube、快手、TikTok、小红书
- 🧠 **AI驱动** - GPT-4内容理解与概括
- 🔍 **智能搜索** - 基于向量的语义搜索
- 📚 **知识管理** - 结构化知识库存储
- ⚡ **一键操作** - 粘贴链接即可处理

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户界面 (Next.js)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API服务 (FastAPI)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 视频下载  │  │ 音频提取  │  │ 语音转文字│  │ 视觉分析  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AI概括服务 (GPT-4)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          知识库管理 (ChromaDB向量数据库)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone https://github.com/yourusername/videobrain.git
cd videobrain

# 复制环境变量配置
cp .env.example .env

# 编辑 .env 文件，填入 OpenAI API Key
OPENAI_API_KEY=your_api_key_here
```

### 2. Docker部署（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

访问 http://localhost:3000 即可使用

### 3. 本地开发

#### 后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn api.main:app --reload --port 8000
```

#### 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📖 使用指南

### 处理视频

1. 访问 http://localhost:3000
2. 在输入框粘贴短视频链接
3. 点击"开始处理"按钮
4. 等待处理完成（通常需要2-5分钟）

### 搜索知识

1. 切换到"搜索知识"标签
2. 输入关键词进行搜索
3. 系统会返回最相关的知识条目

### 浏览知识库

1. 切换到"知识库"标签
2. 按分类浏览已处理的视频
3. 查看详细的知识摘要和关键点

## 🔧 技术栈

### 后端
- **Python 3.11** - 主要语言
- **FastAPI** - Web框架
- **SQLAlchemy** - ORM
- **ChromaDB** - 向量数据库
- **yt-dlp** - 视频下载
- **FFmpeg** - 音视频处理
- **OpenAI Whisper** - 语音识别
- **GPT-4** - 内容理解与概括

### 前端
- **Next.js 14** - React框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库

## 📁 项目结构

```
videobrain/
├── backend/                 # 后端服务
│   ├── api/                # API接口
│   │   └── main.py         # 主API文件
│   ├── services/           # 业务服务
│   │   ├── video_downloader.py    # 视频下载
│   │   ├── audio_extractor.py     # 音频提取
│   │   ├── speech_to_text.py      # 语音转文字
│   │   ├── visual_analyzer.py     # 视觉分析
│   │   ├── ai_summarizer.py       # AI概括
│   │   └── knowledge_base.py      # 知识库管理
│   ├── models/             # 数据模型
│   │   └── database.py     # 数据库模型
│   ├── requirements.txt    # Python依赖
│   └── Dockerfile          # 后端Docker配置
├── frontend/               # 前端应用
│   ├── src/                # 源代码
│   │   └── app/            # Next.js应用
│   ├── package.json        # Node依赖
│   └── Dockerfile          # 前端Docker配置
├── tests/                  # 测试文件
├── docs/                   # 文档
├── docker-compose.yml      # Docker编排
├── .env.example            # 环境变量示例
└── README.md               # 项目说明
```

## 🔌 API接口

### 视频处理

```http
POST /api/videos/process
Content-Type: application/json

{
  "url": "https://www.douyin.com/video/xxx",
  "language": "zh"
}
```

### 搜索知识库

```http
POST /api/knowledge/search
Content-Type: application/json

{
  "query": "人工智能",
  "category": "科技",
  "limit": 10
}
```

### 获取视频信息

```http
GET /api/videos/{video_id}
```

### 获取知识库统计

```http
GET /api/knowledge/stats
```

## 🎯 处理流程

```
1. 解析链接 → 识别平台和视频ID
       ↓
2. 下载视频 → 获取视频文件
       ↓
3. 提取音频 → 分离音视频轨道
       ↓
4. 语音转文字 → Whisper API转录
       ↓
5. 视觉分析 → GPT-4V分析关键帧
       ↓
6. AI概括 → 生成结构化知识
       ↓
7. 存入知识库 → 向量数据库存储
```

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [OpenAI](https://openai.com/) - GPT-4和Whisper API
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - 视频下载
- [ChromaDB](https://www.trychroma.com/) - 向量数据库
- [FastAPI](https://fastapi.tiangolo.com/) - Web框架
- [Next.js](https://nextjs.org/) - React框架

## 📞 联系方式

- 项目链接: https://github.com/yourusername/videobrain
- 问题反馈: Issues

---

<p align="center">
  Made with ❤️ by VideoBrain Team
</p>