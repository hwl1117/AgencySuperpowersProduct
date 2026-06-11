#!/bin/bash

# VideoBrain 开发环境启动脚本

echo "=================================="
echo "  VideoBrain 开发环境"
echo "=================================="
echo ""

# 检查环境变量
if [ ! -f .env ]; then
    echo "错误: 未找到 .env 文件"
    echo "请运行: cp .env.example .env"
    exit 1
fi

# 创建必要目录
mkdir -p downloads audio knowledge_base_db

echo "启动开发环境..."
echo ""

# 启动后端（后台运行）
echo "启动后端服务..."
cd backend
source venv/bin/activate 2>/dev/null || python -m venv venv && source venv/bin/activate
pip install -r requirements.txt -q
uvicorn api.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端
echo "启动前端服务..."
cd frontend
npm install -q
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=================================="
echo "  开发环境已启动！"
echo "=================================="
echo ""
echo "访问地址:"
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:8000"
echo "  API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号
trap "echo ''; echo '停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# 等待
wait