---
date: 2026-06-11
tags: [VideoBrain, 项目优化, 安全修复, 代码审查, Claude-Code]
source: Claude Code 全 Skill 优化
priority: high
status: 已完成
---

# VideoBrain 项目全面优化记录

> 短视频智能知识库系统 — 使用 6 个 Claude Code Skill 完成全面安全审计与代码优化

## 项目概览

**VideoBrain** 是一个短视频智能知识库系统，支持从抖音、B站、YouTube、快手、TikTok、小红书等平台粘贴视频链接，自动下载、转录、分析并生成结构化知识。

**技术栈：**
- 后端：Python FastAPI + SQLAlchemy + ChromaDB + Whisper + GPT-4
- 前端：Next.js 14 + TypeScript + Tailwind CSS
- 桌面：Electron (Chrome app mode 替代方案)
- Node.js 后端：Express + MiMo AI (独立替代方案)

## 执行的 Skills

| # | Skill | 产出 |
|---|-------|------|
| 1 | `init` | 生成 CLAUDE.md（120行） |
| 2 | `code-review` | 发现 15 个问题（4 Critical + 5 High + 6 Medium） |
| 3 | `security-review` | 发现 7 个安全漏洞（2 HIGH + 4 MEDIUM + 1 LOW） |
| 4 | `simplify` | 发现 ~3100 行死代码 + 11 个架构问题 |
| 5 | `verify` | 验证代码变更正确性（PASS） |
| 6 | `neat-freak` | 同步 4 个文档文件 |

## 修复清单（16 项）

### 🔴 Critical 修复

| # | 问题 | 文件 | 修复方式 |
|---|------|------|----------|
| 1 | 硬编码 MiMo API Key | `server-v2.js`, `server-mimo.js`, `server-full.js` | 改用 `process.env.MIMO_API_KEY` |
| 2 | 命令注入漏洞 | `server-v2.js` | `exec()` → `execFile()` + 参数数组 |
| 3 | CORS 完全开放 | `backend/api/main.py` | 限制为 `localhost:3000` |
| 4 | 转录失败未设 failed | `backend/api/main.py` | 添加失败状态设置 + 提前返回 |
| 5 | `chunk_duration` 未定义 | `speech_to_text.py` | 添加 `chunk_duration = 600` |

### 🟠 High 修复

| # | 问题 | 文件 | 修复方式 |
|---|------|------|----------|
| 6 | `hash()` 不确定性 | `video_downloader.py` | 改用 `hashlib.md5()` |
| 7 | 事件循环阻塞 | `main.py` | `asyncio.to_thread()` 包装 |
| 8 | 无重试机制 | `main.py` | 新增 `POST /api/videos/{id}/retry` |
| 9 | 前端 API 地址硬编码 | `page.tsx`, `api.ts` | 统一用 `NEXT_PUBLIC_API_URL` |
| 10 | 临时目录竞态 | `speech_to_text.py` | `tempfile.mkdtemp()` |

### 🟡 Medium 修复

| # | 问题 | 文件 | 修复方式 |
|---|------|------|----------|
| 11 | retry 不接受 processing | `main.py` | 扩展状态检查 |
| 12 | 中间件未接入 | `main.py` | 接入 ErrorHandler + RequestLogger |
| 13 | ProcessingTask 死代码 | `database.py` | 移除模型 + 更新导出 |
| 14 | .env.example 不完整 | `.env.example` | 添加 MIMO_API_KEY, NEXT_PUBLIC_API_URL |
| 15 | CLAUDE.md 过期 | `CLAUDE.md` | 更新 Gotchas 和环境变量表 |
| 16 | API 文档缺失 retry | `docs/API.md` | 添加 retry 端点文档 |

## 安全审计发现

| 严重程度 | 漏洞 | 状态 |
|---------|------|------|
| 🔴 HIGH | 硬编码 API Key | ✅ 已修复 |
| 🔴 HIGH | 命令注入（exec） | ✅ 已修复 |
| 🟠 MEDIUM | CORS 全开放 | ✅ 已修复 |
| 🟠 MEDIUM | 无认证机制 | ⚠️ 待实现 |
| 🟠 MEDIUM | SSRF 风险 | ⚠️ 待添加 URL 白名单 |
| 🟠 MEDIUM | Puppeteer 无沙箱 | ⚠️ 建议 Docker 运行 |
| 🟡 LOW | dangerouslySetInnerHTML | ✅ 可接受（硬编码内容） |

## 架构问题（待优化）

| 问题 | 影响 | 建议 |
|------|------|------|
| 前端双架构（根页面 vs 路由页面） | 维护困难 | 统一使用 apiClient + hooks |
| CSS 4943 行（大量重复 Tailwind） | 包体积大 | 精简至 ~500 行 |
| Config 未连接 | 配置不可用 | 服务改用 settings 对象 |
| 死代码（utils/、middleware/） | 代码混乱 | 要么接入要么删除 |
| SentenceTransformer 启动加载 | 启动慢 | 改为懒加载 |

## 桌面应用方案

**问题：** Electron 二进制文件缺少内置 `electron` 模块，`require('electron')` 返回路径字符串。

**解决方案：** 使用 Chrome app 模式替代：
```batch
VideoBrain-Desktop.bat
```
Chrome `--app` 模式提供相同的桌面体验：独立窗口、无地址栏、可固定任务栏。

## 访问地址

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3001 |
| 后端 | http://localhost:8000 |
| 健康检查 | http://localhost:8000/health |
| API 文档 | http://localhost:8000/docs |

## 关键文件索引

| 文件 | 用途 |
|------|------|
| `CLAUDE.md` | 项目 AI 指导文档 |
| `backend/api/main.py` | FastAPI 主应用（所有路由） |
| `backend/services/` | 6 个服务类 |
| `frontend/src/app/page.tsx` | 前端主页面（1277行） |
| `frontend/src/lib/api.ts` | API 客户端 |
| `electron/main.js` | Electron 主进程 |
| `VideoBrain-Desktop.bat` | 桌面应用启动器 |

---
*由 Claude Code 于 2026-06-11 自动生成，基于完整项目优化会话*
