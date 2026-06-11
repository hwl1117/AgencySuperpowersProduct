"""
视频下载服务测试
"""
import pytest
import os
import sys

# 添加backend到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from services.video_downloader import VideoDownloader

class TestVideoDownloader:
    """视频下载器测试类"""
    
    def setup_method(self):
        """测试前初始化"""
        self.downloader = VideoDownloader(output_dir="./test_downloads")
    
    def test_detect_platform_douyin(self):
        """测试抖音平台检测"""
        url = "https://www.douyin.com/video/1234567890"
        platform = self.downloader.detect_platform(url)
        assert platform == "douyin"
    
    def test_detect_platform_bilibili(self):
        """测试B站平台检测"""
        url = "https://www.bilibili.com/video/BV1xx411c7mD"
        platform = self.downloader.detect_platform(url)
        assert platform == "bilibili"
    
    def test_detect_platform_youtube(self):
        """测试YouTube平台检测"""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        platform = self.downloader.detect_platform(url)
        assert platform == "youtube"
    
    def test_detect_platform_kuaishou(self):
        """测试快手平台检测"""
        url = "https://www.kuaishou.com/f/xxx"
        platform = self.downloader.detect_platform(url)
        assert platform == "kuaishou"
    
    def test_detect_platform_tiktok(self):
        """测试TikTok平台检测"""
        url = "https://www.tiktok.com/@user/video/1234567890"
        platform = self.downloader.detect_platform(url)
        assert platform == "tiktok"
    
    def test_detect_platform_xiaohongshu(self):
        """测试小红书平台检测"""
        url = "https://www.xiaohongshu.com/explore/1234567890"
        platform = self.downloader.detect_platform(url)
        assert platform == "xiaohongshu"
    
    def test_detect_platform_unsupported(self):
        """测试不支持的平台"""
        url = "https://www.example.com/video/123"
        platform = self.downloader.detect_platform(url)
        assert platform is None
    
    def test_extract_video_id_douyin(self):
        """测试抖音视频ID提取"""
        url = "https://www.douyin.com/video/1234567890"
        video_id = self.downloader._extract_video_id(url, "douyin")
        assert video_id == "1234567890"
    
    def test_extract_video_id_bilibili(self):
        """测试B站视频ID提取"""
        url = "https://www.bilibili.com/video/BV1xx411c7mD"
        video_id = self.downloader._extract_video_id(url, "bilibili")
        assert video_id == "BV1xx411c7mD"
    
    def test_extract_video_id_youtube(self):
        """测试YouTube视频ID提取"""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        video_id = self.downloader._extract_video_id(url, "youtube")
        assert video_id == "dQw4w9WgXcQ"
    
    def teardown_method(self):
        """测试后清理"""
        import shutil
        if os.path.exists("./test_downloads"):
            shutil.rmtree("./test_downloads")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])