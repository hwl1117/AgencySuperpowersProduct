---
date: 2026-06-11
tags: [安全, Node.js, Python, Electron, 命令注入, CORS]
source: VideoBrain 安全审计
priority: high
status: 已完成
---

# Node.js/Python Web 应用安全审计要点

> 从 VideoBrain 项目安全审计中提炼的安全知识

## 命令注入防护

### 问题
```javascript
// ❌ 危险：用户输入直接拼接到 shell 命令
const command = 'curl -L -o "' + outputPath + '" "' + url + '"';
exec(command, callback);
```

### 修复
```javascript
// ✅ 安全：使用 execFile + 参数数组
const args = ['-L', '-o', outputPath, url];
execFile('curl', args, callback);
```

### 原则
- **永远不要**用 `exec()` 拼接用户输入
- 使用 `execFile()` 或 `spawn()` + 参数数组
- 对文件路径做白名单验证

## CORS 配置

### 问题
```python
# ❌ 危险：允许所有来源
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True)
```

### 修复
```python
# ✅ 安全：限制为实际域名
app.add_middleware(CORSMiddleware, 
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True)
```

### 原则
- `allow_origins=["*"]` + `allow_credentials=True` 是安全漏洞
- 生产环境必须限制为实际域名
- 开发环境用 `localhost` 具体端口

## API Key 管理

### 问题
```javascript
// ❌ 危险：硬编码 API Key
const API_KEY = 'tp-sp2whw73argusk4o3k7tmer4q40tpbvnvvdg5p3yi9arvacu';
```

### 修复
```javascript
// ✅ 安全：环境变量
const API_KEY = process.env.MIMO_API_KEY;
if (!API_KEY) {
  console.error('MIMO_API_KEY not set');
}
```

### 原则
- **永远不要**在源码中硬编码密钥
- 使用环境变量或密钥管理服务
- `.env` 文件加入 `.gitignore`
- 泄露的密钥立即轮换

## Python hash() 不确定性

### 问题
```python
# ❌ 危险：hash() 在不同进程间结果不同
video_id = str(hash(url))[:16]
```

### 修复
```python
# ✅ 安全：使用确定性 hash
import hashlib
video_id = hashlib.md5(url.encode()).hexdigest()[:16]
```

### 原则
- Python 的 `hash()` 受 `PYTHONHASHSEED` 影响
- 需要持久化或跨进程一致的 hash，用 `hashlib`
- `hash()` 只用于内存中的哈希表

## FastAPI 异步最佳实践

### 问题
```python
# ❌ 阻塞事件循环
@app.post("/api/process")
async def process(request):
    result = blocking_io_call()  # 阻塞！
    return result
```

### 修复
```python
# ✅ 正确：用 asyncio.to_thread 包装
@app.post("/api/process")
async def process(request):
    result = await asyncio.to_thread(blocking_io_call)
    return result
```

### 原则
- `async def` 路由中不要调用同步阻塞操作
- 用 `asyncio.to_thread()` 包装 I/O 密集操作
- 或者直接用 `def` 路由（FastAPI 会自动放线程池）

## Electron 模块解析陷阱

### 问题
`require('electron')` 在 Electron 进程中可能返回 npm 包的 `index.js`（路径字符串），而不是内置 API。

### 原因
Node.js 模块解析优先查找 `node_modules/`，覆盖 Electron 内置模块。

### 解决
- 确保 npm 包版本与二进制版本完全匹配
- 或使用 Chrome app 模式替代 Electron

---
*由 Claude Code 于 2026-06-11 自动生成*
