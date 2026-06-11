"""
AI概括服务 - 使用GPT-4进行内容概括和优化
"""
import os
import json
import logging
from typing import Dict, List, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)

class AISummarizer:
    """AI概括器，将视频内容转化为结构化知识"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("未设置OpenAI API Key")
        
        self.client = OpenAI(api_key=self.api_key)
    
    def summarize_video_content(self, 
                               transcript: str, 
                               visual_analysis: str,
                               video_title: str = "",
                               video_description: str = "") -> Dict:
        """概括视频内容"""
        
        prompt = f"""请基于以下视频信息，生成一个结构化的知识摘要：

视频标题：{video_title}
视频描述：{video_description}

语音内容：
{transcript[:3000]}  # 限制长度

视觉分析：
{visual_analysis[:2000]}

请生成以下内容（JSON格式）：
{{
    "summary": "200字以内的内容摘要",
    "key_points": ["关键点1", "关键点2", ...],
    "main_topics": ["主题1", "主题2", ...],
    "action_items": ["可执行的建议1", ...],
    "knowledge_tags": ["标签1", "标签2", ...],
    "difficulty_level": "beginner/intermediate/advanced",
    "category": "分类（如：科技、教育、生活、商业等）",
    "target_audience": "目标受众",
    "key_insights": ["核心洞察1", "核心洞察2", ...]
}}

请确保输出是有效的JSON格式。"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "你是一个专业的知识管理专家，擅长从视频内容中提取和结构化知识。请始终返回有效的JSON格式。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.3
            )
            
            result_text = response.choices[0].message.content
            
            # 尝试解析JSON
            try:
                result = json.loads(result_text)
            except json.JSONDecodeError:
                # 如果JSON解析失败，尝试提取JSON部分
                import re
                json_match = re.search(r'\{[\s\S]*\}', result_text)
                if json_match:
                    result = json.loads(json_match.group())
                else:
                    raise ValueError("无法解析AI返回的JSON")
            
            return {
                'success': True,
                'data': result,
                'tokens_used': response.usage.total_tokens
            }
            
        except Exception as e:
            logger.error(f"内容概括失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_knowledge_entry(self, 
                                video_data: Dict,
                                transcript: str,
                                visual_analysis: str) -> Dict:
        """生成知识库条目"""
        
        # 先进行内容概括
        summary_result = self.summarize_video_content(
            transcript=transcript,
            visual_analysis=visual_analysis,
            video_title=video_data.get('title', ''),
            video_description=video_data.get('description', '')
        )
        
        if not summary_result['success']:
            return summary_result
        
        summary_data = summary_result['data']
        
        # 生成详细的知识内容
        knowledge_content = self._generate_detailed_content(
            transcript=transcript,
            summary_data=summary_data,
            video_title=video_data.get('title', '')
        )
        
        return {
            'success': True,
            'knowledge_entry': {
                'title': video_data.get('title', '未命名视频'),
                'content': knowledge_content,
                'summary': summary_data.get('summary', ''),
                'key_points': summary_data.get('key_points', []),
                'tags': summary_data.get('knowledge_tags', []),
                'category': summary_data.get('category', '其他'),
                'difficulty_level': summary_data.get('difficulty_level', 'intermediate'),
                'target_audience': summary_data.get('target_audience', ''),
                'key_insights': summary_data.get('key_insights', []),
                'action_items': summary_data.get('action_items', []),
                'source_url': video_data.get('url', ''),
                'source_platform': video_data.get('platform', ''),
                'duration': video_data.get('duration', 0)
            }
        }
    
    def _generate_detailed_content(self, 
                                  transcript: str, 
                                  summary_data: Dict,
                                  video_title: str) -> str:
        """生成详细的知识内容"""
        
        prompt = f"""基于以下信息，生成一个详细的知识文档：

视频标题：{video_title}
摘要：{summary_data.get('summary', '')}
关键点：{', '.join(summary_data.get('key_points', []))}
核心洞察：{', '.join(summary_data.get('key_insights', []))}

原始内容（节选）：
{transcript[:2000]}

请生成一个结构化的知识文档，包括：
1. 概述
2. 核心内容详解
3. 关键要点
4. 实践建议
5. 延伸思考

请用Markdown格式，内容清晰易读。"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "你是一个专业的知识管理专家，擅长将视频内容转化为高质量的知识文档。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=3000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"生成详细内容失败: {e}")
            return f"内容生成失败: {str(e)}"
    
    def generate_search_keywords(self, content: str) -> List[str]:
        """生成搜索关键词"""
        prompt = f"""请从以下内容中提取5-10个搜索关键词，用于知识库检索：

{content[:1000]}

请返回JSON数组格式：["关键词1", "关键词2", ...]"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            result = response.choices[0].message.content
            import re
            json_match = re.search(r'\[.*\]', result, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            return []
            
        except Exception as e:
            logger.error(f"生成关键词失败: {e}")
            return []
    
    def categorize_content(self, content: str) -> Dict:
        """对内容进行分类"""
        categories = [
            "科技", "教育", "商业", "生活", "娱乐", 
            "健康", "艺术", "科学", "历史", "其他"
        ]
        
        prompt = f"""请将以下内容分类到最合适的类别中：

{content[:500]}

可选类别：{', '.join(categories)}

请返回JSON格式：
{{"primary_category": "主分类", "secondary_categories": ["次分类1", ...], "confidence": 0.95}}"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            result = response.choices[0].message.content
            import re
            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            return {"primary_category": "其他", "secondary_categories": [], "confidence": 0.5}
            
        except Exception as e:
            logger.error(f"内容分类失败: {e}")
            return {"primary_category": "其他", "secondary_categories": [], "confidence": 0.5}