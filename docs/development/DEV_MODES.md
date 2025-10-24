# 开发模式对比

本项目支持两种开发模式，根据你的需求选择合适的模式。

## 📊 模式对比

| 特性 | 本地开发模式 | 完整 Docker 模式 |
|------|------------|----------------|
| **启动命令** | `./dev.sh` | `./start.sh` 或 `docker compose up -d` |
| **前端运行方式** | 本地 `pnpm run dev` | Docker 容器 |
| **后端运行方式** | 本地 `pnpm run start:dev` | Docker 容器 |
| **数据库** | Docker 容器 | Docker 容器 |
| **Redis** | Docker 容器 | Docker 容器 |
| **热重载速度** | ⚡️ 极快 | 🐢 较慢 |
| **调试便利性** | ✅ 优秀（IDE 直接调试） | ⚠️ 需要远程调试 |
| **资源占用** | 💚 低（只运行数据库） | 🟡 中（运行全部容器） |
| **环境隔离性** | 🟡 中（依赖本地 Node） | ✅ 高（完全隔离） |
| **启动速度** | ⚡️ 快（约 5-10 秒） | 🐢 慢（约 30-60 秒） |
| **适用场景** | 日常开发、调试 | 生产环境测试、CI/CD |
| **网络配置** | localhost | Docker 内部网络 |

## 🎯 推荐使用场景

### 本地开发模式（推荐用于日常开发）

✅ **适合：**
- 前端开发（UI/UX 迭代）
- 后端 API 开发
- 快速调试和测试
- 使用 IDE 调试器
- 频繁修改代码

⚠️ **不适合：**
- 测试 Docker 构建
- 模拟生产环境
- CI/CD 流程

### 完整 Docker 模式

✅ **适合：**
- 测试完整部署流程
- 验证 Dockerfile 配置
- 模拟生产环境
- 多人协作环境统一
- CI/CD 集成测试

⚠️ **不适合：**
- 快速开发迭代
- 频繁修改代码
- 需要频繁调试

## 🚀 快速切换

### 从完整 Docker 切换到本地开发

```bash
# 1. 停止所有 Docker 服务
docker compose down

# 2. 启动开发模式（仅数据库）
./dev.sh

# 3. 启动后端（新终端）
cd backend && pnpm run start:dev

# 4. 启动前端（新终端）
cd frontend && pnpm run dev
```

### 从本地开发切换到完整 Docker

```bash
# 1. 停止前后端服务（在对应终端按 Ctrl+C）

# 2. 停止开发模式数据库
./stop-dev.sh

# 3. 启动完整 Docker 环境
./start.sh
```

## 📁 配置文件对比

### 本地开发模式

**Docker 配置：** `docker-compose.dev.yml`
```yaml
services:
  mysql:    # ✅ 运行
  redis:    # ✅ 运行
  backend:  # ❌ 不运行
  frontend: # ❌ 不运行
```

**后端配置：** `backend/.env`
```env
DATABASE_HOST=localhost  # 连接到本地映射的端口
REDIS_HOST=localhost
PORT=3001
```

**前端配置：** `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001  # 连接本地后端
```

### 完整 Docker 模式

**Docker 配置：** `docker-compose.yml`
```yaml
services:
  mysql:    # ✅ 运行
  redis:    # ✅ 运行
  backend:  # ✅ 运行
  frontend: # ✅ 运行
```

**后端配置：** 通过 `docker-compose.yml` 的环境变量
```yaml
environment:
  DATABASE_HOST: mysql  # Docker 内部服务名
  REDIS_HOST: redis
```

**前端配置：** 通过 `docker-compose.yml` 的环境变量
```yaml
environment:
  NEXT_PUBLIC_API_URL: http://localhost:3001
```

## 🔧 端口映射

### 本地开发模式

| 服务 | 容器端口 | 主机端口 | 访问方式 |
|------|---------|---------|---------|
| MySQL | 3306 | 3306 | localhost:3306 |
| Redis | 6379 | 6379 | localhost:6379 |
| 后端 | - | 3001 | localhost:3001（本地进程）|
| 前端 | - | 3000 | localhost:3000（本地进程）|

### 完整 Docker 模式

| 服务 | 容器端口 | 主机端口 | 访问方式 |
|------|---------|---------|---------|
| MySQL | 3306 | 3306 | localhost:3306 |
| Redis | 6379 | 6379 | localhost:6379 |
| 后端 | 3001 | 3001 | localhost:3001 |
| 前端 | 3000 | 3000 | localhost:3000 |

## 💡 开发技巧

### 本地开发模式技巧

1. **使用多终端工具**
   - iTerm2（macOS）：分屏管理多个终端
   - tmux：终端复用器
   - VS Code 集成终端：多个终端标签页

2. **自动重启工具**
   - 后端：NestJS 内置的 `start:dev` 已支持热重载
   - 前端：Next.js Fast Refresh 自动启用

3. **快速查看日志**
   ```bash
   # 数据库日志
   docker logs -f interview_mysql_dev
   
   # Redis 日志
   docker logs -f interview_redis_dev
   ```

4. **使用 IDE 调试器**
   - VS Code：配置 launch.json
   - WebStorm：内置 Node.js 调试器

### 完整 Docker 模式技巧

1. **查看所有服务日志**
   ```bash
   docker compose logs -f
   ```

2. **只查看特定服务**
   ```bash
   docker compose logs -f backend
   docker compose logs -f frontend
   ```

3. **进入容器调试**
   ```bash
   docker exec -it interview_backend sh
   docker exec -it interview_frontend sh
   ```

4. **重启单个服务**
   ```bash
   docker compose restart backend
   ```

## 🎨 开发工作流推荐

### 前端开发者

```bash
# 推荐：本地开发模式
./dev.sh
cd frontend && pnpm run dev

# 优势：
# - Fast Refresh 即时更新
# - 浏览器直接调试
# - 修改组件立即看到效果
```

### 后端开发者

```bash
# 推荐：本地开发模式
./dev.sh
cd backend && pnpm run start:dev

# 优势：
# - 热重载快速
# - IDE 断点调试
# - 日志输出清晰
```

### 全栈开发者

```bash
# 日常开发：本地模式
./dev.sh
cd backend && pnpm run start:dev  # 终端 1
cd frontend && pnpm run dev       # 终端 2

# 测试部署：Docker 模式
./start.sh
```

### DevOps/测试人员

```bash
# 推荐：完整 Docker 模式
./start.sh

# 优势：
# - 环境一致性
# - 模拟生产环境
# - 完整的服务栈测试
```

## 📈 性能对比

基于 MacBook Pro M1 的测试结果：

| 指标 | 本地开发模式 | 完整 Docker 模式 |
|------|------------|----------------|
| 初次启动时间 | ~5 秒 | ~45 秒 |
| 热重载时间 | <1 秒 | 3-5 秒 |
| 内存占用 | ~500 MB | ~1.5 GB |
| CPU 使用率 | 5-10% | 15-25% |
| 代码修改到生效 | 即时 | 需要重建容器 |

## 🛠️ 故障排除

### 本地开发模式常见问题

**问题：** 前端无法连接后端
```bash
# 检查后端是否运行
curl http://localhost:3001

# 检查环境变量
cat frontend/.env.local
```

**问题：** 后端无法连接数据库
```bash
# 检查数据库容器
docker ps | grep mysql

# 测试数据库连接
mysql -h localhost -P 3306 -u interview_user -p
```

### 完整 Docker 模式常见问题

**问题：** 服务无法启动
```bash
# 查看所有容器状态
docker compose ps

# 查看详细日志
docker compose logs
```

**问题：** 构建失败
```bash
# 清理并重新构建
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 📚 相关文档

- [本地开发完整指南](./LOCAL_DEV_GUIDE.md)
- [快速开始指南](./DEV_QUICK_START.md)
- [部署指南](../deployment/DEPLOYMENT.md)

---

**建议：** 日常开发使用本地模式，部署前使用 Docker 模式测试！

