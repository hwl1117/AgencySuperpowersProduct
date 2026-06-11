# VideoBrain 设计上下文文档

## 项目概述
- **名称**: VideoBrain - 短视频智能知识库
- **版本**: v2.7
- **功能**: 通过短视频平台链接，一键识别视频内容并概括优化成知识库
- **支持平台**: 抖音、B站、YouTube、快手、TikTok、小红书、微信视频号

## 技术栈
- **前端**: Next.js 14.0.4 + React 18 + TypeScript
- **后端**: Express.js (Node.js)
- **样式**: Tailwind CSS 3 + CSS Variables 双主题系统
- **动画**: @paper-design/shaders-react (WebGL Shader)
- **AI模型**: 小米 MiMo v2.5 Pro
- **语音转文字**: Whisper
- **图标**: lucide-react

## 文件结构
```
VideoBrain-Design副本/
├── restart-dev.bat              # 一键重启脚本 (v2.8)
├── VideoBrain-Design-Context.md # 本设计文档
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css          # 全局样式 + 双主题变量
│   │   │   ├── layout.tsx           # 根布局 + 主题防闪烁脚本
│   │   │   └── page.tsx             # 主页面
│   │   └── components/
│   │       ├── VideoBrainShader.tsx  # 全页面 Shader 动画背景
│   │       └── Toast.tsx            # Toast 通知组件
│   ├── public/
│   │   ├── favicon.ico
│   │   └── VideoBrain.png
│   ├── package.json
│   ├── tsconfig.json            # TypeScript 配置 (含 @/ 路径别名)
│   ├── tailwind.config.ts       # Tailwind CSS 配置 ⚠️ 必需
│   └── postcss.config.js        # PostCSS 配置 ⚠️ 必需
│
└── backend-node/
    ├── server-v2.js             # Express API 服务器 (端口 8000)
    └── package.json             # 后端依赖
```

## 设计系统

### 双主题 CSS 变量
浅色主题 `:root` / 深色主题 `[data-theme="dark"]`

| 变量 | 浅色 | 深色 | 用途 |
|------|------|------|------|
| --bg | #fafafa | #09090b | 页面背景 |
| --surface | #ffffff | #1c1c1e | 卡片/面板 |
| --text | #0a0a0a | #ffffff | 主文字 |
| --text-secondary | #3f3f46 | #e4e4e7 | 次文字 |
| --text-muted | #71717a | #a1a1aa | 辅助文字 |
| --primary | #6366f1 | #818cf8 | 主色调 |
| --border | #e4e4e7 | #27272a | 边框 |
| --shadow-md | 0 2px 8px rgba(0,0,0,0.06) | 0 2px 8px rgba(0,0,0,0.3) | 阴影 |

### 字体大小系统
通过 `[data-font-size]` 属性切换：small / medium(默认) / large

### 组件样式类
- `.card-custom` - 卡片 (含 backdrop-filter 毛玻璃)
- `.btn-primary` - 主按钮
- `.btn-secondary` - 次按钮
- `.btn-ghost` - 幽灵按钮
- `.tag` / `.tag-green` / `.tag-purple` 等 - 标签
- `.input-custom` - 输入框
- `.status-success` / `.status-error` - 状态提示
- `.text-ink` / `.text-ink-muted` / `.text-ink-ghost` - 主题文字色
- `.icon-primary` / `.icon-success` / `.icon-error` - 图标色
- `.category-btn` - 侧边栏分类按钮

## v2.7 新增：Shader 全页面背景

### 组件: VideoBrainShader.tsx
- 使用 `@paper-design/shaders-react` 的 `<Warp>` 组件
- WebGL 渲染的流体动画效果
- 浅色主题: 青蓝色系 (hsl 200/160/180/170)
- 深色主题: 深青蓝色系 (低亮度高饱和)
- `dynamic import` + `ssr: false` 避免服务端渲染报错
- `key={theme}` 确保主题切换时重新渲染

### 页面结构 (v2.7)
```
<div min-h-screen>
  ├── Shader 全屏背景层 (fixed, z-index: 0)
  │   ├── <Warp /> 动画
  │   └── 半透明遮罩 rgba(255,255,255,0.2)
  └── 内容层 (relative, z-index: 1)
      ├── 顶部导航栏 (sticky, backdrop-blur)
      │   ├── Logo + 品牌名
      │   ├── Tab 切换 (处理/搜索/知识库)
      │   └── 统计 + 主题/字体切换
      └── main 主内容区
          ├── Process Tab: Hero + 输入框 + 处理流程
          ├── Search Tab: 搜索框 + 结果列表
          ├── Library Tab: 侧边栏 + 视频列表
          ├── Detail Modal: 视频详情/编辑
          └── Footer
```

## API 端点
- POST `/api/videos/process` - 处理视频
- GET `/api/videos/:id` - 获取视频详情
- PUT `/api/videos/:id` - 编辑视频
- DELETE `/api/videos/:id` - 删除视频
- POST `/api/videos/delete-batch` - 批量删除
- POST `/api/knowledge/search` - 搜索知识库
- GET `/api/knowledge/stats` - 统计信息
- GET `/api/categories` - 获取分类
- POST `/api/categories` - 创建分类
- PUT `/api/categories/:name` - 重命名分类
- DELETE `/api/categories/:name` - 删除分类
- POST `/api/categories/move` - 移动分类

## 键盘快捷键
- `Ctrl+K` - 跳转搜索
- `Ctrl+L` - 跳转知识库
- `Ctrl+S` - 保存编辑
- `Escape` - 关闭弹窗

## 启动方式

### 推荐方式：一键启动
```
双击 restart-dev.bat
```
脚本会自动：
1. 清理占用端口的旧进程
2. 清除 `.next` 缓存
3. 检查并安装依赖（首次运行）
4. 启动后端 (端口 8000) 和前端 (端口 3000)
5. 打开浏览器

### 手动启动
```bash
# 后端 (端口 8000)
cd backend-node && node server-v2.js

# 前端 (端口 3000)
cd frontend && npx next dev -p 3000
```

## ⚠️ 必需配置文件（缺失会导致排版问题）

前端正常运行需要以下配置文件，**缺失任何一个都会导致样式失效**：

| 文件 | 作用 | 缺失后果 |
|------|------|----------|
| `tailwind.config.ts` | Tailwind CSS 扫描路径配置 | 所有 Tailwind 类不生效 |
| `postcss.config.js` | PostCSS 插件配置 | @tailwind 指令不编译 |
| `tsconfig.json` 中的 `paths` | `@/` 路径别名 | 模块导入报错 |

## 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 页面打不开 (502) | 前端服务未启动 | 双击 `restart-dev.bat` |
| 排版炸了/无样式 | 缺少 tailwind/postcss 配置 | 检查配置文件是否存在 |
| 端口被占用 | 旧进程未关闭 | `restart-dev.bat` 会自动清理 |
| Module not found: @/... | tsconfig 缺少 paths 配置 | 添加 `"paths": {"@/*": ["./src/*"]}` |
| .next 缓存损坏 | 频繁修改文件 | 删除 `.next` 文件夹重启 |

## 注意事项
- Shader 使用 WebGL，需要浏览器支持
- dev 服务器频繁改文件可能导致 `.next` 缓存损坏，用 restart-dev.bat 修复
- 主题通过 localStorage 持久化，layout.tsx 有防闪烁脚本
- `@paper-design/shaders-react` 需要 `@paper-design/shaders` 作为依赖
- 首次运行 `restart-dev.bat` 会自动安装依赖，需要等待 1-2 分钟
