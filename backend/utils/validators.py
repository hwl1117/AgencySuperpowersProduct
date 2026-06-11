"""
VideoBrain 验证工具
"""
import re
from urllib.parse import urlparse
from typing import Optional, List

# 支持的平台URL模式
PLATFORM_PATTERNS = {
    'douyin': [
        r'douyin\.com',
        r'iesdouyin\.com'
    ],
    'bilibili': [
        r'bilibili\.com',
        r'b23\.tv'
    ],
    'youtube': [
        r'youtube\.com',
        r'youtu\.be'
    ],
    'kuaishou': [
        r'kuaishou\.com',
        r'gifshow\.com'
    ],
    'tiktok': [
        r'tiktok\.com'
    ],
    'xiaohongshu': [
        r'xiaohongshu\.com',
        r'xhslink\.com'
    ]
}

def validate_url(url: str) -> bool:
    """
    验证URL格式
    
    Args:
        url: URL字符串
    
    Returns:
        是否有效
    """
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception:
        return False

def detect_platform(url: str) -> Optional[str]:
    """
    检测视频平台
    
    Args:
        url: 视频URL
    
    Returns:
        平台名称，如果不支持则返回None
    """
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        for platform, patterns in PLATFORM_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, domain):
                    return platform
        return None
    except Exception:
        return None

def validate_video_url(url: str) -> dict:
    """
    验证视频URL
    
    Args:
        url: 视频URL
    
    Returns:
        验证结果字典
    """
    result = {
        'valid': False,
        'platform': None,
        'error': None
    }
    
    # 检查URL格式
    if not validate_url(url):
        result['error'] = '无效的URL格式'
        return result
    
    # 检查平台支持
    platform = detect_platform(url)
    if not platform:
        result['error'] = '不支持的视频平台'
        return result
    
    result['valid'] = True
    result['platform'] = platform
    return result

def validate_language(language: str) -> bool:
    """
    验证语言代码
    
    Args:
        language: 语言代码
    
    Returns:
        是否有效
    """
    supported_languages = [
        'zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'it', 'pt', 'ru',
        'ar', 'hi', 'th', 'vi', 'id', 'ms', 'tr', 'pl', 'nl', 'sv'
    ]
    return language.lower() in supported_languages

def validate_category(category: str) -> bool:
    """
    验证知识分类
    
    Args:
        category: 分类名称
    
    Returns:
        是否有效
    """
    valid_categories = [
        '科技', '教育', '商业', '生活', '娱乐',
        '健康', '艺术', '科学', '历史', '其他'
    ]
    return category in valid_categories

def validate_difficulty(difficulty: str) -> bool:
    """
    验证难度级别
    
    Args:
        difficulty: 难度级别
    
    Returns:
        是否有效
    """
    valid_levels = ['beginner', 'intermediate', 'advanced']
    return difficulty.lower() in valid_levels

def sanitize_text(text: str, max_length: int = 1000) -> str:
    """
    清理文本内容
    
    Args:
        text: 原始文本
        max_length: 最大长度
    
    Returns:
        清理后的文本
    """
    if not text:
        return ''
    
    # 移除多余空白
    text = ' '.join(text.split())
    
    # 截断到最大长度
    if len(text) > max_length:
        text = text[:max_length] + '...'
    
    return text.strip()

def validate_tags(tags: List[str], max_tags: int = 10) -> List[str]:
    """
    验证和清理标签
    
    Args:
        tags: 标签列表
        max_tags: 最大标签数量
    
    Returns:
        清理后的标签列表
    """
    if not tags:
        return []
    
    # 清理每个标签
    cleaned_tags = []
    for tag in tags[:max_tags]:
        if isinstance(tag, str):
            cleaned = tag.strip()
            if cleaned and len(cleaned) <= 50:
                cleaned_tags.append(cleaned)
    
    return cleaned_tags