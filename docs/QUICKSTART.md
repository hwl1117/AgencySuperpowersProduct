# VideoBrain 快速开始指南

## 5分钟快速上手

### 1. 环境准备

确保已安装：
- Docker 和 Docker Compose
- Git

### 2. 克隆项目

```bash
git clone https://github.com/yourusername/videobrain.git
cd videobrain
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入 OpenAI API Key：

```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 4. 启动服务

```bash
# 使用 Docker Compose
docker-compose up -d

# 或使用 Make
make start
```

### 5. 访问应用

- 前端界面: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

## 使用示例

### 处理视频

1. 打开 http://localhost:3000
2. 在输入框粘贴视频链接，例如：
   - 抖音: `https://www.douyin.com/video/xxx`
   - B站: `https://www.bilibili.com/video/BVxxx`
   - YouTube: `https://www.youtube.com/watch?v=xxx`
3. 点击"开始处理"
4. 等待2-5分钟处理完成

### 搜索知识

1. 切换到"搜索知识"标签
2. 输入关键词，如"人工智能"
3. 点击"搜索"
4. 查看搜索结果

### 浏览知识库

1. 切换到"知识库"标签
2. 按分类筛选
3. 查看知识详情

## 常见问题

### Q: 处理失败怎么办？

检查：
1. OpenAI API Key 是否正确
2. 视频链接是否有效
3. 网络连接是否正常

### Q: 如何查看日志？

```bash
# Docker 日志
docker-compose logs -f

# 或
make logs
```

### Q: 如何停止服务？

```bash
docker-compose down

# 或
make stop
```

## 下一步

- 阅读 [完整文档](README.md)
- 查看 [API文档](API.md)
- 了解 [部署指南](DEPLOYMENT.md)