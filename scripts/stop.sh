#!/bin/bash

# VideoBrain 停止脚本

echo "=================================="
echo "  停止 VideoBrain 服务"
echo "=================================="
echo ""

# 停止服务
echo "停止所有服务..."
docker-compose down

echo ""
echo "=================================="
echo "  VideoBrain 已停止"
echo "=================================="
echo ""
echo "清理命令:"
echo "  清理临时文件: make clean"
echo "  清理Docker: docker system prune"