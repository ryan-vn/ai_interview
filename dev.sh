#!/bin/bash

# AI 面试系统开发环境启动脚本

echo "================================"
echo "  AI 面试系统 - 开发模式"
echo "================================"
echo ""

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm 未安装，尝试使用 npm..."
    PKG_MANAGER="npm"
else
    PKG_MANAGER="pnpm"
fi

# 检查环境变量文件
if [ ! -f "backend/.env" ]; then
    echo "⚠️  后端 .env 文件不存在，从示例文件复制..."
    cp backend/env.example backend/.env
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  前端 .env.local 文件不存在，从示例文件复制..."
    cp frontend/env.local.example frontend/.env.local
fi

# 启动数据库服务
echo "📦 启动数据库服务（MySQL + Redis）..."
if command -v docker compose &> /dev/null; then
    docker compose up -d mysql redis
else
    docker-compose up -d mysql redis
fi

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 5

echo ""
echo "🚀 启动开发服务器..."
echo ""
echo "📍 后端服务器将运行在：http://localhost:3001"
echo "📍 前端服务器将运行在：http://localhost:3000"
echo ""
echo "💡 提示：在两个终端窗口中分别运行："
echo "   终端 1: cd backend && $PKG_MANAGER install && $PKG_MANAGER run start:dev"
echo "   终端 2: cd frontend && $PKG_MANAGER install && $PKG_MANAGER run dev"
echo ""

