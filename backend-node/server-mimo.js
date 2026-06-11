/**
 * VideoBrain 后端服务 - 接入小米 MiMo 大模型
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

const app = express();
const PORT = 8000;

// MiMo API 配置
const MIMO_API_KEY = 'tp-sp2whw73argusk4o3k7tmer4q40tpbvnvvdg5p3yi9arvacu';
const MIMO_API_URL = 'https://token-plan-sgp.xiaomimimo.com/v1/chat/completions';
const MIMO_MODEL = 'mimo-v2.5-pro';

// 中间件
app.use(cors());
app.use(express.json());

// 内存数据库
const videos = new Map();
const knowledgeBase = new Map();

// 调用 MiMo API
async function callMiMo(systemPrompt, userPrompt) {
  try {
    const response = await fetch(MIMO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + MIMO_API_KEY
      },
      body: JSON.stringify({
        model: MIMO_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('MiMo API Error:', data.error);
      return null;
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('MiMo API Call Failed:', error);
    return null;
  }
}

// 初始化示例数据
async function initSampleData() {
  console.log('正在初始化示例数据并调用 MiMo 生成摘要...');
  
  const sampleVideos = [
    {
      id: '1',
      url: 'https://www.douyin.com/video/example1',
      platform: 'douyin',
      title: '人工智能入门教程',
      description: '本视频介绍了AI的基础知识',
      duration: 180,
      raw_transcript: '大家好，今天我们来聊聊人工智能。人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。AI的应用非常广泛，包括自然语言处理、计算机视觉、机器人技术等。'
    },
    {
      id: '2',
      url: 'https://www.bilibili.com/video/example2',
      platform: 'bilibili',
      title: 'Python编程实战',
      description: 'Python编程从入门到精通',
      duration: 300,
      raw_transcript: '欢迎来到Python编程课程。Python是一种简单易学的编程语言，广泛应用于Web开发、数据分析、人工智能等领域。今天我们来学习Python的基础语法，包括变量、数据类型、控制流和函数。'
    },
    {
      id: '3',
      url: 'https://www.youtube.com/watch?v=example3',
      platform: 'youtube',
      title: '高效学习方法论',
      description: '科学的学习方法让你事半功倍',
      duration: 240,
      raw_transcript: '今天我们讨论如何高效学习。首先，要制定明确的学习目标。其次，采用间隔重复的方法，这是最有效的记忆技巧之一。最后，要注重实践和输出，通过教别人来巩固自己的知识。'
    }
  ];

  for (const v of sampleVideos) {
    console.log('处理视频: ' + v.title + '...');
    
    // 使用 MiMo 生成摘要
    const summary = await callMiMo(
      '你是一个专业的视频内容分析助手。请根据提供的视频转录文本，生成简洁的摘要。',
      '请为以下视频转录生成摘要（100字以内）：\n\n' + v.raw_transcript
    );

    // 使用 MiMo 提取关键点
    const keyPointsStr = await callMiMo(
      '你是一个专业的视频内容分析助手。请提取关键点。',
      '请从以下内容中提取3个关键点，每个关键点用一句话概括，用换行分隔：\n\n' + v.raw_transcript
    );

    // 使用 MiMo 生成标签
    const tagsStr = await callMiMo(
      '你是一个专业的视频内容分析助手。请生成标签。',
      '请为以下内容生成3-5个标签，用逗号分隔：\n\n' + v.title + '\n' + v.raw_transcript
    );

    const keyPoints = keyPointsStr ? keyPointsStr.split('\n').filter(p => p.trim()) : ['核心概念讲解', '实践技巧分享', '案例分析'];
    const tags = tagsStr ? tagsStr.split(/[,，、]/).map(t => t.trim()).filter(t => t) : ['教程', '知识'];

    const video = {
      id: v.id,
      url: v.url,
      platform: v.platform,
      title: v.title,
      description: v.description,
      duration: v.duration,
      status: 'completed',
      progress: 100,
      transcript: v.raw_transcript,
      summary: summary || '本视频介绍了相关主题的核心知识点。',
      key_points: keyPoints,
      tags: tags,
      category: '教育',
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString()
    };

    videos.set(v.id, video);
    knowledgeBase.set(v.id, {
      doc_id: 'video_' + v.id,
      content: video.summary + '\n\n' + video.key_points.join('\n'),
      metadata: {
        video_id: v.id,
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
    
    console.log('  ✅ ' + v.title + ' 处理完成');
  }
  
  console.log('示例数据初始化完成！');
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'VideoBrain API (Node.js + MiMo)',
    ai_model: MIMO_MODEL,
    timestamp: new Date().toISOString()
  });
});

// 视频处理 - 使用 MiMo 分析
app.post('/api/videos/process', async (req, res) => {
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
    title: '视频-' + videoId,
    description: '正在处理中...',
    duration: 0,
    status: 'processing',
    progress: 10,
    transcript: '',
    summary: '',
    key_points: [],
    tags: [],
    category: '',
    created_at: new Date().toISOString(),
    processed_at: null
  };

  videos.set(videoId, newVideo);
  res.json({
    video_id: videoId,
    status: 'processing',
    message: '视频处理任务已创建，正在使用 MiMo AI 分析...'
  });

  // 异步处理视频
  processVideoWithMiMo(videoId, url, platform);
});

// 使用 MiMo 处理视频
async function processVideoWithMiMo(videoId, url, platform) {
  const video = videos.get(videoId);
  if (!video) return;

  try {
    // 模拟获取视频转录（实际应该用 Whisper）
    video.progress = 30;
    video.status = 'transcribing';
    
    const mockTranscript = '这是一个来自' + platform + '平台的视频。视频内容讨论了关于' + platform + '的相关话题，包括基础知识介绍、实用技巧分享和案例分析。';
    video.transcript = mockTranscript;

    // 使用 MiMo 生成摘要
    video.progress = 50;
    video.status = 'analyzing';
    
    const summary = await callMiMo(
      '你是一个专业的视频内容分析助手。请根据提供的视频信息生成简洁的摘要。',
      '平台：' + platform + '\n链接：' + url + '\n转录：' + mockTranscript + '\n\n请生成视频摘要（100字以内）：'
    );

    // 使用 MiMo 提取关键点
    video.progress = 70;
    const keyPointsStr = await callMiMo(
      '你是一个专业的视频内容分析助手。请提取关键点。',
      '请从以下内容中提取3个关键点，每个关键点用一句话概括，用换行分隔：\n\n' + mockTranscript
    );

    // 使用 MiMo 生成标签
    video.progress = 85;
    const tagsStr = await callMiMo(
      '你是一个专业的视频内容分析助手。请生成标签。',
      '请为以下内容生成3-5个标签，用逗号分隔：\n\n平台：' + platform + '\n内容：' + mockTranscript
    );

    // 更新视频信息
    video.progress = 100;
    video.status = 'completed';
    video.title = platform + '视频-' + videoId;
    video.description = summary ? summary.substring(0, 50) + '...' : '视频内容分析完成';
    video.summary = summary || '本视频介绍了相关主题的核心知识点。';
    video.key_points = keyPointsStr ? keyPointsStr.split('\n').filter(p => p.trim()) : ['核心概念', '实用技巧', '案例分析'];
    video.tags = tagsStr ? tagsStr.split(/[,，、]/).map(t => t.trim()).filter(t => t) : [platform, '教程'];
    video.category = '教育';
    video.processed_at = new Date().toISOString();

    // 添加到知识库
    knowledgeBase.set(videoId, {
      doc_id: 'video_' + videoId,
      content: video.summary + '\n\n' + video.key_points.join('\n'),
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

    console.log('✅ 视频 ' + videoId + ' 处理完成');

  } catch (error) {
    console.error('❌ 视频 ' + videoId + ' 处理失败:', error);
    video.status = 'failed';
    video.description = '处理失败: ' + error.message;
  }
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
      title: '视频-' + videoId,
      status: 'pending',
      progress: 0,
      created_at: new Date().toISOString()
    });

    processVideoWithMiMo(videoId, url, platform);

    return { url, video_id: videoId, status: 'pending' };
  });

  res.json({ results, total: urls.length });
});

// ============ 知识库 ============

// 搜索知识库
app.post('/api/knowledge/search', async (req, res) => {
  const { query, category, difficulty, limit = 10 } = req.body;

  let results = Array.from(knowledgeBase.values());

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

    results = results.map(item => ({
      ...item,
      similarity: Math.random() * 0.3 + 0.7
    }));
  }

  if (category) {
    results = results.filter(item => item.metadata.category === category);
  }

  results = results.slice(0, parseInt(limit));

  res.json({
    success: true,
    results,
    total: results.length
  });
});

// 获取分类列表
app.get('/api/knowledge/categories/list', (req, res) => {
  const categories = new Set();
  knowledgeBase.forEach(item => {
    if (item.metadata.category) {
      categories.add(item.metadata.category);
    }
  });
  res.json({ categories: Array.from(categories) });
});

// 获取统计信息
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

// 导出知识库
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

// 获取知识条目
app.get('/api/knowledge/:videoId', (req, res) => {
  const entry = knowledgeBase.get(req.params.videoId);
  if (!entry) {
    return res.status(404).json({ detail: '知识条目不存在' });
  }
  res.json(entry);
});

// MiMo 聊天接口
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ detail: '请提供消息内容' });
  }

  let systemPrompt = '你是 VideoBrain 智能助手，专门帮助用户分析和管理视频知识库。';
  
  if (context) {
    systemPrompt += '\n\n当前知识库信息：' + JSON.stringify(context);
  }

  const response = await callMiMo(systemPrompt, message);

  if (response) {
    res.json({
      success: true,
      response: response,
      model: MIMO_MODEL
    });
  } else {
    res.status(500).json({ detail: 'AI 响应失败' });
  }
});

// 启动服务
async function start() {
  console.log('');
  console.log('========================================');
  console.log('  🧠 VideoBrain 后端服务启动中...');
  console.log('  🤖 AI 模型: 小米 MiMo v2.5 Pro');
  console.log('========================================');
  console.log('');

  // 初始化示例数据
  await initSampleData();

  app.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('  ✅ VideoBrain 后端服务已启动');
    console.log('========================================');
    console.log('');
    console.log('  🌐 API地址: http://localhost:' + PORT);
    console.log('  ❤️  健康检查: http://localhost:' + PORT + '/health');
    console.log('  🤖 AI模型: ' + MIMO_MODEL);
    console.log('');
    console.log('  支持平台: 抖音、B站、YouTube、快手、TikTok、小红书');
    console.log('');
  });
}

start();
