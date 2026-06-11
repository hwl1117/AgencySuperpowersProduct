"""
VideoBrain 自定义异常
"""

class VideoBrainException(Exception):
    """VideoBrain 基础异常"""
    
    def __init__(self, message: str = "发生未知错误", code: str = "UNKNOWN_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)

class VideoDownloadError(VideoBrainException):
    """视频下载错误"""
    
    def __init__(self, message: str = "视频下载失败", url: str = None):
        self.url = url
        super().__init__(message, "VIDEO_DOWNLOAD_ERROR")

class AudioExtractionError(VideoBrainException):
    """音频提取错误"""
    
    def __init__(self, message: str = "音频提取失败"):
        super().__init__(message, "AUDIO_EXTRACTION_ERROR")

class TranscriptionError(VideoBrainException):
    """语音转文字错误"""
    
    def __init__(self, message: str = "语音转文字失败"):
        super().__init__(message, "TRANSCRIPTION_ERROR")

class VisualAnalysisError(VideoBrainException):
    """视觉分析错误"""
    
    def __init__(self, message: str = "视觉分析失败"):
        super().__init__(message, "VISUAL_ANALYSIS_ERROR")

class AISummaryError(VideoBrainException):
    """AI概括错误"""
    
    def __init__(self, message: str = "AI概括失败"):
        super().__init__(message, "AI_SUMMARY_ERROR")

class KnowledgeBaseError(VideoBrainException):
    """知识库错误"""
    
    def __init__(self, message: str = "知识库操作失败"):
        super().__init__(message, "KNOWLEDGE_BASE_ERROR")

class UnsupportedPlatformError(VideoBrainException):
    """不支持的平台错误"""
    
    def __init__(self, platform: str = None):
        message = f"不支持的视频平台: {platform}" if platform else "不支持的视频平台"
        super().__init__(message, "UNSUPPORTED_PLATFORM")

class InvalidURLError(VideoBrainException):
    """无效URL错误"""
    
    def __init__(self, url: str = None):
        message = f"无效的URL: {url}" if url else "无效的URL"
        super().__init__(message, "INVALID_URL")

class RateLimitError(VideoBrainException):
    """速率限制错误"""
    
    def __init__(self, message: str = "请求过于频繁，请稍后重试"):
        super().__init__(message, "RATE_LIMIT_ERROR")

class APIKeyError(VideoBrainException):
    """API密钥错误"""
    
    def __init__(self, message: str = "API密钥无效或未设置"):
        super().__init__(message, "API_KEY_ERROR")

class FileTooLargeError(VideoBrainException):
    """文件过大错误"""
    
    def __init__(self, max_size: int = None):
        message = f"文件大小超过限制" + (f"（最大 {max_size}MB）" if max_size else "")
        super().__init__(message, "FILE_TOO_LARGE")

class VideoTooLongError(VideoBrainException):
    """视频过长错误"""
    
    def __init__(self, max_duration: int = None):
        message = f"视频时长超过限制" + (f"（最大 {max_duration}秒）" if max_duration else "")
        super().__init__(message, "VIDEO_TOO_LONG")

class ProcessingTimeoutError(VideoBrainException):
    """处理超时错误"""
    
    def __init__(self, message: str = "处理超时，请稍后重试"):
        super().__init__(message, "PROCESSING_TIMEOUT")