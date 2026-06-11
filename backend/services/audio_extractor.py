"""
音频提取服务 - 从视频中提取音频
"""
import os
import subprocess
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class AudioExtractor:
    """音频提取器，使用FFmpeg从视频中提取音频"""
    
    def __init__(self, output_dir: str = "./audio"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.ffmpeg_path = self._find_ffmpeg()
    
    def _find_ffmpeg(self) -> str:
        """查找FFmpeg路径"""
        # 尝试常见路径
        possible_paths = [
            'ffmpeg',
            '/usr/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
        ]
        
        for path in possible_paths:
            try:
                subprocess.run([path, '-version'], 
                             capture_output=True, 
                             check=True)
                return path
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue
        
        raise RuntimeError("未找到FFmpeg，请安装FFmpeg")
    
    def extract_audio(self, video_path: str, output_format: str = 'wav') -> dict:
        """从视频中提取音频"""
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"视频文件不存在: {video_path}")
        
        # 生成输出文件名
        video_name = os.path.splitext(os.path.basename(video_path))[0]
        output_path = os.path.join(self.output_dir, f"{video_name}.{output_format}")
        
        # FFmpeg命令
        cmd = [
            self.ffmpeg_path,
            '-i', video_path,
            '-vn',  # 不包含视频
            '-acodec', 'pcm_s16le' if output_format == 'wav' else 'libmp3lame',
            '-ar', '16000',  # 采样率16kHz（适合语音识别）
            '-ac', '1',  # 单声道
            '-y',  # 覆盖输出文件
            output_path
        ]
        
        try:
            logger.info(f"开始提取音频: {video_path}")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                duration = self._get_audio_duration(output_path)
                
                logger.info(f"音频提取成功: {output_path}")
                return {
                    'success': True,
                    'output_path': output_path,
                    'file_size': file_size,
                    'duration': duration,
                    'format': output_format
                }
            else:
                return {
                    'success': False,
                    'error': '音频文件未生成'
                }
                
        except subprocess.CalledProcessError as e:
            logger.error(f"音频提取失败: {e.stderr}")
            return {
                'success': False,
                'error': f"FFmpeg错误: {e.stderr}"
            }
    
    def _get_audio_duration(self, audio_path: str) -> float:
        """获取音频时长"""
        cmd = [
            self.ffmpeg_path,
            '-i', audio_path,
            '-f', 'null',
            '-'
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            # 从stderr中解析时长
            for line in result.stderr.split('\n'):
                if 'Duration' in line:
                    duration_str = line.split('Duration:')[1].split(',')[0].strip()
                    return self._parse_duration(duration_str)
        except Exception:
            pass
        
        return 0.0
    
    def _parse_duration(self, duration_str: str) -> float:
        """解析时长字符串 (HH:MM:SS.ms)"""
        try:
            parts = duration_str.split(':')
            hours = float(parts[0])
            minutes = float(parts[1])
            seconds = float(parts[2])
            return hours * 3600 + minutes * 60 + seconds
        except Exception:
            return 0.0
    
    def extract_key_frames(self, video_path: str, max_frames: int = 10) -> list:
        """提取视频关键帧"""
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"视频文件不存在: {video_path}")
        
        frames_dir = os.path.join(self.output_dir, "frames")
        os.makedirs(frames_dir, exist_ok=True)
        
        video_name = os.path.splitext(os.path.basename(video_path))[0]
        
        # 使用FFmpeg提取关键帧
        cmd = [
            self.ffmpeg_path,
            '-i', video_path,
            '-vf', f'select=eq(pict_type\,I)',  # 只选择I帧（关键帧）
            '-vsync', 'vfr',
            '-frames:v', str(max_frames),
            os.path.join(frames_dir, f"{video_name}_frame_%03d.jpg"),
            '-y'
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, check=True)
            
            # 收集提取的帧
            frames = []
            for i in range(1, max_frames + 1):
                frame_path = os.path.join(frames_dir, f"{video_name}_frame_{i:03d}.jpg")
                if os.path.exists(frame_path):
                    frames.append({
                        'path': frame_path,
                        'index': i,
                        'size': os.path.getsize(frame_path)
                    })
            
            return frames
            
        except subprocess.CalledProcessError as e:
            logger.error(f"关键帧提取失败: {e}")
            return []
    
    def cleanup(self, file_path: str):
        """清理临时文件"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"已清理文件: {file_path}")
        except Exception as e:
            logger.error(f"清理文件失败: {e}")