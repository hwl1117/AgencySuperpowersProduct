# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

如果您发现安全漏洞，请**不要**通过公开的GitHub Issue报告。

### 报告方式

请通过以下方式报告安全漏洞：

1. **邮件**: security@videobrain.com
2. **GitHub Security Advisories**: 通过GitHub私密报告

### 报告内容

请包含以下信息：

- 漏洞描述
- 复现步骤
- 影响范围
- 潜在风险
- 建议的修复方案（如有）

### 响应时间

- **确认收到**: 24小时内
- **初步评估**: 72小时内
- **修复计划**: 1周内
- **安全发布**: 根据严重程度，1-4周内

### 安全更新

安全更新将通过以下方式发布：

- GitHub Security Advisories
- 邮件通知（如果您提供了联系方式）
- 版本更新日志

## 安全最佳实践

### 部署安全

1. **使用HTTPS**
   ```nginx
   server {
       listen 443 ssl;
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
   }
   ```

2. **配置防火墙**
   ```bash
   # 只开放必要端口
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **定期更新依赖**
   ```bash
   # Python
   pip install --upgrade -r requirements.txt
   
   # Node.js
   npm update
   ```

### API安全

1. **使用环境变量存储敏感信息**
   ```bash
   # 不要硬编码API Key
   export OPENAI_API_KEY=your_key_here
   ```

2. **配置CORS**
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://yourdomain.com"],  # 不要使用 *
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

3. **添加速率限制**
   ```python
   from slowapi import Limiter
   limiter = Limiter(key_func=get_remote_address)
   
   @app.post("/api/videos/process")
   @limiter.limit("10/minute")
   async def process_video(request: Request):
       pass
   ```

4. **输入验证**
   ```python
   from pydantic import BaseModel, validator
   
   class VideoURLRequest(BaseModel):
       url: str
       
       @validator('url')
       def validate_url(cls, v):
           if not v.startswith(('http://', 'https://')):
               raise ValueError('无效的URL')
           return v
   ```

### 数据安全

1. **数据库加密**
   ```python
   # 使用加密连接
   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
   ```

2. **备份策略**
   ```bash
   # 定期备份
   0 2 * * * /path/to/backup.sh
   ```

3. **访问控制**
   ```python
   # 实现JWT认证
   from fastapi.security import HTTPBearer
   security = HTTPBearer()
   ```

### 监控和日志

1. **日志记录**
   ```python
   import logging
   logging.basicConfig(
       level=logging.INFO,
       format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
       handlers=[
           logging.FileHandler('app.log'),
           logging.StreamHandler()
       ]
   )
   ```

2. **错误监控**
   ```python
   # 集成Sentry
   import sentry_sdk
   sentry_sdk.init(dsn="your-dsn")
   ```

3. **健康检查**
   ```bash
   # 定期检查服务状态
   curl -f http://localhost:8000/health || exit 1
   ```

## 安全相关依赖

定期检查并更新以下依赖：

### Python

```bash
pip install safety
safety check -r requirements.txt
```

### Node.js

```bash
npm audit
npm audit fix
```

## 安全事件响应

### 事件分类

- **P0 - 紧急**: 数据泄露、远程代码执行
- **P1 - 高危**: 认证绕过、权限提升
- **P2 - 中危**: XSS、CSRF
- **P3 - 低危**: 信息泄露、配置错误

### 响应流程

1. **确认**: 确认漏洞存在
2. **评估**: 评估影响范围
3. **修复**: 开发修复方案
4. **测试**: 测试修复方案
5. **发布**: 发布安全更新
6. **通知**: 通知受影响用户

## 安全审计

### 定期审计

- 每月进行依赖安全检查
- 每季度进行代码安全审计
- 每年进行渗透测试

### 审计工具

- **Python**: Bandit, Safety
- **Node.js**: npm audit, Snyk
- **Docker**: Trivy, Clair

## 联系方式

- 安全邮箱: security@videobrain.com
- PGP密钥: [链接到公钥]

## 致谢

感谢所有负责任地披露安全漏洞的研究人员。