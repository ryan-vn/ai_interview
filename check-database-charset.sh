#!/bin/bash

# ========================================
# 数据库字符集检查脚本
# ========================================

echo "================================"
echo "  数据库字符集检查"
echo "================================"
echo ""

echo "📊 MySQL 系统字符集变量："
echo "----------------------------"
if command -v docker compose &> /dev/null; then
    docker compose exec mysql mysql -uroot -proot123456 -e "SHOW VARIABLES LIKE 'character%';"
else
    docker-compose exec mysql mysql -uroot -proot123456 -e "SHOW VARIABLES LIKE 'character%';"
fi

echo ""
echo "📊 MySQL 排序规则变量："
echo "----------------------------"
if command -v docker compose &> /dev/null; then
    docker compose exec mysql mysql -uroot -proot123456 -e "SHOW VARIABLES LIKE 'collation%';"
else
    docker-compose exec mysql mysql -uroot -proot123456 -e "SHOW VARIABLES LIKE 'collation%';"
fi

echo ""
echo "📊 数据库字符集："
echo "----------------------------"
if command -v docker compose &> /dev/null; then
    docker compose exec mysql mysql -uroot -proot123456 -e "SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'interview_system';"
else
    docker-compose exec mysql mysql -uroot -proot123456 -e "SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'interview_system';"
fi

echo ""
echo "📊 表字符集："
echo "----------------------------"
if command -v docker compose &> /dev/null; then
    docker compose exec mysql mysql -uroot -proot123456 -e "SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'interview_system' ORDER BY TABLE_NAME;"
else
    docker-compose exec mysql mysql -uroot -proot123456 -e "SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'interview_system' ORDER BY TABLE_NAME;"
fi

echo ""
echo "📊 测试中文数据："
echo "----------------------------"
if command -v docker compose &> /dev/null; then
    docker compose exec mysql mysql -uroot -proot123456 interview_system -e "SELECT id, name, description FROM roles LIMIT 5;"
else
    docker-compose exec mysql mysql -uroot -proot123456 interview_system -e "SELECT id, name, description FROM roles LIMIT 5;"
fi

echo ""
echo "================================"
echo "✅ 检查完成"
echo "================================"

