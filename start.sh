#!/bin/bash

# AI 面试系统启动脚本

echo "================================"
echo "  AI 面试系统 - 启动脚本"
echo "================================"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f "backend/.env" ]; then
    echo "⚠️  后端 .env 文件不存在，从示例文件复制..."
    cp backend/env.example backend/.env
    echo "✅ 已创建 backend/.env，请根据需要修改配置"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  前端 .env.local 文件不存在，从示例文件复制..."
    cp frontend/env.local.example frontend/.env.local
    echo "✅ 已创建 frontend/.env.local"
fi

echo ""
echo "📦 启动 Docker 容器..."
echo ""

# 使用 docker compose (新版本) 或 docker-compose (旧版本)
if command -v docker compose &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "================================"
    echo "✅ 启动成功！"
    echo "================================"
    echo ""
    echo "📍 访问地址："
    echo "   前端：http://localhost:3000"
    echo "   后端 API：http://localhost:3001"
    echo "   API 文档：http://localhost:3001/api/docs"
    echo ""
    echo "📊 数据库信息："
    echo "   MySQL：localhost:3306"
    echo "   Redis：localhost:6379"
    echo ""
    echo "🔧 查看日志："
    if command -v docker compose &> /dev/null; then
        echo "   docker compose logs -f"
    else
        echo "   docker-compose logs -f"
    fi
    echo ""
    echo "🛑 停止服务："
    if command -v docker compose &> /dev/null; then
        echo "   docker compose down"
    else
        echo "   docker-compose down"
    fi
    echo ""
else
    echo ""
    echo "❌ 启动失败，请检查错误信息"
    exit 1
fi

