# VideoBrain Frontend

VideoBrain 前端应用，基于 Next.js 14 构建。

## 技术栈

- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库

## 目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── docs/              # 文档页面
│   ├── library/           # 知识库页面
│   ├── search/            # 搜索页面
│   ├── videos/            # 视频详情页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── loading.tsx        # 加载状态
│   ├── error.tsx          # 错误页面
│   └── not-found.tsx      # 404页面
├── components/            # React 组件
│   ├── Header.tsx         # 头部导航
│   ├── Footer.tsx         # 底部
│   ├── LoadingSpinner.tsx # 加载动画
│   ├── ErrorBoundary.tsx  # 错误边界
│   ├── VideoPlayer.tsx    # 视频播放器
│   ├── SearchInput.tsx    # 搜索输入框
│   ├── KnowledgeCard.tsx  # 知识卡片
│   ├── StatsCard.tsx      # 统计卡片
│   ├── PlatformBadge.tsx  # 平台标签
│   ├── StatusBadge.tsx    # 状态标签
│   └── index.ts           # 组件导出
├── hooks/                 # 自定义 Hooks
│   ├── useVideoProcessor.ts # 视频处理 Hook
│   ├── useSearch.ts       # 搜索 Hook
│   ├── useStats.ts        # 统计 Hook
│   └── index.ts           # Hooks 导出
└── lib/                   # 工具库
    ├── api.ts             # API 客户端
    ├── utils.ts           # 工具函数
    └── constants.ts       # 常量定义
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 环境变量

创建 `.env.local` 文件：

```env
API_URL=http://localhost:8000
```

## 页面说明

- `/` - 首页，视频处理入口
- `/search` - 知识库搜索
- `/library` - 知识库浏览
- `/docs` - 文档中心
- `/videos/[id]` - 视频详情

## 组件说明

### 核心组件

- **Header** - 顶部导航栏
- **Footer** - 底部信息
- **LoadingSpinner** - 加载动画
- **ErrorBoundary** - 错误边界处理

### 业务组件

- **VideoPlayer** - 视频播放器
- **SearchInput** - 搜索输入框
- **KnowledgeCard** - 知识条目卡片
- **StatsCard** - 统计数据卡片
- **PlatformBadge** - 平台标识
- **StatusBadge** - 状态标识

## Hooks

- **useVideoProcessor** - 视频处理状态管理
- **useSearch** - 搜索功能封装
- **useStats** - 统计数据获取