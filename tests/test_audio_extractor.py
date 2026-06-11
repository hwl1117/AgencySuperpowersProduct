"""
音频提取服务测试
"""
import pytest
import os
import sys
import tempfile

# 添加backend到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from services.audio_extractor import AudioExtractor

class TestAudioExtractor:
    """音频提取器测试类"""
    
    def setup_method(self):
        """测试前初始化"""
        self.extractor = AudioExtractor(output_dir="./test_audio")
    
    def test_init(self):
        """测试初始化"""
        assert self.extractor is not None
        assert os.path.exists(self.extractor.output_dir)
    
    def test_find_ffmpeg(self):
        """测试FFmpeg查找"""
        try:
            ffmpeg_path = self.extractor._find_ffmpeg()
            assert ffmpeg_path is not None
            assert len(ffmpeg_path) > 0
        except RuntimeError:
            pytest.skip("FFmpeg未安装")
    
    def test_parse_duration(self):
        """测试时长解析"""
        # 测试正常格式
        assert self.extractor._parse_duration("00:01:30.50") == 90.5
        assert self.extractor._parse_duration("01:00:00.00") == 3600.0
        assert self.extractor._parse_duration("00:00:05.00") == 5.0
        
        # 测试异常格式
        assert self.extractor._parse_duration("invalid") == 0.0
    
    def test_extract_audio_file_not_found(self):
        """测试文件不存在"""
        with pytest.raises(FileNotFoundError):
            self.extractor.extract_audio("nonexistent.mp4")
    
    def test_extract_key_frames_file_not_found(self):
        """测试关键帧提取文件不存在"""
        with pytest.raises(FileNotFoundError):
            self.extractor.extract_key_frames("nonexistent.mp4")
    
    def teardown_method(self):
        """测试后清理"""
        import shutil
        if os.path.exists("./test_audio"):
            shutil.rmtree("./test_audio")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])