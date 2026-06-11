"""
VideoBrain 请求日志中间件
"""
import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """请求日志中间件"""
    
    async def dispatch(self, request: Request, call_next):
        # 记录请求开始
        start_time = time.time()
        
        # 获取客户端信息
        client_host = request.client.host if request.client else "unknown"
        method = request.method
        url = str(request.url)
        
        logger.info(f"请求开始: {method} {url} - 客户端: {client_host}")
        
        try:
            # 处理请求
            response = await call_next(request)
            
            # 计算处理时间
            process_time = time.time() - start_time
            
            # 记录请求完成
            logger.info(
                f"请求完成: {method} {url} - "
                f"状态码: {response.status_code} - "
                f"处理时间: {process_time:.4f}秒"
            )
            
            # 添加处理时间到响应头
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            # 记录请求异常
            process_time = time.time() - start_time
            logger.error(
                f"请求异常: {method} {url} - "
                f"错误: {str(e)} - "
                f"处理时间: {process_time:.4f}秒"
            )
            raise