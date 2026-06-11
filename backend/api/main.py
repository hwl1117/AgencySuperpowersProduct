"""
VideoBrain 主API服务
"""
import os
import logging
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from sqlalchemy.orm import Session

from models.database import init_db, get_db, Video, KnowledgeEntry
from services.video_downloader import VideoDownloader
from services.audio_extractor import AudioExtractor
from services.speech_to_text import SpeechToTextService
from services.visual_analyzer import VisualAnalyzer
from services.ai_summarizer import AISummarizer
from services.knowledge_base import KnowledgeBaseManager

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 初始化FastAPI应用
app = FastAPI(
    title="VideoBrain API",
    description="短视频智能知识库系统",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化服务
video_downloader = VideoDownloader()
audio_extractor = AudioExtractor()
speech_to_text = SpeechToTextService()
visual_analyzer = VisualAnalyzer()
ai_summarizer = AISummarizer()
knowledge_base = KnowledgeBaseManager()

# 数据模型
class VideoURLRequest(BaseModel):
    url: str
    language: Optional[str] = "zh"

class SearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    difficulty: Optional[str] = None
    limit: Optional[int] = 10

class ProcessingStatus(BaseModel):
    video_id: int
    status: str
    progress: int
    message: str

# 启动事件
@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    init_db()
    logger.info("VideoBrain API 启动完成")

# 健康检查
@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "service": "VideoBrain API",
        "timestamp": datetime.utcnow().isoformat()
    }

# 视频处理接口
@app.post("/api/videos/process")
async def process_video(request: VideoURLRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """处理视频链接"""
    try:
        # 验证URL
        platform = video_downloader.detect_platform(request.url)
        if not platform:
            raise HTTPException(status_code=400, detail="不支持的视频平台")
        
        # 检查是否已处理过
        existing_video = db.query(Video).filter(Video.url == request.url).first()
        if existing_video:
            if existing_video.status == "completed":
                return {
                    "video_id": existing_video.id,
                    "status": "completed",
                    "message": "视频已处理完成"
                }
            elif existing_video.status in ["pending", "downloading", "processing"]:
                return {
                    "video_id": existing_video.id,
                    "status": existing_video.status,
                    "message": "视频正在处理中"
                }
        
        # 获取视频信息
        video_info = video_downloader.get_video_info(request.url)
        
        # 创建视频记录
        video = Video(
            url=request.url,
            platform=platform,
            title=video_info.get('title', ''),
            description=video_info.get('description', ''),
            duration=video_info.get('duration', 0),
            thumbnail_url=video_info.get('thumbnail', ''),
            status="pending",
            progress=0
        )
        db.add(video)
        db.commit()
        db.refresh(video)
        
        # 后台处理任务
        background_tasks.add_task(
            process_video_pipeline,
            video.id,
            request.url,
            request.language,
            platform
        )
        
        return {
            "video_id": video.id,
            "status": "pending",
            "message": "视频处理任务已创建"
        }
        
    except Exception as e:
        logger.error(f"处理视频失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_video_pipeline(video_id: int, url: str, language: str, platform: str):
    """视频处理流水线"""
    from models.database import SessionLocal
    
    db = SessionLocal()
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            return
        
        # 更新状态为下载中
        video.status = "downloading"
        video.progress = 10
        db.commit()
        
        # 1. 下载视频
        logger.info(f"开始下载视频: {url}")
        download_result = video_downloader.download_video(url)
        
        if not download_result['success']:
            video.status = "failed"
            video.error_message = f"下载失败: {download_result.get('error', '未知错误')}"
            db.commit()
            return
        
        video_path = download_result['file_path']
        video.progress = 30
        db.commit()
        
        # 2. 提取音频
        logger.info("开始提取音频")
        video.status = "processing"
        audio_result = audio_extractor.extract_audio(video_path)
        
        if not audio_result['success']:
            video.status = "failed"
            video.error_message = f"音频提取失败: {audio_result.get('error', '未知错误')}"
            db.commit()
            video_downloader.cleanup(video_path)
            return
        
        audio_path = audio_result['output_path']
        video.progress = 50
        db.commit()
        
        # 3. 语音转文字
        logger.info("开始语音转文字")
        transcript_result = speech_to_text.transcribe_audio(audio_path, language)
        
        if transcript_result['success']:
            video.transcript = transcript_result['text']
        
        video.progress = 70
        db.commit()
        
        # 4. 视觉分析
        logger.info("开始视觉分析")
        frames = audio_extractor.extract_key_frames(video_path)
        
        if frames:
            frame_paths = [f['path'] for f in frames]
            visual_result = visual_analyzer.analyze_video_frames(frame_paths, video.title)
            
            if visual_result['success']:
                video.key_frames = [{'path': f['path'], 'index': f['index']} for f in frames]
                video.visual_analysis = visual_result['combined_analysis']
        
        video.progress = 85
        db.commit()
        
        # 5. AI概括
        logger.info("开始AI概括")
        if video.transcript:
            summary_result = ai_summarizer.generate_knowledge_entry(
                video_data={
                    'title': video.title,
                    'description': video.description,
                    'url': url,
                    'platform': platform,
                    'duration': video.duration
                },
                transcript=video.transcript,
                visual_analysis=video.visual_analysis or ''
            )
            
            if summary_result['success']:
                entry_data = summary_result['knowledge_entry']
                
                video.summary = entry_data.get('summary', '')
                video.key_points = entry_data.get('key_points', [])
                video.tags = entry_data.get('tags', [])
                video.category = entry_data.get('category', '')
                
                # 6. 存入知识库
                logger.info("存入知识库")
                kb_result = knowledge_base.add_knowledge(
                    video_id=video_id,
                    title=video.title,
                    content=entry_data.get('content', ''),
                    summary=entry_data.get('summary', ''),
                    metadata={
                        'category': entry_data.get('category', ''),
                        'tags': entry_data.get('tags', []),
                        'difficulty_level': entry_data.get('difficulty_level', 'intermediate'),
                        'source_url': url,
                        'source_platform': platform,
                        'duration': video.duration,
                        'created_at': datetime.utcnow().isoformat()
                    }
                )
                
                if kb_result['success']:
                    # 创建知识库条目记录
                    knowledge_entry = KnowledgeEntry(
                        video_id=video_id,
                        title=video.title,
                        content=entry_data.get('content', ''),
                        summary=entry_data.get('summary', ''),
                        key_insights=entry_data.get('key_insights', []),
                        category=entry_data.get('category', ''),
                        tags=entry_data.get('tags', []),
                        difficulty_level=entry_data.get('difficulty_level', 'intermediate'),
                        embedding_id=kb_result['doc_id'],
                        source_url=url
                    )
                    db.add(knowledge_entry)
        
        # 更新完成状态
        video.status = "completed"
        video.progress = 100
        video.processed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"视频处理完成: {video_id}")
        
        # 清理临时文件
        audio_extractor.cleanup(audio_path)
        video_downloader.cleanup(video_path)
        
    except Exception as e:
        logger.error(f"处理流水线失败: {e}")
        video = db.query(Video).filter(Video.id == video_id).first()
        if video:
            video.status = "failed"
            video.error_message = str(e)
            db.commit()
    finally:
        db.close()

# 查询接口
@app.get("/api/videos/{video_id}")
async def get_video(video_id: int, db: Session = Depends(get_db)):
    """获取视频信息"""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="视频不存在")
    
    return {
        "id": video.id,
        "url": video.url,
        "platform": video.platform,
        "title": video.title,
        "description": video.description,
        "duration": video.duration,
        "status": video.status,
        "progress": video.progress,
        "transcript": video.transcript,
        "summary": video.summary,
        "key_points": video.key_points,
        "tags": video.tags,
        "category": video.category,
        "created_at": video.created_at,
        "processed_at": video.processed_at
    }

@app.get("/api/videos")
async def list_videos(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    platform: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """获取视频列表"""
    query = db.query(Video)
    
    if status:
        query = query.filter(Video.status == status)
    if platform:
        query = query.filter(Video.platform == platform)
    
    total = query.count()
    videos = query.order_by(Video.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "videos": [
            {
                "id": v.id,
                "title": v.title,
                "platform": v.platform,
                "status": v.status,
                "category": v.category,
                "created_at": v.created_at
            }
            for v in videos
        ]
    }

# 知识库搜索接口
@app.post("/api/knowledge/search")
async def search_knowledge(request: SearchRequest):
    """搜索知识库"""
    result = knowledge_base.search(
        query=request.query,
        n_results=request.limit,
        category=request.category,
        difficulty=request.difficulty
    )
    
    if not result['success']:
        raise HTTPException(status_code=500, detail=result.get('error', '搜索失败'))
    
    return result

@app.get("/api/knowledge/{video_id}")
async def get_knowledge_entry(video_id: int):
    """获取知识库条目"""
    entry = knowledge_base.get_knowledge(video_id)
    if not entry:
        raise HTTPException(status_code=404, detail="知识条目不存在")
    return entry

@app.get("/api/knowledge/categories/list")
async def list_categories():
    """获取所有分类"""
    categories = knowledge_base.get_all_categories()
    return {"categories": categories}

@app.get("/api/knowledge/stats")
async def get_statistics():
    """获取知识库统计"""
    return knowledge_base.get_statistics()

# 批量处理接口
@app.post("/api/videos/batch")
async def batch_process_videos(urls: List[str], background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """批量处理视频"""
    results = []
    
    for url in urls:
        try:
            platform = video_downloader.detect_platform(url)
            if not platform:
                results.append({"url": url, "status": "error", "message": "不支持的平台"})
                continue
            
            # 检查是否已存在
            existing = db.query(Video).filter(Video.url == url).first()
            if existing:
                results.append({"url": url, "video_id": existing.id, "status": existing.status})
                continue
            
            # 创建记录
            video = Video(url=url, platform=platform, status="pending")
            db.add(video)
            db.commit()
            db.refresh(video)
            
            # 添加后台任务
            background_tasks.add_task(process_video_pipeline, video.id, url, "zh", platform)
            
            results.append({"url": url, "video_id": video.id, "status": "pending"})
            
        except Exception as e:
            results.append({"url": url, "status": "error", "message": str(e)})
    
    return {"results": results, "total": len(urls)}

# 导出接口
@app.get("/api/knowledge/export")
async def export_knowledge(format: str = "json"):
    """导出知识库"""
    result = knowledge_base.export_knowledge(format)
    if not result['success']:
        raise HTTPException(status_code=500, detail=result.get('error', '导出失败'))
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)