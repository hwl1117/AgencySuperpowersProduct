"""
视觉分析服务 - 分析视频关键帧内容
"""
import os
import base64
import logging
from typing import List, Dict, Optional
from openai import OpenAI
from PIL import Image
import io

logger = logging.getLogger(__name__)

class VisualAnalyzer:
    """视觉分析器，使用GPT-4V分析视频关键帧"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("未设置OpenAI API Key")
        
        self.client = OpenAI(api_key=self.api_key)
    
    def analyze_frame(self, image_path: str, context: str = "") -> Dict:
        """分析单个关键帧"""
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"图片文件不存在: {image_path}")
        
        try:
            # 读取并编码图片
            with open(image_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
            
            # 构建提示词
            prompt = """请分析这张图片的内容，包括：
1. 主要内容描述
2. 识别出的文字（如果有）
3. 关键信息提取
4. 场景/环境描述
5. 人物/物体识别

请用中文回答，格式清晰。"""
            
            if context:
                prompt = f"上下文信息：{context}\n\n{prompt}"
            
            response = self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            analysis = response.choices[0].message.content
            
            return {
                'success': True,
                'analysis': analysis,
                'image_path': image_path
            }
            
        except Exception as e:
            logger.error(f"图片分析失败: {e}")
            return {
                'success': False,
                'error': str(e),
                'image_path': image_path
            }
    
    def analyze_video_frames(self, frame_paths: List[str], video_title: str = "") -> Dict:
        """分析多个关键帧，生成视频内容概述"""
        if not frame_paths:
            return {
                'success': False,
                'error': '没有提供关键帧'
            }
        
        analyses = []
        for i, frame_path in enumerate(frame_paths[:5]):  # 最多分析5帧
            logger.info(f"分析关键帧 {i+1}/{min(len(frame_paths), 5)}")
            
            context = f"视频标题：{video_title}" if video_title else ""
            result = self.analyze_frame(frame_path, context)
            
            if result['success']:
                analyses.append({
                    'frame_index': i,
                    'analysis': result['analysis']
                })
        
        if not analyses:
            return {
                'success': False,
                'error': '所有关键帧分析失败'
            }
        
        # 生成综合分析
        combined_analysis = self._combine_analyses(analyses, video_title)
        
        return {
            'success': True,
            'frame_analyses': analyses,
            'combined_analysis': combined_analysis,
            'frame_count': len(analyses)
        }
    
    def _combine_analyses(self, analyses: List[Dict], video_title: str = "") -> str:
        """合并多个关键帧的分析结果"""
        analyses_text = "\n\n".join([
            f"关键帧 {a['frame_index']+1}:\n{a['analysis']}"
            for a in analyses
        ])
        
        prompt = f"""基于以下视频关键帧的分析结果，请生成一个完整的视频内容概述：

视频标题：{video_title or '未知'}

关键帧分析：
{analyses_text}

请生成：
1. 视频主要内容概述（200字以内）
2. 关键视觉元素列表
3. 视频可能的主题/分类
4. 重要的文字/图表信息

请用中文回答，结构清晰。"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "你是一个专业的视频内容分析师，擅长从关键帧中提取和总结信息。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"生成综合分析失败: {e}")
            return f"综合分析生成失败: {str(e)}"
    
    def extract_text_from_frames(self, frame_paths: List[str]) -> List[Dict]:
        """从关键帧中提取文字（OCR）"""
        results = []
        
        for i, frame_path in enumerate(frame_paths):
            try:
                result = self.analyze_frame(
                    frame_path, 
                    "请只识别并提取这张图片中的所有文字内容，不要描述图片。"
                )
                
                if result['success']:
                    results.append({
                        'frame_index': i,
                        'extracted_text': result['analysis'],
                        'frame_path': frame_path
                    })
            except Exception as e:
                logger.error(f"文字提取失败 (帧 {i}): {e}")
        
        return results
    
    def generate_thumbnail_description(self, image_path: str) -> str:
        """生成缩略图描述"""
        try:
            result = self.analyze_frame(
                image_path,
                "请用一句话描述这张图片的主要内容，用于视频封面说明。"
            )
            return result.get('analysis', '无法生成描述')
        except Exception:
            return '无法生成描述'