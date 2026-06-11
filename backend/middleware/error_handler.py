"""
VideoBrain 错误处理中间件
"""
import logging
import traceback
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from utils.exceptions import VideoBrainException

logger = logging.getLogger(__name__)

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """全局错误处理中间件"""
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except VideoBrainException as e:
            # 处理自定义异常
            logger.warning(f"业务异常: {e.code} - {e.message}")
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": {
                        "code": e.code,
                        "message": e.message
                    }
                }
            )
        except Exception as e:
            # 处理未知异常
            logger.error(f"未知异常: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": {
                        "code": "INTERNAL_ERROR",
                        "message": "服务器内部错误，请稍后重试"
                    }
                }
            )