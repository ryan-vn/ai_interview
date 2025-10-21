# 部署指南

本文档详细说明如何部署 AI 面试系统。

## 目录

- [系统要求](#系统要求)
- [Docker 部署（推荐）](#docker-部署推荐)
- [手动部署](#手动部署)
- [环境配置](#环境配置)
- [常见问题](#常见问题)

## 系统要求

### 基础要求
- **操作系统**: Linux / macOS / Windows
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### 开发要求
- **Node.js**: 18+
- **pnpm**: 8+ (推荐) 或 npm 9+
- **MySQL**: 8.0+
- **Redis**: 7+

## Docker 部署（推荐）

### 1. 快速启动

```bash
# 克隆项目
git clone <repository-url>
cd interview

# 给启动脚本添加执行权限
chmod +x start.sh stop.sh dev.sh

# 启动所有服务
./start.sh
```

启动成功后，访问：
- 前端：http://localhost:3000
- 后端 API：http://localhost:3001
- API 文档：http://localhost:3001/api/docs

### 2. 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f mysql
```

### 3. 停止服务

```bash
# 使用脚本停止
./stop.sh

# 或手动停止
docker compose down

# 停止并删除所有数据（谨慎使用）
docker compose down -v
```

### 4. 重新构建

```bash
# 重新构建所有服务
docker compose up -d --build

# 重新构建特定服务
docker compose up -d --build backend
```

## 手动部署

### 1. 数据库配置

#### 安装 MySQL 8.0

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# macOS
brew install mysql
```

#### 创建数据库和用户

```sql
-- 登录 MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE interview_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'interview_user'@'localhost' IDENTIFIED BY 'your_password';

-- 授权
GRANT ALL PRIVILEGES ON interview_system.* TO 'interview_user'@'localhost';
FLUSH PRIVILEGES;

-- 导入初始化脚本
USE interview_system;
SOURCE backend/init.sql;
```

#### 安装 Redis

```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# 启动 Redis
redis-server
```

### 2. 后端部署

```bash
cd backend

# 安装依赖
pnpm install

# 配置环境变量
cp env.example .env
# 编辑 .env 文件，填入数据库配置

# 构建项目
pnpm run build

# 启动生产服务器
pnpm run start:prod
```

### 3. 前端部署

```bash
cd frontend

# 安装依赖
pnpm install

# 配置环境变量
cp env.local.example .env.local
# 编辑 .env.local 文件

# 构建项目
pnpm run build

# 启动生产服务器
pnpm run start
```

### 4. 使用 PM2 管理进程（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动后端
cd backend
pm2 start npm --name "interview-backend" -- run start:prod

# 启动前端
cd frontend
pm2 start npm --name "interview-frontend" -- run start

# 查看进程
pm2 list

# 查看日志
pm2 logs

# 重启服务
pm2 restart all

# 设置开机自启
pm2 startup
pm2 save
```

## 环境配置

### 后端环境变量 (backend/.env)

```env
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=interview_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=interview_system

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# 应用配置
NODE_ENV=production
PORT=3001

# OpenAI API（用于 AI 评分）
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4

# 代码执行沙箱配置
SANDBOX_TIMEOUT=10000
MAX_CODE_LENGTH=50000
```

### 前端环境变量 (frontend/.env.local)

```env
# API 地址
NEXT_PUBLIC_API_URL=http://localhost:3001

# 或生产环境
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Nginx 反向代理配置（可选）

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

## 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001
lsof -i :3306

# 修改端口
# 编辑 docker-compose.yml 或环境变量文件
```

### 2. 数据库连接失败

```bash
# 检查 MySQL 是否运行
docker compose ps mysql

# 查看 MySQL 日志
docker compose logs mysql

# 重启 MySQL
docker compose restart mysql
```

### 3. 前端无法连接后端

- 检查 `frontend/.env.local` 中的 `NEXT_PUBLIC_API_URL` 是否正确
- 检查后端服务是否正常运行
- 检查防火墙设置

### 4. 权限问题

```bash
# 给脚本添加执行权限
chmod +x start.sh stop.sh dev.sh

# Docker 权限问题
sudo usermod -aG docker $USER
```

### 5. 清理所有数据并重新开始

```bash
# 停止并删除所有容器和数据
docker compose down -v

# 删除所有镜像
docker compose down --rmi all

# 重新启动
./start.sh
```

## 生产环境优化建议

1. **使用 HTTPS**
   - 配置 SSL 证书（Let's Encrypt）
   - 启用 HSTS

2. **数据库优化**
   - 配置数据库备份策略
   - 启用慢查询日志
   - 调整连接池大小

3. **监控和日志**
   - 集成 ELK 或 Grafana
   - 配置日志轮转
   - 设置告警机制

4. **安全加固**
   - 更改所有默认密码
   - 配置防火墙规则
   - 定期更新依赖包
   - 使用环境变量管理敏感信息

5. **性能优化**
   - 启用 Redis 缓存
   - 配置 CDN
   - 开启 Gzip 压缩
   - 配置负载均衡（多实例部署）

## 支持

如有问题，请提交 Issue 或联系维护团队。

