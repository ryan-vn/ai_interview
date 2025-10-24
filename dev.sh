#!/bin/bash

# AI 面试系统开发环境启动脚本（本地开发模式）
# 只启动数据库和 Redis，前端和后端在本地运行

echo "================================"
echo "  AI 面试系统 - 本地开发模式"
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
    echo "✅ 已创建 backend/.env"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  前端 .env.local 文件不存在，从示例文件复制..."
    cp frontend/env.local.example frontend/.env.local
    echo "✅ 已创建 frontend/.env.local"
fi

# 启动数据库服务（只启动 MySQL 和 Redis）
echo ""
echo "📦 启动数据库服务（MySQL + Redis）..."
if command -v docker compose &> /dev/null; then
    docker compose -f docker-compose.dev.yml up -d
else
    docker-compose -f docker-compose.dev.yml up -d
fi

# 等待数据库启动
echo "⏳ 等待数据库就绪..."
sleep 5

# 检查数据库状态
echo ""
echo "🔍 检查服务状态..."
if command -v docker compose &> /dev/null; then
    docker compose -f docker-compose.dev.yml ps
else
    docker-compose -f docker-compose.dev.yml ps
fi

echo ""
echo "✅ 数据库和 Redis 已启动！"
echo ""
echo "📝 数据库连接信息："
echo "   MySQL: localhost:3306"
echo "   用户名: interview_user"
echo "   密码: interview_pass"
echo "   数据库: interview_system"
echo ""
echo "   Redis: localhost:6379"
echo ""
echo "🚀 接下来请在不同的终端窗口中运行："
echo ""
echo "   📍 后端开发服务器（终端 1）："
echo "      cd backend"
echo "      $PKG_MANAGER install          # 首次运行需要安装依赖"
echo "      $PKG_MANAGER run start:dev    # 启动后端开发服务器"
echo "      → http://localhost:3001"
echo ""
echo "   📍 前端开发服务器（终端 2）："
echo "      cd frontend"
echo "      $PKG_MANAGER install          # 首次运行需要安装依赖"
echo "      $PKG_MANAGER run dev          # 启动前端开发服务器"
echo "      → http://localhost:3000"
echo ""
echo "💡 提示："
echo "   - 后端支持热重载，修改代码会自动重启"
echo "   - 前端支持 Fast Refresh，修改代码会即时更新"
echo "   - 查看数据库日志：docker logs -f interview_mysql_dev"
echo "   - 查看 Redis 日志：docker logs -f interview_redis_dev"
echo ""
echo "🛑 停止数据库服务："
if command -v docker compose &> /dev/null; then
    echo "   docker compose -f docker-compose.dev.yml down"
else
    echo "   docker-compose -f docker-compose.dev.yml down"
fi
echo ""
