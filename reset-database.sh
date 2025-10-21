#!/bin/bash

# ========================================
# 数据库重置脚本
# 用于完全重建数据库并修复字符集问题
# ========================================

echo "================================"
echo "  数据库重置脚本"
echo "================================"
echo ""
echo "⚠️  警告: 此操作将删除所有现有数据！"
echo ""
read -p "确认要继续吗? (输入 yes 确认): " confirm

if [ "$confirm" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo "🛑 停止所有容器..."
if command -v docker compose &> /dev/null; then
    docker compose down
else
    docker-compose down
fi

echo ""
echo "🗑️  删除 MySQL 数据卷..."
docker volume rm interview_mysql_data 2>/dev/null || echo "数据卷不存在，跳过删除"

echo ""
echo "🚀 重新启动服务..."
if command -v docker compose &> /dev/null; then
    docker compose up -d mysql redis
else
    docker-compose up -d mysql redis
fi

echo ""
echo "⏳ 等待 MySQL 启动 (30秒)..."
sleep 30

echo ""
echo "🔧 执行字符集修复脚本..."
if command -v docker compose &> /dev/null; then
    docker compose exec -T mysql mysql -uroot -proot123456 interview_system < fix-database-charset.sql
else
    docker-compose exec -T mysql mysql -uroot -proot123456 interview_system < fix-database-charset.sql
fi

echo ""
echo "✅ 数据库重置完成！"
echo ""
echo "📊 字符集配置验证："
if command -v docker compose &> /dev/null; then
    docker compose exec mysql mysql -uroot -proot123456 -e "SHOW VARIABLES LIKE 'character%';"
    docker compose exec mysql mysql -uroot -proot123456 -e "SHOW VARIABLES LIKE 'collation%';"
else
    docker-compose exec mysql mysql -uroot -proot123456 -e "SHOW VARIABLES LIKE 'character%';"
    docker-compose exec mysql mysql -uroot -proot123456 -e "SHOW VARIABLES LIKE 'collation%';"
fi

echo ""
echo "🚀 启动后端和前端服务..."
if command -v docker compose &> /dev/null; then
    docker compose up -d backend frontend
else
    docker-compose up -d backend frontend
fi

echo ""
echo "================================"
echo "✅ 所有操作完成！"
echo "================================"
echo ""
echo "📍 访问地址："
echo "   前端：http://localhost:3000"
echo "   后端：http://localhost:3001"
echo "   API 文档：http://localhost:3001/api/docs"
echo ""

