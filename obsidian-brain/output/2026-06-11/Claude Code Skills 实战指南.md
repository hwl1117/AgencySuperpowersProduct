---
date: 2026-06-11
tags: [Claude-Code, Skills, 工作流, 自动化]
source: VideoBrain 项目优化实践
priority: medium
status: 已完成
---

# Claude Code Skills 实战指南

> 从 VideoBrain 项目优化中总结的 Skills 使用经验

## 已验证的 Skills（6 个）

### 1. init — 生成 CLAUDE.md
**用途：** 分析代码库，生成项目指导文档
**触发：** 新项目接手、CLAUDE.md 缺失
**产出：** 项目架构、常用命令、关键 gotchas

### 2. code-review — 代码审查
**用途：** 多角度审查代码，发现 bug 和质量问题
**触发：** PR 审查、代码优化前
**角度：** 逐行扫描、移除行为审计、跨文件追踪、语言陷阱、包装器正确性、复用、简化、效率、层级

### 3. security-review — 安全审查
**用途：** 专注安全漏洞检测
**触发：** 上线前、安全审计
**检查：** 注入、认证、加密、数据泄露、XSS

### 4. simplify — 代码简化
**用途：** 发现死代码、重复、效率问题
**触发：** 重构前、代码清理
**角度：** 复用、简化、效率、层级

### 5. verify — 验证变更
**用途：** 运行应用验证代码变更是否生效
**触发：** 修复后验证、功能测试
**方式：** 实际运行应用，观察行为

### 6. neat-freak — 文档同步
**用途：** 会话结束时同步文档和记忆
**触发：** 开发里程碑、阶段完成
**检查：** CLAUDE.md、docs/、记忆系统

## 其他可用 Skills（9 个）

| Skill | 用途 |
|-------|------|
| `gstack` | 无头浏览器 QA 测试 |
| `deep-research` | 多源深度研究 |
| `fewer-permission-prompts` | 减少权限弹窗 |
| `update-config` | 配置 settings.json |
| `keybindings-help` | 自定义快捷键 |
| `loop` | 定时循环执行 |
| `claude-api` | Claude API 参考 |
| `run` | 启动应用 |
| `review` | 审查 PR |

## 执行顺序建议

```
1. init          → 建立项目文档基础
2. code-review   → 发现问题
3. security-review → 安全漏洞
4. simplify      → 代码优化机会
5. [修复代码]
6. verify        → 验证修复
7. neat-freak    → 同步文档
```

## 注意事项

- `code-review` 和 `security-review` 有重叠，但角度不同
- `verify` 需要应用能实际运行
- `neat-freak` 应在会话结束时调用
- Python 环境问题可能导致 `verify` 失败

---
*由 Claude Code 于 2026-06-11 自动生成*
