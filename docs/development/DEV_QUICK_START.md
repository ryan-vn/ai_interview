# 本地开发快速开始指南

## 🚀 一键启动

### 方式一：使用脚本（推荐）

```bash
# 1. 启动数据库和 Redis
./dev.sh

# 2. 在新终端启动后端
cd backend && pnpm run start:dev

# 3. 在另一个新终端启动前端
cd frontend && pnpm run dev
```

### 方式二：手动启动

```bash
# 1. 启动 Docker 服务
docker compose -f docker-compose.dev.yml up -d

# 2. 启动后端（新终端）
cd backend
pnpm install  # 首次需要
pnpm run start:dev

# 3. 启动前端（新终端）
cd frontend
pnpm install  # 首次需要
pnpm run dev
```

## 📍 访问地址

- **前端：** http://localhost:3000
- **后端 API：** http://localhost:3001
- **API文档：** http://localhost:3001/api/docs
- **MySQL：** localhost:3306
  - 用户：`interview_user`
  - 密码：`interview_pass`
- **Redis：** localhost:6379

## 🛑 停止服务

```bash
# 停止数据库和 Redis
./stop-dev.sh
# 或
docker compose -f docker-compose.dev.yml down

# 停止前后端：在对应终端按 Ctrl+C
```

## 🔍 常用命令

### 数据库管理

```bash
# 连接数据库
mysql -h localhost -P 3306 -u interview_user -p

# 查看 MySQL 日志
docker logs -f interview_mysql_dev

# 重启 MySQL
docker compose -f docker-compose.dev.yml restart mysql
```

### Redis 管理

```bash
# 连接 Redis
redis-cli -h localhost -p 6379

# 查看 Redis 日志
docker logs -f interview_redis_dev

# 清空 Redis
redis-cli -h localhost -p 6379 FLUSHALL
```

### 后端开发

```bash
cd backend

# 开发模式（热重载）
pnpm run start:dev

# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e

# 代码格式化
pnpm run format

# 代码检查
pnpm run lint
```

### 前端开发

```bash
cd frontend

# 开发模式（Fast Refresh）
pnpm run dev

# 构建生产版本
pnpm run build

# 运行生产构建
pnpm start

# 代码检查
pnpm run lint
```

## ⚙️ 环境配置

### 后端 (`backend/.env`)

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=interview_user
DATABASE_PASSWORD=interview_pass
DATABASE_NAME=interview_system

REDIS_HOST=localhost
REDIS_PORT=6379

NODE_ENV=development
PORT=3001

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# DeepSeek AI（可选）
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 前端 (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🐛 故障排除

### 端口被占用

```bash
# 查找并终止占用端口的进程
lsof -ti:3000 | xargs kill -9  # 前端
lsof -ti:3001 | xargs kill -9  # 后端
```

### 数据库连接失败

```bash
# 检查容器状态
docker ps | grep interview_mysql_dev

# 查看容器日志
docker logs interview_mysql_dev

# 重启容器
docker compose -f docker-compose.dev.yml restart mysql
```

### 依赖问题

```bash
# 清理并重新安装
cd backend  # 或 frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📚 详细文档

- [完整开发指南](../DEVELOPMENT_GUIDE.md)
- [功能使用手册](../USER_GUIDE.md)
- [部署指南](../DEPLOYMENT.md)

## 💡 开发提示

1. **热重载：** 后端和前端都支持代码修改后自动重载
2. **调试：** 可以直接使用 VS Code 调试器
3. **数据持久化：** Docker 卷保存数据库数据
4. **性能：** 本地运行比 Docker 更快，资源占用更少

---

**需要帮助？** 查看 [完整开发指南](../DEVELOPMENT_GUIDE.md) 或联系团队成员。

