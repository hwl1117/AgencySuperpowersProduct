#!/bin/bash

# VideoBrain 启动脚本

echo "=================================="
echo "  VideoBrain - 短视频智能知识库"
echo "=================================="
echo ""

# 检查环境变量
if [ ! -f .env ]; then
    echo "错误: 未找到 .env 文件"
    echo "请运行: cp .env.example .env"
    echo "然后编辑 .env 文件，填入 OpenAI API Key"
    exit 1
fi

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "错误: 未安装Docker"
    echo "请访问 https://docs.docker.com/get-docker/ 安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: 未安装docker-compose"
    exit 1
fi

# 创建必要目录
echo "创建必要目录..."
mkdir -p downloads audio knowledge_base_db

# 启动服务
echo "启动VideoBrain服务..."
docker-compose up -d

# 等待服务启动
echo "等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "服务状态:"
docker-compose ps

echo ""
echo "=================================="
echo "  VideoBrain 已启动！"
echo "=================================="
echo ""
echo "访问地址:"
echo "  前端界面: http://localhost:3000"
echo "  后端API: http://localhost:8000"
echo "  API文档: http://localhost:8000/docs"
echo ""
echo "使用方法:"
echo "  1. 打开 http://localhost:3000"
echo "  2. 粘贴短视频链接"
echo "  3. 点击 '开始处理'"
echo "  4. 等待处理完成"
echo ""
echo "查看日志: make logs"
echo "停止服务: make stop"