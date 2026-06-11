# VideoBrain 常见问题解答 (FAQ)

## 通用问题

### Q: VideoBrain 是什么？

**A:** VideoBrain 是一款结合 Agency-Agents 和 Superpowers 的智能知识库系统，能够通过短视频平台链接，一键识别视频内容并概括优化成知识库。

### Q: 支持哪些视频平台？

**A:** 目前支持以下平台：
- 抖音 (douyin.com)
- B站 (bilibili.com)
- YouTube (youtube.com)
- 快手 (kuaishou.com)
- TikTok (tiktok.com)
- 小红书 (xiaohongshu.com)

### Q: 需要付费吗？

**A:** VideoBrain 本身是开源免费的，但需要 OpenAI API Key 来使用 AI 功能，OpenAI API 按使用量收费。

---

## 安装部署

### Q: 系统要求是什么？

**A:** 
- Docker 20.10+ 和 Docker Compose 2.0+
- 或 Python 3.11+ 和 Node.js 18+
- FFmpeg（用于音视频处理）
- 至少 4GB 内存

### Q: 如何安装？

**A:** 
```bash
# 1. 克隆项目
git clone https://github.com/yourusername/videobrain.git
cd videobrain

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 OpenAI API Key

# 3. 启动服务
docker-compose up -d
```

### Q: 如何获取 OpenAI API Key？

**A:** 
1. 访问 https://platform.openai.com/
2. 注册并登录
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制到 `.env` 文件中

---

## 使用问题

### Q: 如何处理视频？

**A:** 
1. 打开 http://localhost:3000
2. 粘贴视频链接
3. 点击"开始处理"
4. 等待处理完成（2-5分钟）

### Q: 处理一个视频需要多长时间？

**A:** 通常需要2-5分钟，取决于：
- 视频时长（越长耗时越久）
- 网络速度（下载视频）
- API响应速度

### Q: 视频有时长限制吗？

**A:** 建议10分钟以内的短视频，过长的视频处理时间会相应增加，且可能超时。

### Q: 如何搜索知识库？

**A:** 
1. 切换到"搜索知识"标签
2. 输入关键词
3. 可选：设置分类和难度筛选
4. 点击"搜索"

### Q: 搜索结果不准确怎么办？

**A:** 尝试以下方法：
1. 使用更具体的关键词
2. 尝试同义词或相关词汇
3. 使用筛选条件缩小范围
4. 确保已有足够多的已处理视频

---

## 技术问题

### Q: 如何查看日志？

**A:** 
```bash
# Docker 日志
docker-compose logs -f

# 或使用 Make
make logs
```

### Q: 如何更新到最新版本？

**A:** 
```bash
git pull
docker-compose build --no-cache
docker-compose up -d
```

### Q: 如何备份数据？

**A:** 
```bash
# 备份数据库
cp videobrain.db videobrain.db.backup

# 备份知识库
cp -r knowledge_base_db knowledge_base_db.backup
```

### Q: 如何重置系统？

**A:** 
```bash
# 停止服务
docker-compose down

# 删除数据
rm -f videobrain.db
rm -rf knowledge_base_db
rm -rf downloads
rm -rf audio

# 重新启动
docker-compose up -d
```

---

## 错误处理

### Q: 出现 "API_KEY_ERROR" 怎么办？

**A:** 
1. 检查 `.env` 文件中的 API Key
2. 确保 API Key 以 `sk-` 开头
3. 检查 API Key 是否有效
4. 检查账户余额

### Q: 出现 "VIDEO_DOWNLOAD_ERROR" 怎么办？

**A:** 
1. 检查视频链接是否有效
2. 确认平台是否支持
3. 检查网络连接
4. 尝试其他视频

### Q: 出现 "处理超时" 怎么办？

**A:** 
1. 尝试处理更短的视频
2. 检查网络连接
3. 检查服务器资源
4. 查看日志获取详细信息

---

## 性能优化

### Q: 如何提高处理速度？

**A:** 
1. 使用更快的网络
2. 选择更短的视频
3. 增加服务器资源
4. 使用更高质量的 API Key

### Q: 如何减少 API 费用？

**A:** 
1. 使用 GPT-3.5 替代 GPT-4（修改配置）
2. 减少处理频率
3. 批量处理视频
4. 使用本地模型（需要额外配置）

---

## 贡献和社区

### Q: 如何贡献代码？

**A:** 
1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

详见 [贡献指南](CONTRIBUTING.md)

### Q: 如何报告问题？

**A:** 
1. 访问 GitHub Issues
2. 使用 Bug Report 模板
3. 提供详细信息和日志

### Q: 如何获取帮助？

**A:** 
- GitHub Issues: 问题反馈
- GitHub Discussions: 社区讨论
- Email: support@videobrain.com