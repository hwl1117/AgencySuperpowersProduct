# 贡献指南

感谢您对 VideoBrain 项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 1. 报告问题

如果您发现了bug或有功能建议，请通过GitHub Issues提交：

1. 访问 [Issues页面](https://github.com/yourusername/videobrain/issues)
2. 点击 "New Issue"
3. 选择问题类型（Bug报告/功能建议）
4. 填写详细信息

**Bug报告模板**：

```markdown
## 描述
简要描述问题

## 复现步骤
1. 执行 '...'
2. 点击 '...'
3. 看到错误 '...'

## 期望行为
描述您期望的行为

## 实际行为
描述实际发生的行为

## 环境信息
- 操作系统: [例如 Windows 10, macOS 12.0]
- Python版本: [例如 3.11.0]
- Node.js版本: [例如 18.0.0]
- 浏览器: [例如 Chrome 100]

## 附加信息
添加任何其他相关信息、截图或日志
```

### 2. 提交代码

#### Fork项目

1. 访问 [VideoBrain仓库](https://github.com/yourusername/videobrain)
2. 点击右上角 "Fork" 按钮

#### 克隆Fork

```bash
git clone https://github.com/your-username/videobrain.git
cd videobrain
```

#### 创建分支

```bash
# 创建并切换到新分支
git checkout -b feature/your-feature-name

# 或修复bug
git checkout -b fix/your-bug-fix
```

#### 提交更改

```bash
# 添加更改
git add .

# 提交更改
git commit -m "feat: 添加新功能描述"

# 推送到远程
git push origin feature/your-feature-name
```

#### 创建Pull Request

1. 访问您的Fork页面
2. 点击 "Compare & pull request"
3. 填写PR描述
4. 等待审核

### 3. 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**：
```
feat(video): 添加批量处理功能

- 支持同时处理多个视频链接
- 添加处理进度显示
- 优化错误处理

Closes #123
```

## 开发环境

### 1. 环境准备

```bash
# 克隆项目
git clone https://github.com/yourusername/videobrain.git
cd videobrain

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装后端依赖
cd backend
pip install -r requirements.txt

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 代码风格

#### Python

- 遵循 [PEP 8](https://www.python.org/dev/peps/pep-0008/) 规范
- 使用类型注解
- 编写文档字符串

```python
def process_video(url: str, language: str = "zh") -> dict:
    """
    处理视频链接
    
    Args:
        url: 视频链接
        language: 语言代码，默认"zh"
        
    Returns:
        dict: 处理结果
        
    Raises:
        ValueError: 不支持的视频平台
    """
    # 实现代码
    pass
```

#### TypeScript/JavaScript

- 使用ESLint配置
- 使用Prettier格式化
- 编写JSDoc注释

```typescript
/**
 * 处理视频链接
 * @param url - 视频链接
 * @param language - 语言代码
 * @returns 处理结果
 */
async function processVideo(
  url: string, 
  language: string = "zh"
): Promise<VideoResult> {
  // 实现代码
}
```

### 3. 测试

#### 运行测试

```bash
# 后端测试
cd backend
pytest ../tests/ -v

# 前端测试
cd frontend
npm test
```

#### 编写测试

```python
# tests/test_example.py
import pytest
from services.video_downloader import VideoDownloader

class TestVideoDownloader:
    def setup_method(self):
        self.downloader = VideoDownloader()
    
    def test_detect_platform(self):
        url = "https://www.douyin.com/video/123"
        platform = self.downloader.detect_platform(url)
        assert platform == "douyin"
    
    def test_unsupported_platform(self):
        url = "https://example.com/video/123"
        platform = self.downloader.detect_platform(url)
        assert platform is None
```

### 4. 文档

- 更新README.md
- 更新API文档
- 添加代码注释
- 更新用户指南

## 代码审查

### 审查清单

- [ ] 代码符合风格规范
- [ ] 添加了必要的测试
- [ ] 测试全部通过
- [ ] 文档已更新
- [ ] 没有引入新的警告
- [ ] 提交信息符合规范

### 审查流程

1. 提交PR后，等待CI检查通过
2. 至少需要1位维护者审核
3. 审核通过后合并到主分支

## 社区

### 沟通渠道

- GitHub Issues: 问题讨论
- GitHub Discussions: 一般讨论
- Email: dev@videobrain.com

### 行为准则

我们致力于为每个人提供友好、安全和欢迎的环境。请遵循以下准则：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

## 许可证

贡献即表示您同意您的贡献将在 [MIT许可证](LICENSE) 下发布。

## 致谢

感谢所有贡献者！

<!-- 贡献者列表将自动更新 -->
