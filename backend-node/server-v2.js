/**
 * VideoBrain v2.6 - 批量处理修复/平台扩展/类型安全/UX优化
 * 改进: 批量URL解析、微信视频号完整支持、轮询内存泄漏修复、搜索过滤器修复
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

let puppeteer = null;
try {
  puppeteer = require('puppeteer-core');
  console.log('✅ puppeteer-core 已加载');
} catch(e) {
  console.log('⚠️ puppeteer-core 未安装，抖音页面抓取不可用');
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
let browserInstance = null;

const app = express();
const PORT = 8000;

// MiMo API 配置
const MIMO_API_KEY = 'tp-sp2whw73argusk4o3k7tmer4q40tpbvnvvdg5p3yi9arvacu';
const MIMO_API_URL = 'https://token-plan-sgp.xiaomimimo.com/v1/chat/completions';
const MIMO_MODEL = 'mimo-v2.5-pro';

const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
const AUDIO_DIR = path.join(__dirname, 'audio');
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (!req.url.includes('/health')) {
      console.log(`  ${req.method} ${req.url} → ${res.statusCode} (${ms}ms)`);
    }
  });
  next();
});

const videos = new Map();
const knowledgeBase = new Map();
const customCategories = new Set(); // 独立存储用户创建的分类

async function callMiMo(systemPrompt, userPrompt, maxTokens = 4096) {
  try {
    const response = await fetch(MIMO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + MIMO_API_KEY },
      body: JSON.stringify({ model: MIMO_MODEL, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: maxTokens, temperature: 0.2 })
    });
    const data = await response.json();
    if (data.error) { console.error('MiMo API Error:', JSON.stringify(data.error)); return null; }
    return data.choices[0].message.content;
  } catch (error) { console.error('MiMo API Call Failed:', error.message); return null; }
}

function execCommand(command, timeout = 300000) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 50, timeout }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message));
      else resolve(stdout);
    });
  });
}

// ============ URL 提取和解析 ============
// 从分享文本中提取实际 URL（如 "3.38 复制打开抖音... https://v.douyin.com/xxx/ ..."）
function extractUrl(text) {
  if (!text) return text;
  // 如果已经是纯 URL，直接返回
  if (text.trim().match(/^https?:\/\//i)) return text.trim();
  // 从文本中提取 URL
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    console.log('📎 从分享文本中提取到 URL: ' + urlMatch[0]);
    return urlMatch[0].replace(/[.,;!?]+$/, ''); // 去除末尾标点
  }
  return text.trim();
}

// 解析短链接（v.douyin.com, b23.tv 等）到完整 URL
async function resolveShortUrl(url) {
  try {
    // 检查是否是短链接
    const shortDomains = ['v.douyin.com', 'b23.tv', 'vt.tiktok.com', 'vm.tiktok.com', 'xhslink.com', 'wxaurl.cn', 'sourl.cn'];
    const isShort = shortDomains.some(d => url.includes(d));
    if (!isShort) return url;

    console.log('🔗 解析短链接: ' + url);
    const response = await fetch(url, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
      timeout: 10000
    });
    const location = response.headers.get('location');
    if (location) {
      console.log('🔗 短链接解析结果: ' + location.substring(0, 100));
      return location;
    }
    return url;
  } catch (error) {
    console.error('⚠️ 短链接解析失败:', error.message);
    return url;
  }
}

function detectPlatform(url) {
  if (url.includes('douyin') || url.includes('iesdouyin') || url.includes('v.douyin')) return 'douyin';
  if (url.includes('bilibili') || url.includes('b23.tv')) return 'bilibili';
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('kuaishou') || url.includes('gifshow')) return 'kuaishou';
  if (url.includes('tiktok')) return 'tiktok';
  if (url.includes('xiaohongshu') || url.includes('xhslink')) return 'xiaohongshu';
  if (url.includes('channels.weixin.qq.com') || url.includes('weixin.qq.com') || url.includes('wxaurl.cn') || url.includes('sourl.cn')) return 'weixin_video';
  return 'unknown';
}

// ============ 抖音 Puppeteer 页面抓取 ============
async function getBrowser() {
  if (browserInstance && browserInstance.isConnected()) return browserInstance;
  if (!puppeteer) throw new Error('puppeteer-core 未安装');
  browserInstance = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  browserInstance.on('disconnected', () => { browserInstance = null; });
  return browserInstance;
}

async function scrapeDouyinPage(url) {
  console.log('🕷️ 使用 Puppeteer 抓取抖音页面（含视频流拦截）...');
  let page = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 拦截 aweme/detail API 响应 和 视频流 URL
    let apiVideoData = null;
    const videoStreamUrls = [];
    page.on('response', async (response) => {
      const respUrl = response.url();
      // 拦截 aweme/detail API
      if (respUrl.includes('aweme/detail') && !apiVideoData) {
        try {
          const json = await response.json();
          if (json.aweme_detail) apiVideoData = json.aweme_detail;
        } catch(e) {}
      }
      // 拦截视频流 URL（抖音CDN: douyinvod.com, bytevcloudcdn, v26-*, v3-web-* 等）
      const contentType = response.headers()['content-type'] || '';
      if (
        contentType.startsWith('video/') ||
        respUrl.includes('douyinvod.com') ||
        respUrl.includes('bytevcloudcdn') ||
        respUrl.includes('v26-') ||
        respUrl.includes('v3-web') ||
        (respUrl.includes('.mp4') && respUrl.length > 100)
      ) {
        if (!videoStreamUrls.includes(respUrl) && respUrl.length > 50) {
          videoStreamUrls.push(respUrl);
          console.log('🎬 捕获视频流URL: ' + respUrl.substring(0, 120) + '...');
        }
      }
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    // 等待更久让视频开始播放（触发流请求）
    await new Promise(r => setTimeout(r, 8000));

    // 等待视频描述出现
    try {
      await page.waitForSelector('[data-e2e="video-desc"]', { timeout: 8000 });
    } catch(e) {
      console.log('⚠️ video-desc 选择器超时，尝试继续...');
    }

    const result = await page.evaluate(() => {
      const data = {};

      // 提取描述
      const descEl = document.querySelector('[data-e2e="video-desc"]');
      data.description = descEl ? descEl.innerText.trim() : '';

      // 提取作者
      const authorEl = document.querySelector('[data-e2e="feed-video-nickname"]');
      data.author = authorEl ? authorEl.innerText.replace('@', '').trim() : '';

      // 提取统计数据
      const diggEl = document.querySelector('[data-e2e="video-player-digg"]');
      data.likes = diggEl ? diggEl.innerText.trim() : '';

      const commentEl = document.querySelector('[data-e2e="feed-comment-icon"]');
      data.comments = commentEl ? commentEl.innerText.trim() : '';

      const collectEl = document.querySelector('[data-e2e="video-player-collect"]');
      data.collects = collectEl ? collectEl.innerText.trim() : '';

      const shareEl = document.querySelector('[data-e2e="video-player-share"]');
      data.shares = shareEl ? shareEl.innerText.trim() : '';

      // 提取发布时间
      const infoEl = document.querySelector('[data-e2e="video-info"]');
      if (infoEl) {
        const infoText = infoEl.innerText;
        const dateMatch = infoText.match(/(\d+月\d+日|\d+天前|\d+小时前|\d+分钟前|昨天|前天)/);
        data.publishDate = dateMatch ? dateMatch[1] : '';
      }

      // 提取 hashtags
      const hashtagEls = document.querySelectorAll('[data-e2e="video-desc"] a');
      data.hashtags = Array.from(hashtagEls)
        .map(el => el.innerText.replace('#', '').trim())
        .filter(t => t && !t.includes('@'));

      // 提取视频时长和视频源URL
      const videoEl = document.querySelector('video');
      if (videoEl) {
        if (videoEl.duration && isFinite(videoEl.duration)) {
          data.duration = Math.round(videoEl.duration);
        }
        // 获取 video 元素的 src
        if (videoEl.src) {
          data.videoSrc = videoEl.src;
        }
        // 获取 source 元素的 src
        const sourceEl = videoEl.querySelector('source');
        if (sourceEl && sourceEl.src) {
          data.videoSourceSrc = sourceEl.src;
        }
      }

      // 提取评论区内容 — 多种选择器尝试
      data.comments_text = [];
      const seenComments = new Set();
      // 方法1: data-e2e 选择器
      const commentItems = document.querySelectorAll('[data-e2e="comment-list"] [class*="comment"]');
      commentItems.forEach(el => {
        const text = el.innerText ? el.innerText.trim() : '';
        // 只取有意义的评论文本（长度 > 4，不重复，不是纯数字/时间）
        if (text.length > 4 && text.length < 300 && !seenComments.has(text) && !text.match(/^\d+[\.\-·]/) && !text.match(/^\d+[周天小时分]前/)) {
          seenComments.add(text);
          data.comments_text.push(text.substring(0, 150));
        }
      });
      // 方法2: 通用评论选择器
      if (data.comments_text.length < 3) {
        const allComments = document.querySelectorAll('[class*="CommentItem"], [class*="comment-item"], [class*="commentItem"]');
        allComments.forEach(el => {
          const text = el.innerText ? el.innerText.trim() : '';
          if (text.length > 4 && text.length < 300 && !seenComments.has(text)) {
            seenComments.add(text);
            data.comments_text.push(text.substring(0, 150));
          }
        });
      }
      // 限制最多15条评论
      data.comments_text = data.comments_text.slice(0, 15);

      // 获取有价值的页面文本（过滤掉导航和UI噪音）
      const bodyText = document.body.innerText;
      data.bodyTextLength = bodyText.length;
      if (bodyText.length > 100) {
        // 分行过滤：去掉太短的行和常见UI元素
        const noise = ['开启读屏', '读屏标签', '精选', '推荐', '搜索', '关注', '朋友', '我的', '直播', '放映厅', '短剧', '小游戏', '壁纸', '通知', '私信', '投稿', '登录', '更多', '分享', '回复', '举报', '点击加载', '请先登录', '大家都在搜', '个人观点', '因浏览器限制', '打开声音', '倍速', '智能', '清屏', '连播'];
        const lines = bodyText.split('\n').filter(line => {
          const t = line.trim();
          if (t.length < 3) return false;
          if (noise.some(n => t.includes(n) && t.length < 20)) return false;
          if (t.match(/^\d+[\.\-·]\s*$/)) return false;
          return true;
        });
        data.bodyTextExcerpt = lines.join('\n').substring(0, 2500);
      }

      return data;
    });

    // 合并拦截到的视频流URL — 过滤和按优先级排序
    const validStreamUrls = videoStreamUrls.filter(u => u && !u.startsWith('blob:') && u.startsWith('http') && u.length > 50);
    // 按优先级排序：douyinvod.com(真实视频) > bytevcloudcdn > 其他 > douyinstatic(预览) > effect(特效)
    validStreamUrls.sort((a, b) => {
      const score = (url) => (url.includes('douyinvod.com') ? 100 : 0) + ((url.includes('v26-') || url.includes('v3-web')) ? 50 : 0) + (url.includes('bytevcloudcdn') ? 30 : 0) - (url.includes('douyinstatic') ? 80 : 0) - (url.includes('effect') ? 90 : 0);
      return score(b) - score(a);
    });
    // 也从 DOM 中获取的 video src 加入（排除 blob: 和重复）
    if (result.videoSrc && !result.videoSrc.startsWith('blob:') && !validStreamUrls.includes(result.videoSrc)) {
      validStreamUrls.unshift(result.videoSrc);
    }
    if (result.videoSourceSrc && !result.videoSourceSrc.startsWith('blob:') && !validStreamUrls.includes(result.videoSourceSrc)) {
      validStreamUrls.unshift(result.videoSourceSrc);
    }
    result.videoStreamUrls = validStreamUrls;

    // 如果 API 拦截到了 aweme_detail，提取更多信息
    if (apiVideoData) {
      console.log('🎯 从 API 拦截到 aweme_detail 数据');
      result.apiData = {
        description: apiVideoData.desc || '',
        authorId: apiVideoData.author?.unique_id || apiVideoData.author?.short_id || '',
        authorSignature: apiVideoData.author?.signature || '',
        createTime: apiVideoData.create_time || 0,
        likes: apiVideoData.statistics?.digg_count || 0,
        comments: apiVideoData.statistics?.comment_count || 0,
        shares: apiVideoData.statistics?.share_count || 0,
        collects: apiVideoData.statistics?.collect_count || 0,
        playCount: apiVideoData.statistics?.play_count || 0,
        duration: apiVideoData.video?.duration || apiVideoData.duration || 0,
        musicTitle: apiVideoData.music?.title || '',
        musicAuthor: apiVideoData.music?.author || '',
        hashtags: (apiVideoData.text_extra || []).filter(t => t.hashtag_name).map(t => t.hashtag_name)
      };
      // 尝试从 aweme_detail 获取视频播放地址
      if (apiVideoData.video) {
        const playAddr = apiVideoData.video.play_addr;
        if (playAddr && playAddr.url_list) {
          for (const vUrl of playAddr.url_list) {
            if (vUrl && !videoStreamUrls.includes(vUrl)) {
              videoStreamUrls.push(vUrl);
            }
          }
          result.videoStreamUrls = videoStreamUrls;
        }
      }
      // 用 API 数据覆盖 DOM 数据（API 数据更准确）
      if (result.apiData.description) result.description = result.apiData.description;
      if (result.apiData.likes) result.likes = String(result.apiData.likes);
      if (result.apiData.duration) result.duration = Math.round(result.apiData.duration / 1000);
    }

    console.log('✅ 抖音页面抓取完成:');
    console.log('  描述:', result.description?.substring(0, 80));
    console.log('  作者:', result.author);
    console.log('  点赞:', result.likes);
    console.log('  时长:', result.duration, '秒');
    console.log('  标签:', result.hashtags?.join(', '));
    console.log('  视频流URL数量:', (result.videoStreamUrls || []).length);
    console.log('  评论数:', (result.comments_text || []).length, '条');

    return result;
  } catch(error) {
    console.error('❌ 抖音页面抓取失败:', error.message);
    return null;
  } finally {
    if (page) { try { await page.close(); } catch(e) {} }
  }
}

// 通过 Puppeteer 拦截到的视频流URL直接下载视频
async function downloadVideoFromStreamUrl(streamUrl, videoId, refererUrl) {
  const outputPath = path.join(DOWNLOADS_DIR, videoId + '.mp4');
  try {
    console.log('🎬 通过视频流URL直接下载: ' + streamUrl.substring(0, 100) + '...');

    // 使用 curl 下载，带 Referer 和 Cookie 头
    const referer = refererUrl || 'https://www.douyin.com/';
    const command = 'curl -L -o "' + outputPath + '" -H "Referer: ' + referer + '" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --max-time 120 "' + streamUrl + '"';

    await execCommand(command, 180000);

    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      if (stats.size > 50000) { // 大于50KB才算下载成功（排除缩略图/预览）
        // 使用 ffprobe 检查视频时长和是否有音频轨
        try {
          const probeCmd = 'ffprobe -v quiet -print_format json -show_format -show_streams "' + outputPath + '"';
          const probeResult = await execCommand(probeCmd, 15000);
          const probeData = JSON.parse(probeResult);
          const duration = parseFloat(probeData.format?.duration || 0);
          const hasAudio = (probeData.streams || []).some(s => s.codec_type === 'audio');

          console.log('  视频探测: 时长=' + duration + 's, 有音频=' + hasAudio + ', 大小=' + (stats.size / 1024).toFixed(0) + 'KB');

          // 如果视频太短（<10秒）或没有音频轨，可能是预览/缩略图
          if (duration < 10) {
            console.log('⚠️ 视频太短 (' + duration + 's)，可能是预览视频，跳过');
            fs.unlinkSync(outputPath);
            return null;
          }

          if (!hasAudio) {
            console.log('⚠️ 视频没有音频轨，跳过（无法语音转文字）');
            fs.unlinkSync(outputPath);
            return null;
          }

          console.log('✅ 有效视频下载完成: ' + duration + 's, ' + (stats.size / 1024 / 1024).toFixed(2) + ' MB, 含音频');
          return outputPath;
        } catch (probeErr) {
          // ffprobe 失败但仍下载了文件，保守返回
          console.log('⚠️ ffprobe 检查失败，但文件已下载: ' + (stats.size / 1024).toFixed(0) + 'KB');
          return outputPath;
        }
      } else {
        console.log('⚠️ 下载的文件太小 (' + stats.size + ' bytes)，可能不是有效视频');
        fs.unlinkSync(outputPath);
      }
    }
    return null;
  } catch (error) {
    console.error('❌ 视频流下载失败:', error.message);
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch(e) {}
    return null;
  }
}

// 构建抖音视频的"转录文本"（基于页面抓取的元数据）
function buildDouyinTranscript(scrapedData) {
  if (!scrapedData) return '';
  const parts = [];
  if (scrapedData.description) parts.push('视频描述：' + scrapedData.description);
  if (scrapedData.author) parts.push('作者：' + scrapedData.author);
  if (scrapedData.hashtags && scrapedData.hashtags.length > 0) parts.push('话题标签：' + scrapedData.hashtags.join('、'));
  if (scrapedData.likes) parts.push('点赞数：' + scrapedData.likes);
  if (scrapedData.comments) parts.push('评论数：' + scrapedData.comments);
  if (scrapedData.collects) parts.push('收藏数：' + scrapedData.collects);
  if (scrapedData.duration) {
    const min = Math.floor(scrapedData.duration / 60);
    const sec = scrapedData.duration % 60;
    parts.push('视频时长：' + min + '分' + sec + '秒');
  }
  if (scrapedData.publishDate) parts.push('发布时间：' + scrapedData.publishDate);
  if (scrapedData.apiData) {
    if (scrapedData.apiData.playCount) parts.push('播放量：' + scrapedData.apiData.playCount);
    if (scrapedData.apiData.musicTitle) parts.push('背景音乐：' + scrapedData.apiData.musicTitle + (scrapedData.apiData.musicAuthor ? ' - ' + scrapedData.apiData.musicAuthor : ''));
    if (scrapedData.apiData.authorSignature) parts.push('作者简介：' + scrapedData.apiData.authorSignature);
  }
  // 添加评论区内容
  if (scrapedData.comments_text && scrapedData.comments_text.length > 0) {
    parts.push('\n热门评论：');
    scrapedData.comments_text.forEach((c, i) => {
      parts.push((i + 1) + '. ' + c);
    });
  }
  // 添加页面正文摘录（备用内容）
  if (scrapedData.bodyTextExcerpt && scrapedData.bodyTextExcerpt.length > 200) {
    parts.push('\n页面内容摘录：');
    parts.push(scrapedData.bodyTextExcerpt.substring(0, 1500));
  }
  return parts.join('\n');
}

async function downloadVideo(url, videoId) {
  const outputPath = path.join(DOWNLOADS_DIR, videoId + '.mp4');
  try {
    console.log('📥 开始下载视频: ' + url);
    const platform = detectPlatform(url);
    let command;
    if (platform === 'douyin' || platform === 'xiaohongshu') {
      command = 'yt-dlp --no-check-certificates --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -f "best" --merge-output-format mp4 -o "' + outputPath + '" "' + url + '"';
    } else {
      command = 'yt-dlp --no-check-certificates -f "bestvideo[height<=720]+bestaudio/best[height<=720]" --merge-output-format mp4 -o "' + outputPath + '" "' + url + '"';
    }
    await execCommand(command, 120000);
    const possibleFiles = [outputPath, outputPath.replace('.mp4', '.webm'), outputPath.replace('.mp4', '.mkv')];
    for (const f of possibleFiles) { if (fs.existsSync(f)) { console.log('✅ 视频下载完成: ' + f); return f; } }
    const files = fs.readdirSync(DOWNLOADS_DIR);
    const newFiles = files.filter(f => f.startsWith(videoId));
    if (newFiles.length > 0) { return path.join(DOWNLOADS_DIR, newFiles[0]); }
    throw new Error('视频文件未生成');
  } catch (error) { console.error('❌ 视频下载失败:', error.message); return null; }
}

async function extractAudio(videoPath, videoId) {
  const audioPath = path.join(AUDIO_DIR, videoId + '.wav');
  try {
    console.log('🎵 开始提取音频...');
    const command = 'ffmpeg -i "' + videoPath + '" -vn -acodec pcm_s16le -ar 16000 -ac 1 "' + audioPath + '" -y';
    await execCommand(command, 120000);
    if (fs.existsSync(audioPath)) { console.log('✅ 音频提取完成'); return audioPath; }
    throw new Error('音频文件未生成');
  } catch (error) { console.error('❌ 音频提取失败:', error.message); return null; }
}

async function transcribeAudio(audioPath, videoId) {
  try {
    console.log('📝 开始语音转文字...');
    const command = 'whisper "' + audioPath + '" --model base --output_format txt --output_dir "' + AUDIO_DIR + '"';
    await execCommand(command, 600000);
    const whisperOutput = path.join(AUDIO_DIR, videoId + '.txt');
    if (fs.existsSync(whisperOutput)) {
      const transcript = fs.readFileSync(whisperOutput, 'utf-8').trim();
      if (transcript.length > 10) { console.log('✅ 语音转文字完成: ' + transcript.length + ' 字符'); return transcript; }
    }
    const txtFiles = fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith(videoId) && f.endsWith('.txt'));
    if (txtFiles.length > 0) { return fs.readFileSync(path.join(AUDIO_DIR, txtFiles[0]), 'utf-8').trim(); }
    throw new Error('转录文件未生成');
  } catch (error) { console.error('❌ 语音转文字失败:', error.message); return null; }
}

// 使用 MiMo 修正 Whisper 转录中的技术术语错误
async function correctTranscriptWithAI(rawTranscript, videoContext) {
  if (!rawTranscript || rawTranscript.length < 50) return rawTranscript;
  try {
    console.log('🔧 使用 AI 修正转录文本中的技术术语...');

    // 构建上下文提示：用页面元数据帮助AI理解技术术语
    const contextParts = [];
    if (videoContext) {
      if (videoContext.platform) contextParts.push('平台: ' + videoContext.platform);
      if (videoContext.description) contextParts.push('视频描述: ' + videoContext.description.substring(0, 300));
      if (videoContext.title) contextParts.push('视频标题: ' + videoContext.title);
    }
    const contextHint = contextParts.length > 0 ? '参考信息:\n' + contextParts.join('\n') + '\n\n' : '';

    const systemPrompt = '你是专业的中文语音转录纠错助手。根据参考信息修正语音转录中的错误：\n1) 修正技术术语和产品名称（根据视频描述中的关键词推断）\n2) 修正英文专有名词的错误中文转写\n3) 修正明显的同音字错误\n4) 常见错误映射参考：如果描述提到Claude Code，则"Cloud Coal/CloudCode"→"Claude Code"，"鞋甘0nit"→"/init"，"Staters Lie/statusline"→"statusline"，"血幹Contest"→"/context"，"鞋杆Contest"→"/compact"，"鞋杆Clear"→"/clear"，"Clap模式"→"Plan模式"\n保持口语化风格，不要改变意思。直接输出修正后的文本，不要任何解释或标注。';

    // 分段处理长文本（每段约1500字符，避免token限制）
    const maxChunkSize = 1500;
    if (rawTranscript.length <= maxChunkSize) {
      const corrected = await callMiMo(systemPrompt, contextHint + '修正以下转录:\n' + rawTranscript, 4096);
      if (corrected && corrected.length > rawTranscript.length * 0.4) {
        console.log('✅ AI 修正完成: ' + corrected.length + ' 字符');
        return corrected;
      }
    } else {
      // 分段修正
      const chunks = [];
      const sentences = rawTranscript.split(/(?<=[。！？\r\n])/);
      let currentChunk = '';
      for (const s of sentences) {
        if (currentChunk.length + s.length > maxChunkSize && currentChunk.length > 100) {
          chunks.push(currentChunk);
          currentChunk = s;
        } else {
          currentChunk += s;
        }
      }
      if (currentChunk) chunks.push(currentChunk);

      console.log('  分 ' + chunks.length + ' 段进行AI修正...');
      const correctedChunks = [];
      for (let i = 0; i < chunks.length; i++) {
        const corrected = await callMiMo(systemPrompt, contextHint + '修正以下转录片段 (' + (i+1) + '/' + chunks.length + '):\n' + chunks[i], 4096);
        correctedChunks.push(corrected || chunks[i]);
      }
      const result = correctedChunks.join('');
      if (result.length > rawTranscript.length * 0.4) {
        console.log('✅ AI 分段修正完成: ' + result.length + ' 字符');
        return result;
      }
    }

    console.log('⚠️ AI 修正结果不理想，保留原始转录');
    return rawTranscript;
  } catch (error) {
    console.error('⚠️ AI 修正失败:', error.message);
    return rawTranscript;
  }
}
async function analyzeWithMiMo(transcript, url, platform) {
  console.log('🧠 开始 MiMo 深度分析...');
  if (!transcript || transcript.length < 20) {
    console.log('⚠️ 转录文本太短，使用基础分析');
    return generateFallbackAnalysis(platform, url, transcript);
  }
  try {
    const textForAnalysis = transcript.substring(0, 3000);
    const platformNames = { 'douyin': '抖音', 'bilibili': 'B站', 'youtube': 'YouTube', 'kuaishou': '快手', 'tiktok': 'TikTok', 'xiaohongshu': '小红书', 'weixin_video': '微信视频号' };
    const platformName = platformNames[platform] || platform;

    // 使用简洁明确的 prompt（经过验证有效的格式），限制输入长度，增大 max_tokens
    const shortText = textForAnalysis.substring(0, 1500); // 限制输入避免 token 浪费
    const systemPrompt = '你是视频内容分析AI。只输出纯JSON，不要代码块，不要其他文字。';
    const userPrompt = '分析以下视频内容，输出JSON：\n\n' + shortText + '\n\n格式：{"title":"标题15字","summary":"100字摘要","key_points":["要点1","要点2","要点3"],"tags":["标签1","标签2","标签3"],"category":"分类","one_line_summary":"一句话"}';

    const result = await callMiMo(systemPrompt, userPrompt, 4000); // 增大 token 限制

    if (result) {
      console.log('🔍 MiMo 返回长度: ' + result.length);
      console.log('🔍 MiMo 返回前300字符: ' + result.substring(0, 300));
      try {
        // 清理：去除 markdown 代码块和前后文字
        let cleanResult = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        // 找到第一个 { 和最后一个 } 之间的内容
        const firstBrace = cleanResult.indexOf('{');
        const lastBrace = cleanResult.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          const jsonStr = cleanResult.substring(firstBrace, lastBrace + 1);
          console.log('🔍 提取的JSON长度: ' + jsonStr.length);
          const parsed = JSON.parse(jsonStr);
          const analysis = {
            title: parsed.title || platformName + '视频内容',
            summary: parsed.summary || transcript.substring(0, 200),
            key_points: Array.isArray(parsed.key_points) ? parsed.key_points.slice(0, 7) : ['核心内容讲解', '实用技巧分享'],
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [platformName, '视频', '知识'],
            category: parsed.category || '知识',
            one_line_summary: parsed.one_line_summary || ''
          };
          console.log('✅ MiMo 分析成功!');
          console.log('  标题: ' + analysis.title);
          console.log('  摘要长度: ' + analysis.summary.length);
          console.log('  关键点: ' + analysis.key_points.length + '个');
          return analysis;
        }
        console.log('⚠️ 未找到JSON结构');
      } catch (parseError) { console.error('⚠️ JSON 解析失败: ' + parseError.message); }
      return parseTextAnalysis(result, platform, transcript);
    }
    return generateFallbackAnalysis(platform, url, transcript);
  } catch (error) {
    console.error('❌ MiMo 分析异常:', error.message);
    return generateFallbackAnalysis(platform, url, transcript);
  }
}

function parseTextAnalysis(text, platform, transcript) {
  const lines = text.split('\n').filter(l => l.trim());
  let title = platform + '视频内容', summary = '', keyPoints = [], tags = [platform], category = '知识';
  for (const line of lines) {
    if (line.includes('标题') && line.includes('：')) title = line.split('：')[1]?.trim() || title;
    else if (line.includes('摘要') && line.includes('：')) summary = line.split('：').slice(1).join('：').trim();
    else if (line.match(/^\d+[.、）)]/) || line.match(/^[-•·]/)) keyPoints.push(line.replace(/^\d+[.、）)]\s*/, '').replace(/^[-•·]\s*/, '').trim());
  }
  if (!summary) summary = transcript.substring(0, 200) + '...';
  return { title, summary, key_points: keyPoints.length > 0 ? keyPoints.slice(0, 5) : ['核心内容讲解', '实用技巧分享'], tags: tags.length > 1 ? tags : [platform, '视频', '知识'], category, one_line_summary: summary.substring(0, 50) };
}

function generateFallbackAnalysis(platform, url, transcript) {
  const platformNames = { 'douyin': '抖音', 'bilibili': 'B站', 'youtube': 'YouTube', 'kuaishou': '快手', 'tiktok': 'TikTok', 'xiaohongshu': '小红书', 'weixin_video': '微信视频号' };
  const name = platformNames[platform] || platform;
  let summary = '';
  let keyPoints = [];
  let tags = [name, '视频'];
  let title = name + '视频';

  if (transcript && transcript.length > 50) {
    // 有转录文本或元数据
    const lines = transcript.split('\n').filter(l => l.trim());
    const sentences = transcript.split(/[。！？\n]/).filter(s => s.trim().length > 5);

    // 尝试从转录中提取标题（视频描述通常是第一行）
    if (lines.length > 0) {
      const firstLine = lines[0].replace(/^视频描述[：:]\s*/, '').trim();
      if (firstLine.length > 2 && firstLine.length < 50) {
        title = firstLine;
        // 从标题提取 hashtags 作为 tags
        const hashtagMatches = title.match(/#(\S+)/g);
        if (hashtagMatches) {
          tags = [...tags, ...hashtagMatches.map(t => t.replace('#', ''))];
        }
      }
    }

    summary = sentences.slice(0, 4).join('。');
    if (summary.length < 30) summary = transcript.substring(0, 200);
    keyPoints = sentences.slice(0, 5).map(s => s.trim().substring(0, 80));

    // 从元数据行中提取标签
    const tagLine = lines.find(l => l.startsWith('话题标签'));
    if (tagLine) {
      const extractedTags = tagLine.replace('话题标签[：:]', '').split(/[、,]/).map(t => t.trim()).filter(t => t);
      tags = [...tags, ...extractedTags];
    }
  } else {
    summary = '这是一个来自' + name + '平台的视频。由于网络或技术原因，未能获取到完整的视频内容文本。';
    keyPoints = ['视频内容分析', '平台信息提取', '知识结构化存储'];
  }

  // 去重 tags
  tags = [...new Set(tags)].slice(0, 8);

  return {
    title: title.length > 30 ? title.substring(0, 30) : title,
    summary: summary.substring(0, 300),
    key_points: keyPoints.length > 0 ? keyPoints.slice(0, 5) : ['视频内容分析', '平台信息提取'],
    tags,
    category: '视频',
    one_line_summary: (summary.substring(0, 50) || name + '平台视频内容')
  };
}
async function processVideo(videoId, url, platform) {
  const video = videos.get(videoId);
  if (!video) return;
  try {
    let transcript = '';
    let douyinMeta = null;

    // ========== 抖音专用流程 ==========
    if (platform === 'douyin' || platform === 'weixin_video') {
      // 阶段1: Puppeteer 抓取页面 + 拦截视频流
      video.status = 'downloading'; video.progress = 10; video.processing_detail = '正在通过浏览器抓取页面...';
      console.log('\n========== [' + platform + '] Puppeteer 页面抓取 ==========');
      douyinMeta = await scrapeDouyinPage(url);

      if (douyinMeta) {
        video.duration = douyinMeta.duration || 0;
        // 从抓取数据中提前设置标题（帮助AI纠错）
        if (douyinMeta.description) {
          const titleFromDesc = douyinMeta.description.split(/[！!。？?\n#]/)[0].trim();
          if (titleFromDesc.length > 2 && titleFromDesc.length < 50) video.title = titleFromDesc;
        }

        // 阶段2: 尝试通过拦截到的视频流URL下载视频
        const streamUrls = douyinMeta.videoStreamUrls || [];
        let videoPath = null;

        if (streamUrls.length > 0) {
          console.log('\n========== [' + platform + '] 通过视频流URL下载 (' + streamUrls.length + '个候选) ==========');
          video.progress = 20; video.processing_detail = '正在下载视频流...';

          for (let i = 0; i < streamUrls.length; i++) {
            console.log('  尝试视频流 #' + (i + 1) + ': ' + streamUrls[i].substring(0, 100) + '...');
            videoPath = await downloadVideoFromStreamUrl(streamUrls[i], videoId, url);
            if (videoPath) break;
            console.log('  ❌ 视频流 #' + (i + 1) + ' 下载失败');
          }
        }

        // 如果流URL下载失败，尝试 yt-dlp
        if (!videoPath) {
          console.log('\n========== [' + platform + '] 尝试 yt-dlp 下载 ==========');
          video.progress = 25; video.processing_detail = '正在尝试备用下载方式...';
          videoPath = await downloadVideo(url, videoId);
        }

        // 如果成功下载了视频，提取音频并转录
        if (videoPath) {
          video.status = 'extracting'; video.progress = 35; video.processing_detail = '正在提取音频...';
          console.log('\n========== [' + platform + '] 提取音频 ==========');
          const audioPath = await extractAudio(videoPath, videoId);
          if (audioPath) {
            video.status = 'transcribing'; video.progress = 45; video.processing_detail = '正在进行语音转文字（完整转录中）...';
            console.log('\n========== [' + platform + '] Whisper 语音转文字 ==========');
            let rawTranscript = await transcribeAudio(audioPath, videoId);
            if (rawTranscript && rawTranscript.length > 20) {
              // 使用 AI 修正转录中的技术术语错误
              video.processing_detail = '正在AI修正转录文本...';
              video.progress = 55;
              transcript = await correctTranscriptWithAI(rawTranscript, {
                platform,
                description: douyinMeta?.description || douyinMeta?.apiData?.description || '',
                title: video.title || ''
              });
              video.transcript = transcript;
              video.processing_detail = '完整转录+AI修正完成！共 ' + transcript.length + ' 字符';
              console.log('✅ 完整转录+AI修正: ' + transcript.length + ' 字符');
            }
            // 清理音频文件
            try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch (e) {}
          }
          // 清理视频文件
          try { if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath); } catch (e) {}
        }

        // 如果语音转录失败或没有下载到视频，使用页面元数据
        if (!transcript || transcript.length < 20) {
          console.log('\n========== [' + platform + '] 使用页面元数据作为内容 ==========');
          transcript = buildDouyinTranscript(douyinMeta);
          video.transcript = transcript;
          video.processing_detail = '未能下载视频进行语音转录，使用页面元数据（' + transcript.length + ' 字符）';
          console.log('📝 页面元数据转录: ' + transcript.length + ' 字符');
        }
      } else {
        video.processing_detail = '页面抓取失败，尝试直接下载...';
        // 最后尝试 yt-dlp 直接下载
        const videoPath = await downloadVideo(url, videoId);
        if (videoPath) {
          const audioPath = await extractAudio(videoPath, videoId);
          if (audioPath) {
            transcript = await transcribeAudio(audioPath, videoId);
            if (transcript) video.transcript = transcript;
            try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch (e) {}
          }
          try { if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath); } catch (e) {}
        }
        if (!transcript || transcript.length < 20) {
          transcript = '';
          video.processing_detail = '所有方式均失败';
        }
      }
    } else {
      // ========== 其他平台标准流程 ==========
      video.status = 'downloading'; video.progress = 10; video.processing_detail = '正在下载视频...';
      console.log('\n========== [1/4] 下载视频 ==========');
      const videoPath = await downloadVideo(url, videoId);
      if (videoPath) {
        video.status = 'extracting'; video.progress = 25; video.processing_detail = '正在提取音频...';
        console.log('\n========== [2/4] 提取音频 ==========');
        const audioPath = await extractAudio(videoPath, videoId);
        if (audioPath) {
          video.status = 'transcribing'; video.progress = 40; video.processing_detail = '正在进行语音转文字（可能需要几分钟）...';
          console.log('\n========== [3/4] 语音转文字 ==========');
          transcript = await transcribeAudio(audioPath, videoId);
          if (transcript) { video.transcript = transcript; video.processing_detail = '转录完成！共 ' + transcript.length + ' 字符'; }
          else { video.processing_detail = '语音转文字未成功，将使用基础分析'; }
        } else { video.processing_detail = '音频提取失败，将使用基础分析'; }
        try { if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath); } catch (e) {}
      } else { video.processing_detail = '视频下载失败，将使用基础分析'; }
    }

    // ========== AI 分析（所有平台通用） ==========
    video.status = 'analyzing'; video.progress = 70; video.processing_detail = '正在进行AI深度分析...';
    console.log('\n========== AI 深度分析 ==========');

    // 为页面抓取数据定制分析 prompt（抖音、微信视频号等）
    let analysisInput = video.transcript || '';
    if ((platform === 'douyin' || platform === 'weixin_video') && douyinMeta && (!video.transcript || video.transcript.length < 200)) {
      // 对于基于元数据的分析，使用更定制化的 prompt
      const platformNames = { 'douyin': '抖音', 'bilibili': 'B站', 'youtube': 'YouTube', 'kuaishou': '快手', 'tiktok': 'TikTok', 'xiaohongshu': '小红书', 'weixin_video': '微信视频号' };
      const name = platformNames[platform] || platform;
      const meta = douyinMeta.apiData || douyinMeta;
      const metaSummary = [
        '平台：' + name,
        meta.description ? '视频描述：' + meta.description : '',
        meta.author ? '作者：' + meta.author : '',
        meta.hashtags && meta.hashtags.length ? '话题标签：' + meta.hashtags.join('、') : '',
        meta.likes ? '点赞：' + meta.likes : '',
        meta.comments ? '评论：' + meta.comments : '',
        meta.collects ? '收藏：' + meta.collects : '',
        meta.duration ? '时长：' + Math.floor(meta.duration / 60) + '分' + (meta.duration % 60) + '秒' : '',
        meta.publishDate ? '发布时间：' + meta.publishDate : ''
      ].filter(Boolean).join('\n');

      const systemPrompt = '你是视频内容分析AI。根据以下抖音视频的元数据信息，推断视频内容并输出纯JSON。不要代码块。';
      const userPrompt = '以下是抖音视频的元数据（描述、标签、互动数据等），请基于这些信息推断视频可能的内容主题，生成分析JSON：\n\n' + metaSummary + '\n\n格式：{"title":"标题15字","summary":"100字基于元数据的内容推测摘要","key_points":["基于描述和标签的要点1","要点2","要点3"],"tags":["标签1","标签2"],"category":"分类","one_line_summary":"一句话"}';

      const mimoResult = await callMiMo(systemPrompt, userPrompt, 4000);
      if (mimoResult) {
        try {
          let cleanResult = mimoResult.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          const firstBrace = cleanResult.indexOf('{');
          const lastBrace = cleanResult.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            const jsonStr = cleanResult.substring(firstBrace, lastBrace + 1);
            const parsed = JSON.parse(jsonStr);
            video.title = parsed.title || '抖音视频内容';
            video.summary = parsed.summary || metaSummary.substring(0, 200);
            video.key_points = Array.isArray(parsed.key_points) ? parsed.key_points.slice(0, 7) : ['视频内容分析'];
            video.tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : ['抖音', '视频'];
            video.category = parsed.category || '知识';
            video.one_line_summary = parsed.one_line_summary || '';
            console.log('✅ 抖音 MiMo 分析成功: ' + video.title);
          }
        } catch(e) {
          console.log('⚠️ 抖音 MiMo JSON 解析失败，使用文本分析');
          const parsed = parseTextAnalysis(mimoResult, platform, analysisInput);
          Object.assign(video, parsed);
        }
      }
    } else {
      // 标准分析流程
      const analysis = await analyzeWithMiMo(analysisInput, url, platform);
      if (analysis) {
        video.title = analysis.title; video.summary = analysis.summary;
        video.key_points = analysis.key_points; video.tags = analysis.tags;
        video.category = analysis.category || '知识'; video.one_line_summary = analysis.one_line_summary || '';
      }
    }

    // 完成
    video.status = 'completed'; video.progress = 100; video.processing_detail = '处理完成！';
    video.processed_at = new Date().toISOString();
    knowledgeBase.set(videoId, {
      doc_id: 'video_' + videoId,
      content: (video.transcript || '') + '\n\n摘要：' + (video.summary || '') + '\n\n关键点：\n' + (video.key_points || []).join('\n'),
      metadata: { video_id: videoId, title: video.title, summary: video.summary, one_line_summary: video.one_line_summary || '', category: video.category, tags: JSON.stringify(video.tags), source_url: video.url, source_platform: video.platform, duration: video.duration, transcript_length: (video.transcript || '').length, has_transcript: !!(video.transcript && video.transcript.length > 10) }
    });
    console.log('\n✅ 视频处理完成: ' + videoId + ' | 标题: ' + video.title + ' | 转录: ' + (video.transcript || '').length + ' 字符');
  } catch (error) {
    console.error('❌ 视频处理失败:', error);
    video.status = 'failed'; video.processing_detail = '处理失败: ' + error.message;
  }
}
function initSampleData() {
  console.log('📦 初始化示例数据...');
  const sampleVideos = [
    {
      id: 'demo-1', url: 'https://www.bilibili.com/video/BV1GJ411x7h7', platform: 'bilibili',
      title: 'Python零基础入门：从安装到写出第一个程序',
      one_line_summary: 'Python编程从零开始，涵盖安装配置和基础语法',
      summary: '本视频是一份完整的Python零基础入门教程。首先介绍了Python语言的特点：简洁易读、生态丰富、应用广泛。然后详细演示了Python的安装过程，包括Windows和Mac系统。接着讲解了基础语法，包括变量定义、数据类型（字符串、整数、浮点数、列表、字典）、条件判断（if-else）和循环（for、while）。最后通过一个实际项目——制作简易计算器，将所有知识点串联起来。视频节奏适中，讲解清晰，非常适合编程初学者。',
      key_points: ['Python是一种简洁易读的编程语言，适合初学者', '安装Python时建议勾选Add to PATH选项', 'Python支持多种数据类型：字符串、整数、列表、字典等', 'if-else条件判断和for/while循环是程序控制流的核心', '通过实际项目练习可以快速巩固所学知识'],
      tags: ['Python', '编程入门', '零基础', '教程', '计算机科学'], category: '编程教程', duration: 900,
      transcript: '大家好，欢迎来到Python零基础入门教程。今天我们从最基础的内容开始讲起。Python是目前世界上最流行的编程语言之一，它的设计哲学是简洁优雅，非常适合初学者入门。\n\n首先，我们来安装Python。请大家打开浏览器，访问python.org，点击Downloads页面，下载最新版本的Python。在安装过程中，一定要记得勾选Add Python to PATH这个选项，这样我们就可以在命令行中直接使用Python了。\n\n安装完成后，打开命令行，输入python --version，如果能看到版本号，说明安装成功了。接下来，我们来写第一个Python程序。新建一个文件，命名为hello.py，输入print("Hello, World!")。然后在命令行中运行python hello.py，你会看到屏幕上输出了Hello, World!。恭喜你，你已经写出了第一个Python程序！\n\n现在让我们来学习Python的基础语法。首先是变量。在Python中，定义变量非常简单，比如name = "小明"，age = 18。Python是动态类型语言，你不需要声明变量的类型。\n\nPython有几种基本数据类型：字符串用引号包裹；整数就是普通的数字，比如42；浮点数就是小数，比如3.14；列表用方括号表示，比如[1, 2, 3]；字典用花括号表示。\n\n条件判断使用if-else语句。循环有两种：for循环和while循环。最后让我们做一个小项目——制作一个简易计算器。好，今天的教程就到这里。'
    },
    {
      id: 'demo-2', url: 'https://www.youtube.com/watch?v=aircAruvnKk', platform: 'youtube',
      title: '3Blue1Brown：神经网络到底是什么？深度学习入门',
      one_line_summary: '用直观的可视化方式解释神经网络的工作原理',
      summary: '这期视频来自知名的数学科普频道3Blue1Brown，用极其直观的可视化方式讲解了神经网络的基本概念。视频从一个手写数字识别的例子出发，解释了神经网络是如何"看"图片的。每一层神经网络就像一个过滤器，逐步提取图片的特征：第一层识别边缘，第二层识别形状，第三层识别更复杂的图案。通过权重和偏置的调整，网络学会了区分不同的数字。视频用动画展示了梯度下降的过程，让观众直观理解了"学习"到底意味着什么。',
      key_points: ['神经网络是一种模仿人脑结构的计算模型', '每一层神经元负责提取不同层次的特征', '权重和偏置是神经网络学习的核心参数', '梯度下降是神经网络学习的数学本质', '反向传播算法让网络能够从错误中改进'],
      tags: ['神经网络', '深度学习', 'AI', '机器学习', '3Blue1Brown'], category: 'AI与机器学习', duration: 1200,
      transcript: 'What is a neural network? In this video, I want to help you build an intuition for what neural networks are, and how they work. To do this, let us start with a concrete example: recognizing handwritten digits. Imagine you have a grid of pixels, 28 by 28, making 784 pixels total. Each pixel has a grayscale value from 0 to 255. A neural network takes these 784 numbers as input and outputs 10 numbers, one for each digit from 0 to 9. The network has layers. The first layer has 784 neurons. The last layer has 10 neurons. In between, there are hidden layers. Each neuron in one layer is connected to every neuron in the next layer. Each connection has a weight, and each neuron has a bias. The activation function is crucial. The sigmoid function squishes values between 0 and 1. How does the network learn? This is where gradient descent comes in. We start with random weights and biases. We feed in training examples and compare the output to the correct answer. The backpropagation algorithm efficiently computes these gradients. After training on thousands of examples, the network learns to recognize patterns.'
    },
    {
      id: 'demo-3', url: 'https://www.douyin.com/video/demo3', platform: 'douyin',
      title: '高效时间管理的5个实用技巧',
      one_line_summary: '五个科学验证的时间管理方法提升工作效率',
      summary: '本视频分享了五个经过科学验证的时间管理技巧。第一，番茄工作法：25分钟专注工作+5分钟休息，四个番茄后长休息15分钟。第二，两分钟法则：如果一件事能在两分钟内完成，立刻去做。第三，时间块规划：将一天分成不同时间块，每个块专注一类任务。第四，优先级矩阵：用四象限法则区分紧急/重要任务。第五，每日复盘：每天花5分钟回顾和规划。这些方法简单实用，坚持执行可以显著提升工作效率。',
      key_points: ['番茄工作法：25分钟专注+5分钟休息的循环工作模式', '两分钟法则：能快速完成的事立即执行不拖延', '时间块规划：将同类任务集中在同一时间段处理', '优先级矩阵：用四象限法则区分紧急与重要任务', '每日复盘：每天5分钟回顾总结持续改进'],
      tags: ['时间管理', '效率提升', '工作方法', '自我管理', '职场'], category: '效率与方法论', duration: 180,
      transcript: '大家好，今天分享五个时间管理技巧。第一是番茄工作法，设定25分钟倒计时，专注工作，时间到后休息5分钟，每完成四个番茄钟，休息15到20分钟。第二是两分钟法则，如果一件事情能在两分钟内完成，立刻去做，不要放进待办清单。第三是时间块规划，把一天分成不同的时间块，比如上午9到11点处理重要工作，下午2到3点回复邮件和消息。第四是四象限法则，把任务分为紧急重要、重要不紧急、紧急不重要、不紧急不重要四类，优先处理重要不紧急的事务。第五是每日复盘，每天睡前花5分钟回顾今天完成了什么，明天最重要的三件事是什么。坚持这些方法，你会发现效率大幅提升。'
    },
    {
      id: 'demo-4', url: 'https://www.bilibili.com/video/demo4', platform: 'bilibili',
      title: '2024年最值得关注的5个AI工具',
      one_line_summary: '盘点改变工作方式的五个AI生产力工具',
      summary: '本视频盘点了2024年最值得关注的五个AI工具。Claude：Anthropic推出的AI助手，在长文本理解和代码生成方面表现出色。Cursor：AI原生代码编辑器，将AI深度集成到编程工作流中。Midjourney：AI图像生成工具，可以创建高质量的艺术作品和设计素材。Notion AI：将AI集成到笔记和项目管理中，智能总结和写作辅助。Perplexity AI：AI搜索引擎，直接给出答案和来源引用。这些工具正在改变各行各业的工作方式。',
      key_points: ['Claude在长文本理解和代码生成领域表现突出', 'Cursor将AI深度融入编程工作流提升开发效率', 'Midjourney可以生成高质量商业级图像和设计', 'Notion AI让知识管理更加智能化', 'Perplexity AI重新定义了搜索体验直接给出答案'],
      tags: ['AI工具', '效率工具', 'Claude', 'Cursor', 'Midjourney', '2024'], category: 'AI与机器学习', duration: 360,
      transcript: '大家好，今天盘点2024年最值得关注的五个AI工具。第一个是Claude，由Anthropic开发，擅长长文本理解、分析和代码生成。第二个是Cursor，这是一款AI原生的代码编辑器，可以把AI深度集成到你的编程工作流中，写代码效率提升非常明显。第三个是Midjourney，目前最强的AI图像生成工具之一，生成的图片质量非常高，适合设计师和内容创作者。第四个是Notion AI，把AI集成到了笔记和项目管理工具中，可以智能总结、续写、翻译。第五个是Perplexity AI，它重新定义了搜索体验，不再是给你一堆链接，而是直接给出答案和来源引用。这五个工具代表了AI应用的趋势，建议大家都去体验一下。'
    },
    {
      id: 'demo-5', url: 'https://www.youtube.com/watch?v=demo5', platform: 'youtube',
      title: '财务自由之路：普通人如何开始投资理财',
      one_line_summary: '面向普通人的投资理财入门指南与实用建议',
      summary: '本视频从零开始讲解普通人如何进行投资理财。首先明确了财务自由的定义：被动收入超过日常支出。然后介绍了投资的基本原则：分散投资、长期持有、定期定额。详细讲解了几种常见投资方式的特点和风险：银行理财（低风险低收益）、基金定投（中等风险适合入门）、股票（高风险高收益需要学习）、指数基金（推荐新手首选）。最后给出了具体的行动建议：先存3-6个月应急资金，再开始投资。',
      key_points: ['财务自由=被动收入超过日常支出', '投资三大原则：分散投资、长期持有、定期定额', '指数基金是新手投资的最佳入门选择', '投资前先建立3-6个月的应急资金储备', '避免追涨杀跌坚持定投策略'],
      tags: ['理财', '投资', '财务自由', '基金定投', '个人理财'], category: '财经与理财', duration: 480,
      transcript: '大家好，今天聊聊普通人如何开始投资理财。首先说说什么叫财务自由，简单说就是你的被动收入超过了你的日常开销，你不工作也能维持生活。那怎么达到这个目标呢？第一，投资的三大原则。分散投资，不要把钱都放在一个地方。长期持有，不要频繁买卖。定期定额，每个月固定投入一笔钱。第二，常见的投资方式。银行理财，风险最低但收益也低。基金定投，适合入门，每月固定金额买入。股票，收益高但风险也大，需要花时间学习。指数基金，我个人最推荐新手从这里开始，比如沪深300指数基金。第三，行动建议。先存够三到六个月的应急资金，然后再开始投资。记住，投资是一场马拉松，不是短跑。'
    }
  ];
  for (let i = 0; i < sampleVideos.length; i++) {
    const v = sampleVideos[i];
    const video = { ...v, status: 'completed', progress: 100, processing_detail: '已完成', created_at: new Date(Date.now() - (i + 1) * 3600000).toISOString(), processed_at: new Date(Date.now() - (i + 1) * 3600000).toISOString() };
    videos.set(v.id, video);
    knowledgeBase.set(v.id, { doc_id: 'video_' + v.id, content: v.transcript + '\n\n摘要：' + v.summary + '\n\n关键点：\n' + v.key_points.join('\n'), metadata: { video_id: v.id, title: v.title, summary: v.summary, one_line_summary: v.one_line_summary, category: v.category, tags: JSON.stringify(v.tags), source_url: v.url, source_platform: v.platform, duration: video.duration, transcript_length: v.transcript.length, has_transcript: true } });
  }
  console.log('✅ 示例数据初始化完成: ' + videos.size + ' 个视频');
}
// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'VideoBrain v2.6', ai_model: MIMO_MODEL, features: ['video_download', 'audio_extraction', 'speech_to_text', 'ai_analysis', 'douyin_puppeteer', 'video_stream_intercept', 'whisper_transcription', 'ai_transcript_correction', 'weixin_video_channel', 'knowledge_edit', 'knowledge_delete', 'content_categories', 'smart_similarity_search', 'auto_language_detection', 'batch_url_extraction', 'share_text_parsing'], videos_count: videos.size, knowledge_count: knowledgeBase.size, timestamp: new Date().toISOString() });
});

app.post('/api/videos/process', async (req, res) => {
  let { url } = req.body;
  if (!url) return res.status(400).json({ detail: '请提供视频链接' });

  // Step 1: 从分享文本中提取 URL
  url = extractUrl(url);
  console.log('📎 提取后的 URL: ' + url);

  // Step 2: 解析短链接
  url = await resolveShortUrl(url);
  console.log('📎 解析后的 URL: ' + url.substring(0, 120));

  const platform = detectPlatform(url);
  if (platform === 'unknown') return res.status(400).json({ detail: '不支持的视频平台，目前支持：抖音、B站、YouTube、快手、TikTok、小红书、微信视频号' });

  const videoId = uuidv4().substring(0, 8);
  const newVideo = { id: videoId, url, platform, title: '视频-' + videoId, description: '正在处理中...', duration: 0, status: 'pending', progress: 0, processing_detail: '等待处理...', transcript: '', summary: '', one_line_summary: '', key_points: [], tags: [], category: '', created_at: new Date().toISOString(), processed_at: null };
  videos.set(videoId, newVideo);
  processVideo(videoId, url, platform);
  res.json({ video_id: videoId, status: 'pending', platform, message: '视频处理任务已创建，正在后台处理...' });
});

app.get('/api/videos/:id', (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) return res.status(404).json({ detail: '视频不存在' });
  res.json({ ...video, transcript_length: (video.transcript || '').length, has_transcript: !!(video.transcript && video.transcript.length > 10) });
});

app.get('/api/videos/:id/transcript', (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) return res.status(404).json({ detail: '视频不存在' });
  res.json({ video_id: video.id, title: video.title, transcript: video.transcript || '', transcript_length: (video.transcript || '').length, has_transcript: !!(video.transcript && video.transcript.length > 10), source_url: video.url, platform: video.platform });
});

app.get('/api/videos', (req, res) => {
  const { page = 1, page_size = 20, status, platform } = req.query;
  let videoList = Array.from(videos.values());
  if (status) videoList = videoList.filter(v => v.status === status);
  if (platform) videoList = videoList.filter(v => v.platform === platform);
  videoList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const start = (page - 1) * page_size;
  const end = start + parseInt(page_size);
  const result = videoList.slice(start, end).map(v => ({ ...v, transcript_preview: (v.transcript || '').substring(0, 200) + ((v.transcript || '').length > 200 ? '...' : ''), transcript_length: (v.transcript || '').length, has_transcript: !!(v.transcript && v.transcript.length > 10) }));
  res.json({ total: videoList.length, page: parseInt(page), page_size: parseInt(page_size), videos: result });
});

app.post('/api/videos/batch', async (req, res) => {
  const urls = req.body;
  if (!Array.isArray(urls)) return res.status(400).json({ detail: '请提供URL数组' });
  // BUG FIX #7: 批量处理也要提取URL和解析短链接
  const results = [];
  for (const rawUrl of urls) {
    const extractedUrl = extractUrl(rawUrl);
    const resolvedUrl = await resolveShortUrl(extractedUrl);
    const platform = detectPlatform(resolvedUrl);
    const videoId = uuidv4().substring(0, 8);
    videos.set(videoId, { id: videoId, url: resolvedUrl, platform, title: '视频-' + videoId, status: 'pending', progress: 0, processing_detail: '等待处理...', transcript: '', summary: '', key_points: [], tags: [], category: '', created_at: new Date().toISOString() });
    processVideo(videoId, resolvedUrl, platform);
    results.push({ url: resolvedUrl, video_id: videoId, status: 'pending', platform });
  }
  res.json({ results, total: urls.length });
});

app.post('/api/knowledge/search', (req, res) => {
  const { query, category, platform, limit = 10 } = req.body;
  let results = Array.from(knowledgeBase.values());
  if (query) {
    const q = query.toLowerCase();
    const queryTerms = q.split(/\s+/).filter(t => t.length > 0);
    results = results.map(item => {
      const t = (item.metadata.title || '').toLowerCase();
      const s = (item.metadata.summary || '').toLowerCase();
      const c = (item.content || '').toLowerCase();
      const tg = (item.metadata.tags || '').toLowerCase();
      const ol = (item.metadata.one_line_summary || '').toLowerCase();
      // 计算加权相似度分数
      let score = 0;
      for (const term of queryTerms) {
        if (t.includes(term)) score += 0.35;      // 标题匹配权重最高
        if (ol.includes(term)) score += 0.25;      // 一句话摘要
        if (s.includes(term)) score += 0.2;        // 摘要
        if (tg.includes(term)) score += 0.15;      // 标签
        if (c.includes(term)) score += 0.1;        // 全文内容
        // 精确匹配加分
        if (t === term || ol === term) score += 0.15;
      }
      // 多关键词同时命中的叠加加分
      const matchCount = queryTerms.filter(term => t.includes(term) || s.includes(term) || c.includes(term) || tg.includes(term)).length;
      if (matchCount > 1) score += (matchCount - 1) * 0.05;
      // 归一化到 0-1
      return { ...item, similarity: Math.min(1, Math.max(0, score)) };
    });
    results = results.filter(item => item.similarity > 0);
    results.sort((a, b) => b.similarity - a.similarity);
  }
  if (category) results = results.filter(item => item.metadata.category === category);
  if (platform) results = results.filter(item => item.metadata.source_platform === platform);
  results = results.slice(0, parseInt(limit));
  res.json({ success: true, results, total: results.length });
});

app.get('/api/knowledge/categories/list', (req, res) => {
  const categoryMap = {};
  knowledgeBase.forEach(item => {
    const cat = item.metadata.category || '未分类';
    if (!categoryMap[cat]) categoryMap[cat] = 0;
    categoryMap[cat]++;
  });
  const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  res.json({ categories, total: knowledgeBase.size });
});

app.get('/api/knowledge/stats', (req, res) => {
  const categories = new Set(); const platforms = {};
  knowledgeBase.forEach(item => { if (item.metadata.category) categories.add(item.metadata.category); const p = item.metadata.source_platform || 'unknown'; platforms[p] = (platforms[p] || 0) + 1; });
  res.json({ total_entries: knowledgeBase.size, categories: Array.from(categories), category_count: categories.size, platform_distribution: platforms });
});

app.get('/api/knowledge/export', (req, res) => {
  const { format = 'json' } = req.query; const data = Array.from(knowledgeBase.values());
  res.json({ success: true, data, format, count: data.length });
});

app.get('/api/knowledge/:videoId', (req, res) => {
  const entry = knowledgeBase.get(req.params.videoId);
  if (!entry) return res.status(404).json({ detail: '知识条目不存在' });
  res.json(entry);
});

// ============ 知识库编辑 API ============

// 编辑视频信息（标题、摘要、关键点、标签、分类等）
app.put('/api/videos/:id', (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) return res.status(404).json({ detail: '视频不存在' });

  const { title, summary, one_line_summary, key_points, tags, category, transcript, description } = req.body;

  // 更新视频字段（只更新提供的字段）
  if (title !== undefined) video.title = title;
  if (summary !== undefined) video.summary = summary;
  if (one_line_summary !== undefined) video.one_line_summary = one_line_summary;
  if (key_points !== undefined) video.key_points = Array.isArray(key_points) ? key_points : [];
  if (tags !== undefined) video.tags = Array.isArray(tags) ? tags : [];
  if (category !== undefined) video.category = category;
  if (transcript !== undefined) video.transcript = transcript;
  if (description !== undefined) video.description = description;
  video.updated_at = new Date().toISOString();

  // 同步更新知识库条目
  const entry = knowledgeBase.get(req.params.id);
  if (entry) {
    entry.content = (video.transcript || '') + '\n\n摘要：' + (video.summary || '') + '\n\n关键点：\n' + (video.key_points || []).join('\n');
    entry.metadata.title = video.title;
    entry.metadata.summary = video.summary;
    entry.metadata.one_line_summary = video.one_line_summary || '';
    entry.metadata.category = video.category;
    entry.metadata.tags = JSON.stringify(video.tags);
    entry.metadata.transcript_length = (video.transcript || '').length;
    entry.metadata.has_transcript = !!(video.transcript && video.transcript.length > 10);
    entry.metadata.updated_at = video.updated_at;
  }

  console.log('✏️ 视频已编辑: ' + req.params.id + ' | 标题: ' + video.title);
  res.json({ success: true, video: { ...video, transcript_length: (video.transcript || '').length, has_transcript: !!(video.transcript && video.transcript.length > 10) } });
});

// 删除视频及知识条目
app.delete('/api/videos/:id', (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) return res.status(404).json({ detail: '视频不存在' });

  const title = video.title;
  videos.delete(req.params.id);
  knowledgeBase.delete(req.params.id);

  console.log('🗑️ 视频已删除: ' + req.params.id + ' | 标题: ' + title);
  res.json({ success: true, message: '视频 "' + title + '" 已删除', deleted_id: req.params.id });
});

// 批量删除视频
app.post('/api/videos/delete-batch', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ detail: '请提供要删除的ID数组' });

  const deleted = [];
  const notFound = [];
  for (const id of ids) {
    if (videos.has(id)) {
      const v = videos.get(id);
      deleted.push({ id, title: v.title });
      videos.delete(id);
      knowledgeBase.delete(id);
    } else {
      notFound.push(id);
    }
  }

  console.log('🗑️ 批量删除: ' + deleted.length + ' 个视频');
  res.json({ success: true, deleted, not_found: notFound, deleted_count: deleted.length });
});

// ============ 分类管理 API ============

// 获取所有分类（含每个分类的视频数量和列表）
app.get('/api/categories', (req, res) => {
  const categoryMap = new Map();
  const uncategorized = [];

  videos.forEach((video, id) => {
    const cat = video.category || '';
    if (!cat) {
      uncategorized.push({ id, title: video.title, platform: video.platform, one_line_summary: video.one_line_summary || '' });
    } else {
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { name: cat, count: 0, videos: [] });
      }
      const catInfo = categoryMap.get(cat);
      catInfo.count++;
      catInfo.videos.push({ id, title: video.title, platform: video.platform, one_line_summary: video.one_line_summary || '' });
    }
  });

  // 添加独立存储的自定义分类（即使没有视频）
  customCategories.forEach(catName => {
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, { name: catName, count: 0, videos: [] });
    }
  });

  const categories = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);
  res.json({
    categories,
    uncategorized: { name: '未分类', count: uncategorized.length, videos: uncategorized },
    total_categories: categories.length,
    total_videos: videos.size
  });
});

// 创建新分类（批量将视频移入新分类）
app.post('/api/categories', (req, res) => {
  const { name, video_ids } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ detail: '分类名称不能为空' });

  const updated = [];
  if (Array.isArray(video_ids)) {
    for (const id of video_ids) {
      const video = videos.get(id);
      if (video) {
        video.category = name.trim();
        video.updated_at = new Date().toISOString();
        const entry = knowledgeBase.get(id);
        if (entry) entry.metadata.category = name.trim();
        updated.push(id);
      }
    }
  }

  // 保存分类到独立存储
  customCategories.add(name.trim());

  console.log('📁 创建/更新分类: ' + name + ' | ' + updated.length + ' 个视频');
  res.json({ success: true, category: name.trim(), updated_count: updated.length, updated_ids: updated });
});

// 重命名分类
app.put('/api/categories/:name', (req, res) => {
  const oldName = decodeURIComponent(req.params.name);
  const { new_name } = req.body;
  if (!new_name || !new_name.trim()) return res.status(400).json({ detail: '新分类名称不能为空' });

  let count = 0;
  videos.forEach((video) => {
    if (video.category === oldName) {
      video.category = new_name.trim();
      video.updated_at = new Date().toISOString();
      count++;
    }
  });
  knowledgeBase.forEach((entry) => {
    if (entry.metadata.category === oldName) {
      entry.metadata.category = new_name.trim();
    }
  });

  // 更新独立分类存储
  customCategories.delete(oldName);
  customCategories.add(new_name.trim());

  console.log('📁 重命名分类: ' + oldName + ' → ' + new_name + ' | ' + count + ' 个视频');
  res.json({ success: true, old_name: oldName, new_name: new_name.trim(), updated_count: count });
});

// 删除分类（将该分类下的视频设为未分类）
app.delete('/api/categories/:name', (req, res) => {
  const catName = decodeURIComponent(req.params.name);
  let count = 0;

  videos.forEach((video) => {
    if (video.category === catName) {
      video.category = '';
      video.updated_at = new Date().toISOString();
      count++;
    }
  });
  knowledgeBase.forEach((entry) => {
    if (entry.metadata.category === catName) {
      entry.metadata.category = '';
    }
  });

  // 从独立分类存储中删除
  customCategories.delete(catName);

  console.log('🗑️ 删除分类: ' + catName + ' | ' + count + ' 个视频移入未分类');
  res.json({ success: true, deleted_category: catName, moved_to_uncategorized: count });
});

// 批量移动视频到指定分类
app.post('/api/categories/move', (req, res) => {
  const { video_ids, target_category } = req.body;
  if (!Array.isArray(video_ids) || video_ids.length === 0) return res.status(400).json({ detail: '请提供视频ID数组' });

  const moved = [];
  for (const id of video_ids) {
    const video = videos.get(id);
    if (video) {
      video.category = target_category || '';
      video.updated_at = new Date().toISOString();
      const entry = knowledgeBase.get(id);
      if (entry) entry.metadata.category = target_category || '';
      moved.push(id);
    }
  }

  console.log('📁 移动视频到分类: ' + (target_category || '未分类') + ' | ' + moved.length + ' 个');
  res.json({ success: true, target_category: target_category || '未分类', moved_count: moved.length });
});

app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ detail: '请提供消息内容' });
  let systemPrompt = '你是 VideoBrain 智能助手，一个专业的视频知识管理AI。请用专业、友好的语气回答问题。';
  if (context) systemPrompt += '\n\n当前知识库信息：' + JSON.stringify(context);
  const response = await callMiMo(systemPrompt, message);
  if (response) res.json({ success: true, response, model: MIMO_MODEL });
  else res.status(500).json({ detail: 'AI 响应失败，请稍后重试' });
});

// 启动
async function start() {
  console.log('');
  console.log('========================================');
  console.log('  🧠 VideoBrain v2.6 - 类型安全/UX优化/平台扩展');
  console.log('  🤖 AI: 小米 MiMo v2.5 Pro');
  console.log('  🕷️ 抖音/视频号: Puppeteer 页面抓取 + 视频流拦截下载');
  console.log('  📝 Whisper: 语音转文字 + MiMo AI纠错 + 自动语言检测');
  console.log('  ✏️ 知识库: 编辑 | 删除 | 分区管理 | 智能搜索');
  console.log('  🔧 修复: 批量URL解析 | 轮询内存泄漏 | 搜索过滤器');
  console.log('========================================');
  initSampleData();
  app.listen(PORT, () => {
    console.log('✅ VideoBrain v2.6 已启动');
    console.log('  🌐 前端: http://localhost:3000');
    console.log('  🔌 API:  http://localhost:' + PORT);
    console.log('  新功能: 批量分享文本解析 | 微信视频号完整支持 | 搜索平台过滤');
  });

  // 优雅关闭
  process.on('SIGINT', async () => {
    console.log('\n正在关闭...');
    if (browserInstance) { try { await browserInstance.close(); } catch(e) {} }
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    if (browserInstance) { try { await browserInstance.close(); } catch(e) {} }
    process.exit(0);
  });
}
start();
