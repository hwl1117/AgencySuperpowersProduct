"""
知识库管理服务测试
"""
import pytest
import os
import sys
import tempfile

# 添加backend到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from services.knowledge_base import KnowledgeBaseManager

class TestKnowledgeBaseManager:
    """知识库管理器测试类"""
    
    def setup_method(self):
        """测试前初始化"""
        self.test_dir = tempfile.mkdtemp()
        self.manager = KnowledgeBaseManager(db_path=self.test_dir)
    
    def test_init(self):
        """测试初始化"""
        assert self.manager is not None
        assert self.manager.collection is not None
    
    def test_add_knowledge(self):
        """测试添加知识条目"""
        result = self.manager.add_knowledge(
            video_id=1,
            title="测试视频",
            content="这是测试内容",
            summary="这是测试摘要",
            metadata={
                'category': '科技',
                'tags': ['测试', 'AI'],
                'difficulty_level': 'intermediate',
                'source_url': 'https://example.com',
                'source_platform': 'test',
                'duration': 120
            }
        )
        
        assert result['success'] is True
        assert 'doc_id' in result
    
    def test_search(self):
        """测试搜索功能"""
        # 先添加知识
        self.manager.add_knowledge(
            video_id=2,
            title="人工智能教程",
            content="这是一篇关于人工智能的教程",
            summary="AI基础知识",
            metadata={
                'category': '科技',
                'tags': ['AI', '机器学习'],
                'difficulty_level': 'beginner'
            }
        )
        
        # 搜索
        result = self.manager.search("人工智能")
        
        assert result['success'] is True
        assert len(result['results']) > 0
    
    def test_get_knowledge(self):
        """测试获取知识条目"""
        # 先添加
        self.manager.add_knowledge(
            video_id=3,
            title="获取测试",
            content="测试内容",
            summary="测试摘要",
            metadata={'category': '测试'}
        )
        
        # 获取
        result = self.manager.get_knowledge(3)
        
        assert result is not None
        assert result['metadata']['title'] == "获取测试"
    
    def test_delete_knowledge(self):
        """测试删除知识条目"""
        # 先添加
        self.manager.add_knowledge(
            video_id=4,
            title="删除测试",
            content="测试内容",
            summary="测试摘要",
            metadata={'category': '测试'}
        )
        
        # 删除
        result = self.manager.delete_knowledge(4)
        
        assert result['success'] is True
        
        # 验证已删除
        result = self.manager.get_knowledge(4)
        assert result is None
    
    def test_get_categories(self):
        """测试获取分类"""
        # 添加不同分类的知识
        self.manager.add_knowledge(
            video_id=5,
            title="科技视频",
            content="科技内容",
            summary="科技摘要",
            metadata={'category': '科技'}
        )
        
        self.manager.add_knowledge(
            video_id=6,
            title="教育视频",
            content="教育内容",
            summary="教育摘要",
            metadata={'category': '教育'}
        )
        
        categories = self.manager.get_all_categories()
        
        assert '科技' in categories
        assert '教育' in categories
    
    def test_get_statistics(self):
        """测试获取统计信息"""
        stats = self.manager.get_statistics()
        
        assert 'total_entries' in stats
        assert 'categories' in stats
        assert 'category_count' in stats
        assert 'platform_distribution' in stats
    
    def teardown_method(self):
        """测试后清理"""
        import shutil
        shutil.rmtree(self.test_dir, ignore_errors=True)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])