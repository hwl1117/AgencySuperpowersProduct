---
date: 2026-06-12
tags: [VideoBrain, 项目更新, 长视频优化, 桌面应用, GitHub]
source: VideoBrain v2.6 最终版本
priority: high
status: 已完成
---

# VideoBrain v2.6 最终版本发布

> 短视频智能知识库 — 安全修复 + 长视频支持 + 桌面应用完善

## 本次更新内容

### 🔒 安全修复（5项）
| 修复 | 文件 | 说明 |
|------|------|------|
| 硬编码 API Key | `server-v2.js` 等 | 改用 `process.env.MIMO_API_KEY` |
| 命令注入 | `server-v2.js` | `exec()` → `execFile()` + 参数数组 |
| CORS 全开放 | `main.py` | 限制为 `localhost:3000` |
| hash() 不确定性 | `video_downloader.py` | 改用 `hashlib.md5()` |
| 临时目录竞态 | `speech_to_text.py` | `tempfile.mkdtemp()` |

### 🎬 长视频优化（4项）
| 优化 | 之前 | 之后 |
|------|------|------|
| 分析输入截断 | 1500 字符 | 分段分析，每段 4000 字符 |
| 分段合并 | 无 | 多段结果自动合并 |
| Whisper 模型 | `base` | `small`（更准确） |
| Whisper 超时 | 10 分钟 | 30 分钟 |

### 🖥️ 桌面应用
- 修复 Puppeteer Chrome 路径（反斜杠 → 正斜杠）
- 创建隐藏启动器（VBS + PowerShell）
- 快捷方式指向 `VideoBrain-Desktop.vbs`

### 📝 文档更新
- 新增 `CLAUDE.md` — 项目 AI 指导文档
- 更新 `docs/API.md` — 添加 retry 端点文档
- 更新 `docs/CONFIGURATION.md` — 添加新环境变量
- 更新 `.env.example` — 添加 MIMO_API_KEY

## Git 提交信息
```
cd365ac fix: security audit & long video support & desktop app
20 files changed, 532 insertions(+), 113 deletions(-)
```

## GitHub 仓库
https://github.com/hwl1117/AgencySuperpowersProduct

## 访问方式
| 方式 | 地址 |
|------|------|
| 网页端 | http://localhost:3000 |
| 桌面应用 | 双击桌面 "AgencySuperpowersProduct App" 快捷方式 |
| API | http://localhost:8000 |

---
*由 Claude Code 于 2026-06-12 自动生成*
