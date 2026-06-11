.PHONY: help install start stop restart logs test clean

# 默认目标
help:
	@echo "VideoBrain - 短视频智能知识库"
	@echo ""
	@echo "可用命令:"
	@echo "  make install    - 安装依赖"
	@echo "  make start      - 启动所有服务"
	@echo "  make stop       - 停止所有服务"
	@echo "  make restart    - 重启所有服务"
	@echo "  make logs       - 查看日志"
	@echo "  make test       - 运行测试"
	@echo "  make clean      - 清理临时文件"
	@echo "  make dev        - 启动开发环境"
	@echo "  make build      - 构建Docker镜像"

# 安装依赖
install:
	@echo "安装后端依赖..."
	cd backend && pip install -r requirements.txt
	@echo "安装前端依赖..."
	cd frontend && npm install
	@echo "依赖安装完成！"

# 启动服务
start:
	@echo "启动VideoBrain服务..."
	docker-compose up -d
	@echo "服务已启动！"
	@echo "前端: http://localhost:3000"
	@echo "后端: http://localhost:8000"
	@echo "API文档: http://localhost:8000/docs"

# 停止服务
stop:
	@echo "停止VideoBrain服务..."
	docker-compose down
	@echo "服务已停止！"

# 重启服务
restart: stop start

# 查看日志
logs:
	docker-compose logs -f

# 运行测试
test:
	@echo "运行后端测试..."
	cd backend && python -m pytest ../tests/ -v
	@echo "测试完成！"

# 清理临时文件
clean:
	@echo "清理临时文件..."
	rm -rf downloads/* audio/* knowledge_base_db/* temp_chunks/
	rm -f *.db *.sqlite
	@echo "清理完成！"

# 开发环境
dev:
	@echo "启动开发环境..."
	@echo "请在两个终端分别运行:"
	@echo "终端1: cd backend && uvicorn api.main:app --reload --port 8000"
	@echo "终端2: cd frontend && npm run dev"

# 构建Docker镜像
build:
	@echo "构建Docker镜像..."
	docker-compose build
	@echo "构建完成！"

# 初始化项目
init:
	@echo "初始化VideoBrain项目..."
	cp .env.example .env
	@echo "请编辑 .env 文件，填入 OpenAI API Key"
	@echo "然后运行 'make install' 安装依赖"