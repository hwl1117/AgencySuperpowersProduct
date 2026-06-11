"""
VideoBrain 文件工具
"""
import os
import shutil
import hashlib
from typing import Optional, List
from datetime import datetime

def ensure_directory(path: str) -> str:
    """
    确保目录存在
    
    Args:
        path: 目录路径
    
    Returns:
        目录路径
    """
    os.makedirs(path, exist_ok=True)
    return path

def get_file_size(file_path: str) -> int:
    """
    获取文件大小
    
    Args:
        file_path: 文件路径
    
    Returns:
        文件大小（字节）
    """
    if os.path.exists(file_path):
        return os.path.getsize(file_path)
    return 0

def format_file_size(size_bytes: int) -> str:
    """
    格式化文件大小
    
    Args:
        size_bytes: 文件大小（字节）
    
    Returns:
        格式化后的字符串
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"

def get_file_extension(file_path: str) -> str:
    """
    获取文件扩展名
    
    Args:
        file_path: 文件路径
    
    Returns:
        文件扩展名
    """
    _, ext = os.path.splitext(file_path)
    return ext.lower()

def is_video_file(file_path: str) -> bool:
    """
    检查是否为视频文件
    
    Args:
        file_path: 文件路径
    
    Returns:
        是否为视频文件
    """
    video_extensions = ['.mp4', '.webm', '.mkv', '.avi', '.mov', '.flv', '.wmv']
    return get_file_extension(file_path) in video_extensions

def is_audio_file(file_path: str) -> bool:
    """
    检查是否为音频文件
    
    Args:
        file_path: 文件路径
    
    Returns:
        是否为音频文件
    """
    audio_extensions = ['.mp3', '.wav', '.m4a', '.flac', '.aac', '.ogg']
    return get_file_extension(file_path) in audio_extensions

def calculate_file_hash(file_path: str, algorithm: str = 'md5') -> str:
    """
    计算文件哈希值
    
    Args:
        file_path: 文件路径
        algorithm: 哈希算法
    
    Returns:
        文件哈希值
    """
    hash_func = hashlib.new(algorithm)
    
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            hash_func.update(chunk)
    
    return hash_func.hexdigest()

def cleanup_directory(directory: str, keep_files: int = 0) -> int:
    """
    清理目录中的旧文件
    
    Args:
        directory: 目录路径
        keep_files: 保留的文件数量
    
    Returns:
        删除的文件数量
    """
    if not os.path.exists(directory):
        return 0
    
    files = []
    for f in os.listdir(directory):
        file_path = os.path.join(directory, f)
        if os.path.isfile(file_path):
            files.append((file_path, os.path.getmtime(file_path)))
    
    # 按修改时间排序
    files.sort(key=lambda x: x[1], reverse=True)
    
    # 删除多余的文件
    deleted_count = 0
    for file_path, _ in files[keep_files:]:
        try:
            os.remove(file_path)
            deleted_count += 1
        except Exception:
            pass
    
    return deleted_count

def get_unique_filename(directory: str, filename: str) -> str:
    """
    获取唯一文件名
    
    Args:
        directory: 目录路径
        filename: 原始文件名
    
    Returns:
        唯一文件名
    """
    name, ext = os.path.splitext(filename)
    counter = 1
    new_filename = filename
    
    while os.path.exists(os.path.join(directory, new_filename)):
        new_filename = f"{name}_{counter}{ext}"
        counter += 1
    
    return new_filename

def copy_file(src: str, dst: str) -> bool:
    """
    复制文件
    
    Args:
        src: 源文件路径
        dst: 目标文件路径
    
    Returns:
        是否成功
    """
    try:
        shutil.copy2(src, dst)
        return True
    except Exception:
        return False

def move_file(src: str, dst: str) -> bool:
    """
    移动文件
    
    Args:
        src: 源文件路径
        dst: 目标文件路径
    
    Returns:
        是否成功
    """
    try:
        shutil.move(src, dst)
        return True
    except Exception:
        return False

def delete_file(file_path: str) -> bool:
    """
    删除文件
    
    Args:
        file_path: 文件路径
    
    Returns:
        是否成功
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False

def list_files(directory: str, extensions: Optional[List[str]] = None) -> List[str]:
    """
    列出目录中的文件
    
    Args:
        directory: 目录路径
        extensions: 文件扩展名过滤器
    
    Returns:
        文件路径列表
    """
    if not os.path.exists(directory):
        return []
    
    files = []
    for f in os.listdir(directory):
        file_path = os.path.join(directory, f)
        if os.path.isfile(file_path):
            if extensions is None or get_file_extension(file_path) in extensions:
                files.append(file_path)
    
    return sorted(files)