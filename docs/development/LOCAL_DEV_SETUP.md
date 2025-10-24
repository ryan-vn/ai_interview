# 本地开发环境配置完成 ✅

## 📋 概述

已成功配置本地开发环境！现在你可以：
- ✅ 前端和后端直接在本地运行（更快、更易调试）
- ✅ 数据库和 Redis 在 Docker 中运行（无需本地安装）
- ✅ 享受极速热重载和 IDE 调试功能

## 🎉 新增内容

### 1. 配置文件

#### `docker-compose.dev.yml` 
开发环境专用的 Docker 配置，只包含数据库和 Redis：
```yaml
services:
  mysql:    # ✅ 运行在 Docker
  redis:    # ✅ 运行在 Docker
  backend:  # ❌ 不在 Docker 中（本地运行）
  frontend: # ❌ 不在 Docker 中（本地运行）
```

#### 更新的环境配置
- `backend/.env` - 数据库连接配置为 `localhost`
- `frontend/.env.local` - API 地址配置为 `http://localhost:3001`

### 2. 启动脚本

#### `./dev.sh` ⭐ 主启动脚本
一键启动开发环境数据库服务：
```bash
./dev.sh
```

功能：
- 自动检查并创建环境配置文件
- 启动 MySQL 和 Redis Docker 容器
- 显示详细的后续步骤说明

#### `./stop-dev.sh` 停止脚本
停止开发环境的数据库服务：
```bash
./stop-dev.sh
```

### 3. 文档

#### `DEV_QUICK_START.md` 📖 快速参考
位置：docs/development/
内容：最常用的命令和快速参考

#### `docs/development/LOCAL_DEV_GUIDE.md` 📚 完整指南
详细的本地开发指南，包括：
- 环境配置说明
- 数据库管理
- 调试技巧
- 常见问题解决

#### `docs/development/DEV_MODES.md` 📊 模式对比
详细对比两种开发模式的优缺点和使用场景

#### `README.md` 更新
主 README 已更新，推荐本地开发模式

## 🚀 快速开始（3 步启动）

### 第 1 步：启动数据库
```bash
./dev.sh
```

### 第 2 步：启动后端（新终端）
```bash
cd backend
pnpm install  # 首次需要
pnpm run start:dev
```

### 第 3 步：启动前端（新终端）
```bash
cd frontend
pnpm install  # 首次需要
pnpm run dev
```

### 访问应用
- 前端：http://localhost:3000
- 后端：http://localhost:3001

## 📁 项目结构变化

```
interview/
├── docker-compose.yml          # 生产环境配置（全栈 Docker）
├── docker-compose.dev.yml      # 🆕 开发环境配置（仅数据库）
├── dev.sh                      # 🔄 更新：启动开发环境
├── stop-dev.sh                 # 🆕 停止开发环境
├── README.md                   # 🔄 更新：添加本地开发说明
└── docs/
    └── development/
        ├── DEV_QUICK_START.md       # 🆕 快速参考指南
        ├── LOCAL_DEV_SETUP.md       # 🆕 本文档
        ├── LOCAL_DEV_GUIDE.md       # 🆕 完整开发指南
        └── DEV_MODES.md             # 🆕 开发模式对比
```

## 🎯 优势对比

### 本地开发模式（新配置）vs 完整 Docker

| 特性 | 本地开发 | 完整 Docker |
|------|---------|------------|
| 热重载速度 | ⚡️ <1秒 | 🐢 3-5秒 |
| IDE 调试 | ✅ 直接支持 | ⚠️ 需要配置 |
| 启动时间 | ⚡️ 5秒 | 🐢 45秒 |
| 内存占用 | 💚 ~500MB | 🟡 ~1.5GB |
| 代码修改 | ⚡️ 即时生效 | 🐢 需要重建 |

## 💡 开发技巧

### 1. 使用终端分屏

**iTerm2（macOS）：**
```
Cmd + D  # 水平分屏
Cmd + Shift + D  # 垂直分屏
```

**tmux：**
```bash
tmux new -s dev
# Ctrl+B 然后按 %  # 垂直分屏
# Ctrl+B 然后按 "  # 水平分屏
```

### 2. VS Code 集成终端
在 VS Code 中打开多个终端标签：
- `Ctrl + Shift + `` ` - 打开新终端
- 为每个服务（数据库、后端、前端）创建一个终端

### 3. 查看日志

```bash
# 数据库日志
docker logs -f interview_mysql_dev

# Redis 日志
docker logs -f interview_redis_dev

# 后端日志：直接在运行的终端查看
# 前端日志：直接在运行的终端查看 + 浏览器控制台
```

### 4. 使用调试器

**后端调试（VS Code）：**
创建 `.vscode/launch.json`：
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "start:dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

**前端调试：**
- 使用浏览器开发者工具（F12）
- 安装 React Developer Tools 扩展

## 🔧 常用操作

### 重启数据库
```bash
docker compose -f docker-compose.dev.yml restart mysql
```

### 查看容器状态
```bash
docker compose -f docker-compose.dev.yml ps
```

### 连接数据库
```bash
mysql -h localhost -P 3306 -u interview_user -p
# 密码：interview_pass
```

### 连接 Redis
```bash
redis-cli -h localhost -p 6379
```

### 清理数据库（谨慎！）
```bash
docker compose -f docker-compose.dev.yml down -v
./dev.sh  # 重新启动会创建新的数据库
```

## 🐛 故障排除

### 端口被占用
```bash
# 查找并终止占用端口的进程
lsof -ti:3000  # 前端
lsof -ti:3001  # 后端
lsof -ti:3306  # MySQL
lsof -ti:6379  # Redis

# 终止进程
kill -9 <PID>
```

### 数据库连接失败
```bash
# 1. 检查容器是否运行
docker ps | grep interview_mysql_dev

# 2. 查看日志
docker logs interview_mysql_dev

# 3. 重启容器
docker compose -f docker-compose.dev.yml restart mysql

# 4. 等待数据库完全启动
sleep 5
```

### 依赖安装失败
```bash
# 清理并重新安装
cd backend  # 或 frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📖 相关文档

- [快速参考指南](./DEV_QUICK_START.md) - 最常用命令
- [完整开发指南](./LOCAL_DEV_GUIDE.md) - 详细说明
- [开发模式对比](./DEV_MODES.md) - 选择合适的模式
- [前端开发](./FRONTEND.md) - 前端特定指南
- [部署指南](../deployment/DEPLOYMENT.md) - 生产环境部署

## 🎓 下一步

1. **熟悉开发流程**
   - 阅读 [完整开发指南](./LOCAL_DEV_GUIDE.md)
   - 了解项目架构和代码结构

2. **开始开发**
   - 查看 [任务列表](../tasks.md)
   - 选择一个功能开始实现

3. **编写测试**
   - 单元测试：`pnpm test`
   - E2E 测试：`pnpm test:e2e`

4. **提交代码**
   - 遵循代码规范
   - 使用 Conventional Commits

## ✅ 总结

配置完成！现在你拥有：
- ✅ 快速的本地开发环境
- ✅ 完整的开发文档
- ✅ 便捷的启动脚本
- ✅ 强大的调试功能

开始愉快地开发吧！🚀

---

**配置日期：** 2025-10-24  
**版本：** 1.0

