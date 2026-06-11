"""
VideoBrain 配置文件
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """应用配置"""
    
    # 应用配置
    APP_NAME: str = "VideoBrain"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # API配置
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # 数据库配置
    DATABASE_URL: str = "sqlite:///./videobrain.db"
    
    # Redis配置
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # OpenAI配置
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4"
    WHISPER_MODEL: str = "whisper-1"
    
    # 文件存储配置
    DOWNLOAD_DIR: str = "./downloads"
    AUDIO_DIR: str = "./audio"
    KNOWLEDGE_BASE_DIR: str = "./knowledge_base_db"
    TEMP_DIR: str = "./temp"
    
    # 视频处理配置
    MAX_VIDEO_DURATION: int = 600  # 最大视频时长（秒）
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 最大文件大小（字节）
    VIDEO_QUALITY: str = "720p"  # 视频质量
    
    # 音频处理配置
    AUDIO_FORMAT: str = "wav"
    AUDIO_SAMPLE_RATE: int = 16000
    AUDIO_CHANNELS: int = 1
    
    # AI概括配置
    MAX_SUMMARY_LENGTH: int = 500
    MAX_KEY_POINTS: int = 10
    MAX_TAGS: int = 10
    
    # 知识库配置
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    # 支持的平台
    SUPPORTED_PLATFORMS: list = [
        "douyin",
        "kuaishou",
        "bilibili",
        "youtube",
        "tiktok",
        "xiaohongshu"
    ]
    
    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"
    
    # CORS配置
    CORS_ORIGINS: list = ["*"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# 创建全局配置实例
settings = Settings()

# 确保目录存在
os.makedirs(settings.DOWNLOAD_DIR, exist_ok=True)
os.makedirs(settings.AUDIO_DIR, exist_ok=True)
os.makedirs(settings.KNOWLEDGE_BASE_DIR, exist_ok=True)
os.makedirs(settings.TEMP_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)