"""
语音转文字服务 - 使用OpenAI Whisper进行语音识别
"""
import os
import logging
from typing import Optional, List, Dict
from openai import OpenAI

logger = logging.getLogger(__name__)

class SpeechToTextService:
    """语音转文字服务"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("未设置OpenAI API Key")
        
        self.client = OpenAI(api_key=self.api_key)
        self.supported_formats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm']
    
    def transcribe_audio(self, audio_path: str, language: str = 'zh') -> Dict:
        """转录音频文件"""
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"音频文件不存在: {audio_path}")
        
        # 检查文件格式
        file_ext = os.path.splitext(audio_path)[1].lower()
        if file_ext not in self.supported_formats:
            raise ValueError(f"不支持的音频格式: {file_ext}")
        
        # 检查文件大小（Whisper API限制25MB）
        file_size = os.path.getsize(audio_path)
        if file_size > 25 * 1024 * 1024:
            return self._transcribe_large_file(audio_path, language)
        
        try:
            logger.info(f"开始转录音频: {audio_path}")
            
            with open(audio_path, "rb") as audio_file:
                response = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )
            
            # 解析结果
            segments = []
            if hasattr(response, 'segments'):
                for seg in response.segments:
                    segments.append({
                        'start': seg.start,
                        'end': seg.end,
                        'text': seg.text
                    })
            
            result = {
                'success': True,
                'text': response.text,
                'language': response.language,
                'duration': response.duration,
                'segments': segments,
                'word_count': len(response.text.split())
            }
            
            logger.info(f"转录完成，时长: {response.duration:.1f}秒，字数: {result['word_count']}")
            return result
            
        except Exception as e:
            logger.error(f"转录失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _transcribe_large_file(self, audio_path: str, language: str) -> Dict:
        """转录大文件（分片处理）"""
        import subprocess
        import tempfile

        chunk_duration = 600  # 10分钟每片，保持在 Whisper 25MB 限制内

        # 使用唯一临时目录避免并发竞态
        temp_dir = tempfile.mkdtemp(prefix="videobrain_whisper_")
        
        try:
            # 获取音频时长
            duration = self._get_audio_duration(audio_path)
            if duration <= 0:
                raise ValueError("无法获取音频时长")
            
            # 分割音频
            chunks = []
            for i, start in enumerate(range(0, int(duration), chunk_duration)):
                chunk_path = os.path.join(temp_dir, f"chunk_{i:03d}.wav")
                
                cmd = [
                    'ffmpeg',
                    '-i', audio_path,
                    '-ss', str(start),
                    '-t', str(chunk_duration),
                    '-acodec', 'pcm_s16le',
                    '-ar', '16000',
                    '-ac', '1',
                    '-y',
                    chunk_path
                ]
                
                subprocess.run(cmd, capture_output=True, check=True)
                if os.path.exists(chunk_path):
                    chunks.append(chunk_path)
            
            # 逐个转录片段
            all_text = []
            all_segments = []
            offset = 0.0
            
            for chunk_path in chunks:
                result = self.transcribe_audio(chunk_path, language)
                if result['success']:
                    all_text.append(result['text'])
                    
                    # 调整时间戳
                    for seg in result.get('segments', []):
                        all_segments.append({
                            'start': seg['start'] + offset,
                            'end': seg['end'] + offset,
                            'text': seg['text']
                        })
                    
                    offset += result.get('duration', chunk_duration)
                
                # 清理临时文件
                os.remove(chunk_path)
            
            return {
                'success': True,
                'text': ' '.join(all_text),
                'language': language,
                'duration': duration,
                'segments': all_segments,
                'word_count': sum(len(text.split()) for text in all_text)
            }
            
        except Exception as e:
            logger.error(f"大文件转录失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            # 清理临时目录
            import shutil
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
    
    def _get_audio_duration(self, audio_path: str) -> float:
        """获取音频时长"""
        import subprocess
        
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            audio_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            return float(result.stdout.strip())
        except Exception:
            return 0.0
    
    def translate_audio(self, audio_path: str, target_language: str = 'zh') -> Dict:
        """翻译音频内容"""
        try:
            with open(audio_path, "rb") as audio_file:
                response = self.client.audio.translations.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json"
                )
            
            return {
                'success': True,
                'text': response.text,
                'language': target_language
            }
            
        except Exception as e:
            logger.error(f"翻译失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }