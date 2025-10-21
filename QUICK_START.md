# 🚀 快速启动指南

## 当前状态

✅ **数据库字符集已修复** - 所有中文乱码问题已解决  
✅ **Docker 配置已优化** - 使用 utf8mb4 字符集  
✅ **项目已就绪** - 可以开始使用

## 立即开始（3步）

### 第一步：启动 Docker Desktop

**macOS:**
1. 打开 Launchpad 或 Applications 文件夹
2. 找到并点击 "Docker" 图标
3. 等待 Docker 图标在菜单栏显示为绿色 ✅

**Windows:**
1. 打开开始菜单
2. 搜索并打开 "Docker Desktop"
3. 等待 Docker 启动完成

**Linux:**
```bash
sudo systemctl start docker
```

### 第二步：启动项目

在项目根目录运行：

```bash
./start.sh
```

或者手动启动：

```bash
docker compose up -d
```

### 第三步：访问应用

- 🌐 **前端**: http://localhost:3000
- 🔌 **后端 API**: http://localhost:3001
- 📚 **API 文档**: http://localhost:3001/api/docs

## 📊 检查服务状态

```bash
# 查看所有容器状态
docker compose ps

# 查看日志
docker compose logs -f

# 检查数据库字符集（确认中文支持）
./check-database-charset.sh
```

## 🧪 测试功能

### 1. 访问前端
打开浏览器访问 http://localhost:3000

### 2. 注册账号
点击"注册"按钮，创建一个账号：
- 用户名：可以使用中文（如：张三）
- 邮箱：任意邮箱
- 密码：至少6位

### 3. 登录系统
使用刚注册的账号登录

### 4. 测试 API
访问 http://localhost:3001/api/docs 查看 API 文档

## 🔑 默认测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | password123 | 管理员 |
| interviewer1 | password123 | 面试官 |
| candidate1 | password123 | 候选人 |

⚠️ **生产环境请立即修改这些密码！**

## 🛠️ 常用命令

```bash
# 启动所有服务
./start.sh

# 停止所有服务
./stop.sh

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 重新构建
docker compose up -d --build

# 检查字符集
./check-database-charset.sh
```

## 🐛 遇到问题？

### Docker 未运行
**错误**: `Cannot connect to the Docker daemon`

**解决**: 
1. 确保 Docker Desktop 已启动
2. 检查 Docker 图标是否在菜单栏（macOS）或系统托盘（Windows）
3. 等待 Docker 完全启动（可能需要1-2分钟）

### 端口被占用
**错误**: `address already in use`

**解决**:
```bash
# 释放 3000 和 3001 端口
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# 重新启动
docker compose up -d
```

### 中文显示乱码
**解决**: 
```bash
# 运行数据库重置脚本
./reset-database.sh

# 输入 yes 确认
```

### 查看更多解决方案
查看 [故障排除文档](docs/deployment/TROUBLESHOOTING.md)

## 📚 下一步

- 📖 [开发指南](docs/development/DEVELOPMENT.md) - 了解如何开发
- 🚀 [部署指南](docs/deployment/DEPLOYMENT.md) - 生产环境部署
- 📝 [需求文档](docs/requirements/README.md) - 了解功能需求
- 🔧 [字符集修复](docs/deployment/DATABASE_CHARSET_FIX.md) - 字符集详细说明

## 💡 开发模式

如果想在本地开发（不使用 Docker）：

```bash
# 启动数据库（Docker）
./dev.sh

# 终端 1 - 后端
cd backend
pnpm install
pnpm run start:dev

# 终端 2 - 前端  
cd frontend
pnpm install
pnpm run dev
```

## 📞 需要帮助？

- 📖 查看完整文档：`docs/README.md`
- 🐛 提交问题：GitHub Issues
- 💬 联系维护者：dev@example.com

---

**祝你使用愉快！** 🎉

