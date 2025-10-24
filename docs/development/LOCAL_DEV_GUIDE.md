# 本地开发指南

## 概述

本指南介绍如何在本地开发环境中运行项目，其中：
- ✅ **数据库（MySQL）和 Redis** 运行在 Docker 容器中
- ✅ **后端（NestJS）** 直接在本地运行，支持热重载
- ✅ **前端（Next.js）** 直接在本地运行，支持 Fast Refresh

这种模式的优点：
- 🚀 前后端开发更快速，即时重载
- 🐛 更容易调试和使用 IDE 调试器
- 💻 节省 Docker 资源，只运行必要的容器
- 🔧 可以灵活使用本地工具和环境

## 快速开始

### 1. 启动数据库和 Redis

```bash
# 在项目根目录运行
./dev.sh
```

这个脚本会：
- 检查并创建环境配置文件
- 启动 MySQL 和 Redis Docker 容器
- 显示详细的启动说明

### 2. 启动后端开发服务器

打开一个新的终端窗口：

```bash
cd backend

# 首次运行需要安装依赖
pnpm install

# 启动开发服务器（支持热重载）
pnpm run start:dev
```

后端服务将运行在：http://localhost:3001

### 3. 启动前端开发服务器

再打开一个新的终端窗口：

```bash
cd frontend

# 首次运行需要安装依赖
pnpm install

# 启动开发服务器（支持 Fast Refresh）
pnpm run dev
```

前端服务将运行在：http://localhost:3000

## 详细说明

### 环境配置

#### 后端环境变量 (`backend/.env`)

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=interview_user
DATABASE_PASSWORD=interview_pass
DATABASE_NAME=interview_system

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
PORT=3001

# OpenAI API (for AI scoring)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
```

**注意：** 数据库和 Redis 的 `HOST` 都设置为 `localhost`，因为它们的端口已经映射到本地。

#### 前端环境变量 (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Docker 服务管理

#### 查看服务状态

```bash
docker compose -f docker-compose.dev.yml ps
```

#### 查看日志

```bash
# 查看 MySQL 日志
docker logs -f interview_mysql_dev

# 查看 Redis 日志
docker logs -f interview_redis_dev
```

#### 停止服务

```bash
docker compose -f docker-compose.dev.yml down
```

#### 重启服务

```bash
docker compose -f docker-compose.dev.yml restart
```

#### 完全清理（包括数据卷）

```bash
docker compose -f docker-compose.dev.yml down -v
```

**警告：** 这会删除所有数据库数据！

### 数据库管理

#### 连接数据库

使用任何 MySQL 客户端工具：

```bash
mysql -h localhost -P 3306 -u interview_user -p
# 密码：interview_pass
```

或者使用 GUI 工具（如 MySQL Workbench、DBeaver、TablePlus）：
- Host: `localhost`
- Port: `3306`
- User: `interview_user`
- Password: `interview_pass`
- Database: `interview_system`

#### 运行数据库迁移

```bash
cd backend

# 如果有新的迁移脚本
mysql -h localhost -P 3306 -u interview_user -p interview_system < migrations/001_add_jobs_resumes_matching.sql
```

#### 重置数据库

```bash
# 在项目根目录
./reset-database.sh
```

### Redis 管理

#### 连接 Redis

```bash
redis-cli -h localhost -p 6379
```

#### 查看所有键

```bash
redis-cli -h localhost -p 6379 KEYS "*"
```

#### 清空 Redis

```bash
redis-cli -h localhost -p 6379 FLUSHALL
```

## 开发工作流

### 典型的开发流程

1. **启动所有服务**
   ```bash
   # 终端 1：启动数据库和 Redis
   ./dev.sh
   
   # 终端 2：启动后端
   cd backend && pnpm run start:dev
   
   # 终端 3：启动前端
   cd frontend && pnpm run dev
   ```

2. **进行开发**
   - 修改后端代码 → 自动重载
   - 修改前端代码 → 自动刷新
   - 查看日志输出进行调试

3. **测试**
   ```bash
   # 后端测试
   cd backend
   pnpm test              # 单元测试
   pnpm test:e2e          # E2E 测试
   
   # 前端测试
   cd frontend
   pnpm test
   ```

4. **结束开发**
   - `Ctrl+C` 停止前端和后端服务
   - 运行 `docker compose -f docker-compose.dev.yml down` 停止数据库

### 调试技巧

#### 后端调试

**使用 VS Code 调试器：**

在 `.vscode/launch.json` 中添加：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "start:dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"],
      "sourceMaps": true
    }
  ]
}
```

**使用 console.log：**
```typescript
console.log('[DEBUG]', variableName);
```

#### 前端调试

- 使用浏览器开发者工具
- 使用 React Developer Tools
- 在代码中添加 `console.log` 或 `debugger`

### 常见问题

#### 1. 端口被占用

**错误信息：** `Port 3000 is already in use` 或 `Port 3001 is already in use`

**解决方法：**
```bash
# 查找占用端口的进程
lsof -ti:3000  # 或 :3001
# 终止进程
kill -9 <PID>
```

#### 2. 数据库连接失败

**错误信息：** `ECONNREFUSED 127.0.0.1:3306`

**解决方法：**
1. 确认 Docker 容器正在运行：
   ```bash
   docker ps | grep interview_mysql_dev
   ```
2. 检查容器日志：
   ```bash
   docker logs interview_mysql_dev
   ```
3. 重启数据库容器：
   ```bash
   docker compose -f docker-compose.dev.yml restart mysql
   ```

#### 3. Redis 连接失败

**解决方法：**
```bash
# 测试 Redis 连接
redis-cli -h localhost -p 6379 ping
# 应该返回 PONG
```

#### 4. 依赖安装失败

**解决方法：**
```bash
# 清理并重新安装
cd backend  # 或 frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 5. 数据库字符集问题

如果遇到中文乱码：
```bash
# 检查字符集
./check-database-charset.sh

# 修复字符集
mysql -h localhost -P 3306 -u root -p < fix-database-charset.sql
```

## 性能优化建议

### 后端优化

1. **使用数据库连接池：** 已在 `app.module.ts` 中配置
2. **启用 Redis 缓存：** 用于存储会话和频繁访问的数据
3. **关闭不必要的日志：** 生产环境设置 `logging: false`

### 前端优化

1. **使用 SWR 进行数据缓存**
2. **图片优化：** 使用 Next.js Image 组件
3. **代码分割：** Next.js 自动处理

## 切换到生产模式

如果需要测试完整的 Docker 部署：

```bash
# 停止开发环境
docker compose -f docker-compose.dev.yml down

# 启动生产环境（包括前后端）
docker compose up -d

# 或者使用启动脚本
./start.sh
```

## 相关文档

- [项目总体开发指南](./DEVELOPMENT.md)
- [前端开发指南](./FRONTEND.md)
- [后端 API 文档](../api/)
- [部署指南](../deployment/DEPLOYMENT.md)

## 总结

本地开发模式让你能够：
- ✅ 快速迭代和测试代码
- ✅ 使用熟悉的开发工具和调试器
- ✅ 保持数据库和缓存的隔离性
- ✅ 节省系统资源

祝开发愉快！🚀

