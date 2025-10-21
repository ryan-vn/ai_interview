#!/bin/bash

# AI面试系统 - 测试环境设置脚本
# 使用方法: chmod +x setup-test.sh && ./setup-test.sh

set -e

echo "🚀 开始设置测试环境..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 检查Node.js
echo -e "\n${YELLOW}1. 检查Node.js版本...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未安装Node.js，请先安装Node.js 18+${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js版本: $NODE_VERSION${NC}"

# 2. 检查MySQL
echo -e "\n${YELLOW}2. 检查MySQL...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ 未安装MySQL，请先安装MySQL 8.0+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ MySQL已安装${NC}"

# 3. 创建测试数据库
echo -e "\n${YELLOW}3. 创建测试数据库...${NC}"
read -p "请输入MySQL root密码: " -s MYSQL_ROOT_PASSWORD
echo

# 创建数据库和用户
mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS interview_system_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'test_user'@'localhost' IDENTIFIED BY 'test_password';
GRANT ALL PRIVILEGES ON interview_system_test.* TO 'test_user'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 测试数据库创建成功${NC}"
else
    echo -e "${RED}❌ 数据库创建失败${NC}"
    exit 1
fi

# 4. 创建.env.test文件
echo -e "\n${YELLOW}4. 创建.env.test配置文件...${NC}"
cat > .env.test <<EOL
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=test_user
DATABASE_PASSWORD=test_password
DATABASE_NAME=interview_system_test

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT配置
JWT_SECRET=test_jwt_secret_key_for_testing_only_do_not_use_in_production
JWT_EXPIRES_IN=1d

# API配置
PORT=3002
NODE_ENV=test
EOL
echo -e "${GREEN}✅ .env.test文件创建成功${NC}"

# 5. 安装依赖
echo -e "\n${YELLOW}5. 安装依赖包...${NC}"
if [ -f "package-lock.json" ]; then
    npm install
elif [ -f "pnpm-lock.yaml" ]; then
    pnpm install
elif [ -f "yarn.lock" ]; then
    yarn install
else
    npm install
fi
echo -e "${GREEN}✅ 依赖安装完成${NC}"

# 6. 初始化数据库
echo -e "\n${YELLOW}6. 初始化测试数据库...${NC}"
if [ -f "init.sql" ]; then
    mysql -u test_user -ptest_password interview_system_test < init.sql
    echo -e "${GREEN}✅ 数据库初始化完成${NC}"
else
    echo -e "${YELLOW}⚠️  未找到init.sql文件，跳过数据库初始化${NC}"
fi

# 7. 运行测试
echo -e "\n${YELLOW}7. 运行测试验证环境...${NC}"
echo "运行认证模块测试..."
npm run test:e2e -- auth.e2e-spec.ts

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 测试环境设置完成！${NC}"
    echo -e "\n${GREEN}可以使用以下命令运行测试：${NC}"
    echo -e "  ${YELLOW}npm run test:e2e${NC}          - 运行所有E2E测试"
    echo -e "  ${YELLOW}npm test${NC}                  - 运行所有测试"
    echo -e "  ${YELLOW}npm run test:cov${NC}          - 运行测试并生成覆盖率报告"
    echo -e "\n${GREEN}查看详细文档：${NC}"
    echo -e "  ${YELLOW}TEST_README.md${NC}            - 测试指南"
    echo -e "  ${YELLOW}TEST_CASES.md${NC}             - 测试用例文档"
else
    echo -e "\n${RED}❌ 测试运行失败，请检查配置${NC}"
    exit 1
fi

