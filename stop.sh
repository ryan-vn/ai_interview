#!/bin/bash

# AI 面试系统停止脚本

echo "================================"
echo "  AI 面试系统 - 停止脚本"
echo "================================"
echo ""

echo "🛑 停止 Docker 容器..."

# 使用 docker compose (新版本) 或 docker-compose (旧版本)
if command -v docker compose &> /dev/null; then
    docker compose down
else
    docker-compose down
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 服务已停止"
    echo ""
else
    echo ""
    echo "❌ 停止失败"
    exit 1
fi

