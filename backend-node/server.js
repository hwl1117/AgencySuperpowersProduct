/**
 * VideoBrain 后端服务 (Node.js版)
 * 无需Python和Docker，直接运行
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 8000;

// 中间件
app.use(cors());
app.use(express.json());

// 内存数据库
const videos = new Map();
const knowledgeBase = new Map();

// 初始化示例数据
function initSampleData() {
  const sampleVideos = [
    {
      id: '1',
      url: 'https://www.douyin.com/video/example1',
      platform: 'douyin',
      title: '人工智能入门教程',
      description: '本视频介绍了AI的基础知识',
      duration: 180,
      status: 'completed',
      progress: 100,
      transcript: '大家好，今天我们来聊聊人工智能。人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。',
      summary: '本视频介绍了人工智能的基础概念，包括AI的定义、发展历程和应用场景。适合初学者了解AI领域的全貌。',
      key_points: ['AI是计算机科学的分支', 'AI旨在理解智能本质', 'AI应用广泛'],
      tags: ['人工智能', 'AI', '教程', '入门'],
      category: '科技',
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString()
    },
    {
      id: '2',
      url: 'https://www.bilibili.com/video/example2',
      platform: 'bilibili',
      title: 'Python编程实战',
      description: 'Python编程从入门到精通',
      duration: 300,
      status: 'completed',
      progress: 100,
      transcript: '欢迎来到Python编程课程。Python是一种简单易学的编程语言，广泛应用于Web开发、数据分析、人工智能等领域。',
      summary: '本视频系统讲解了Python编程语言的核心概念和实战技巧，涵盖基础语法、常用库和实际项目案例。',
      key_points: ['Python简单易学', '应用领域广泛', '适合初学者'],
      tags: ['Python', '编程', '教程', '实战'],
      category: '教育',
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString()
    },
    {
      id: '3',
      url: 'https://www.youtube.com/watch?v=example3',
      platform: 'youtube',
      title: '高效学习方法论',
      description: '科学的学习方法让你事半功倍',
      duration: 240,
      status: 'completed',
      progress: 100,
      transcript: '今天我们讨论如何高效学习。首先，要制定明确的学习目标。其次，采用间隔重复的方法。最后，要注重实践和输出。',
      summary: '本视频分享了一套科学高效的学习方法，包括目标设定、间隔重复、主动回忆等技巧，帮助观众提升学习效率。',
      key_points: ['制定明确目标', '间隔重复法', '注重实践输出'],
      tags: ['学习方法', '效率', '自我提升'],
      category: '教育',
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString()
    }
  ];

  sampleVideos.forEach(v => {
    videos.set(v.id, v);
    knowledgeBase.set(v.id, {
      doc_id: `video_${v.id}`,
      content: v.summary + '\n\n' + v.key_points.join('\n'),
      metadata: {
        video_id: v.id,
        title: v.title,
        summary: v.summary,
        category: v.category,
        tags: JSON.stringify(v.tags),
        difficulty_level: 'intermediate',
        source_url: v.url,
        source_platform: v.platform,
        duration: v.duration
      }
    });
  });
}

initSampleData();

// ============ 健康检查 ============
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'VideoBrain API (Node.js)',
    timestamp: new Date().toISOString()
  });
});

// ============ 视频处理 ============
app.post('/api/videos/process', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ detail: '请提供视频链接' });
  }

  // 检测平台
  let platform = 'unknown';
  if (url.includes('douyin') || url.includes('iesdouyin')) platform = 'douyin';
  else if (url.includes('bilibili') || url.includes('b23.tv')) platform = 'bilibili';
  else if (url.includes('youtube') || url.includes('youtu.be')) platform = 'youtube';
  else if (url.includes('kuaishou') || url.includes('gifshow')) platform = 'kuaishou';
  else if (url.includes('tiktok')) platform = 'tiktok';
  else if (url.includes('xiaohongshu') || url.includes('xhslink')) platform = 'xiaohongshu';
  else {
    return res.status(400).json({ detail: '不支持的视频平台' });
  }

  const videoId = uuidv4().substring(0, 8);
  const newVideo = {
    id: videoId,
    url,
    platform,
    title: `视频-${videoId}`,
    description: '正在处理中...',
    duration: 0,
    status: 'pending',
    progress: 0,
    transcript: '',
    summary: '',
    key_points: [],
    tags: [],
    category: '',
    created_at: new Date().toISOString(),
    processed_at: null
  };

  videos.set(videoId, newVideo);

  // 模拟处理过程
  simulateProcessing(videoId);

  res.json({
    video_id: videoId,
    status: 'pending',
    message: '视频处理任务已创建'
  });
});

// 模拟视频处理
function simulateProcessing(videoId) {
  const stages = [
    { status: 'downloading', progress: 20, delay: 1000 },
    { status: 'processing', progress: 50, delay: 2000 },
    { status: 'processing', progress: 80, delay: 1500 },
    { status: 'completed', progress: 100, delay: 1000 }
  ];

  let currentStage = 0;

  function nextStage() {
    if (currentStage >= stages.length) {
      // 处理完成，生成模拟数据
      const video = videos.get(videoId);
      if (video) {
        video.status = 'completed';
        video.progress = 100;
        video.transcript = '这是视频的语音转文字内容。本视频介绍了相关主题的核心知识点，包括基础概念、实践技巧和案例分析。';
        video.summary = `本视频讲解了关于${video.platform}平台的内容，涵盖了基础知识和实用技巧。`;
        video.key_points = ['核心概念讲解', '实践技巧分享', '案例分析'];
        video.tags = ['教程', '知识', video.platform];
        video.category = '教育';
        video.processed_at = new Date().toISOString();

        // 添加到知识库
        knowledgeBase.set(videoId, {
          doc_id: `video_${videoId}`,
          content: video.summary,
          metadata: {
            video_id: videoId,
            title: video.title,
            summary: video.summary,
            category: video.category,
            tags: JSON.stringify(video.tags),
            difficulty_level: 'intermediate',
            source_url: video.url,
            source_platform: video.platform,
            duration: video.duration
          }
        });
      }
      return;
    }

    const stage = stages[currentStage];
    setTimeout(() => {
      const video = videos.get(videoId);
      if (video) {
        video.status = stage.status;
        video.progress = stage.progress;
      }
      currentStage++;
      nextStage();
    }, stage.delay);
  }

  nextStage();
}

// 获取视频信息
app.get('/api/videos/:id', (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) {
    return res.status(404).json({ detail: '视频不存在' });
  }
  res.json(video);
});

// 获取视频列表
app.get('/api/videos', (req, res) => {
  const { page = 1, page_size = 20, status, platform } = req.query;
  
  let videoList = Array.from(videos.values());
  
  if (status) {
    videoList = videoList.filter(v => v.status === status);
  }
  if (platform) {
    videoList = videoList.filter(v => v.platform === platform);
  }

  // 按创建时间倒序
  videoList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const start = (page - 1) * page_size;
  const end = start + parseInt(page_size);

  res.json({
    total: videoList.length,
    page: parseInt(page),
    page_size: parseInt(page_size),
    videos: videoList.slice(start, end)
  });
});

// 批量处理
app.post('/api/videos/batch', (req, res) => {
  const urls = req.body;
  
  if (!Array.isArray(urls)) {
    return res.status(400).json({ detail: '请提供URL数组' });
  }

  const results = urls.map(url => {
    let platform = 'unknown';
    if (url.includes('douyin')) platform = 'douyin';
    else if (url.includes('bilibili')) platform = 'bilibili';
    else if (url.includes('youtube')) platform = 'youtube';
    else if (url.includes('kuaishou')) platform = 'kuaishou';
    else if (url.includes('tiktok')) platform = 'tiktok';
    else if (url.includes('xiaohongshu')) platform = 'xiaohongshu';

    const videoId = uuidv4().substring(0, 8);
    videos.set(videoId, {
      id: videoId,
      url,
      platform,
      title: `视频-${videoId}`,
      status: 'pending',
      progress: 0,
      created_at: new Date().toISOString()
    });

    simulateProcessing(videoId);

    return { url, video_id: videoId, status: 'pending' };
  });

  res.json({ results, total: urls.length });
});

// ============ 知识库 ============

// 搜索知识库
app.post('/api/knowledge/search', (req, res) => {
  const { query, category, difficulty, limit = 10 } = req.body;

  let results = Array.from(knowledgeBase.values());

  // 简单的关键词搜索
  if (query) {
    const queryLower = query.toLowerCase();
    results = results.filter(item => {
      const title = (item.metadata.title || '').toLowerCase();
      const summary = (item.metadata.summary || '').toLowerCase();
      const content = (item.content || '').toLowerCase();
      const tags = (item.metadata.tags || '').toLowerCase();

      return title.includes(queryLower) ||
             summary.includes(queryLower) ||
             content.includes(queryLower) ||
             tags.includes(queryLower);
    });

    // 计算相似度（简单模拟）
    results = results.map(item => ({
      ...item,
      similarity: Math.random() * 0.3 + 0.7 // 0.7-1.0
    }));
  }

  // 分类筛选
  if (category) {
    results = results.filter(item => item.metadata.category === category);
  }

  // 限制数量
  results = results.slice(0, parseInt(limit));

  res.json({
    success: true,
    results,
    total: results.length
  });
});

// 获取分类列表 (必须在参数化路由之前)
app.get('/api/knowledge/categories/list', (req, res) => {
  const categories = new Set();
  knowledgeBase.forEach(item => {
    if (item.metadata.category) {
      categories.add(item.metadata.category);
    }
  });
  res.json({ categories: Array.from(categories) });
});

// 获取统计信息 (必须在参数化路由之前)
app.get('/api/knowledge/stats', (req, res) => {
  const categories = new Set();
  const platforms = {};

  knowledgeBase.forEach(item => {
    if (item.metadata.category) {
      categories.add(item.metadata.category);
    }
    const platform = item.metadata.source_platform || 'unknown';
    platforms[platform] = (platforms[platform] || 0) + 1;
  });

  res.json({
    total_entries: knowledgeBase.size,
    categories: Array.from(categories),
    category_count: categories.size,
    platform_distribution: platforms
  });
});

// 导出知识库 (必须在参数化路由之前)
app.get('/api/knowledge/export', (req, res) => {
  const { format = 'json' } = req.query;

  const data = Array.from(knowledgeBase.values());

  res.json({
    success: true,
    data,
    format,
    count: data.length
  });
});

// 获取知识条目 (参数化路由放在最后)
app.get('/api/knowledge/:videoId', (req, res) => {
  const entry = knowledgeBase.get(req.params.videoId);
  if (!entry) {
    return res.status(404).json({ detail: '知识条目不存在' });
  }
  res.json(entry);
});

// 启动服务
app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('  🧠 VideoBrain 后端服务已启动');
  console.log('========================================');
  console.log('');
  console.log(`  🌐 API地址: http://localhost:${PORT}`);
  console.log(`  📚 API文档: http://localhost:${PORT}/docs`);
  console.log(`  ❤️  健康检查: http://localhost:${PORT}/health`);
  console.log('');
  console.log('  支持平台: 抖音、B站、YouTube、快手、TikTok、小红书');
  console.log('');
});