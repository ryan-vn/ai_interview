#!/bin/bash

# 停止开发环境的数据库服务

echo "================================"
echo "  停止开发环境数据库服务"
echo "================================"
echo ""

# 停止 Docker 容器
echo "🛑 停止 MySQL 和 Redis 容器..."
if command -v docker compose &> /dev/null; then
    docker compose -f docker-compose.dev.yml down
else
    docker-compose -f docker-compose.dev.yml down
fi

echo ""
echo "✅ 数据库服务已停止"
echo ""
echo "💡 提示："
echo "   - 数据已保存在 Docker 卷中"
echo "   - 下次运行 ./dev.sh 会恢复数据"
echo "   - 如需完全清理数据，运行：docker compose -f docker-compose.dev.yml down -v"
echo ""

