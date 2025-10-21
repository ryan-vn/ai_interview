# AI 面试系统

> 🚀 一个基于 Next.js + NestJS 的现代化智能面试系统

基于 Next.js + NestJS 的智能面试系统，支持编程题和问答题的在线面试、AI 自动评分和面试官复核。本项目为 AI Coding 竞赛参赛作品。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-%3E%3D20.10-blue.svg)](https://www.docker.com/)

## ✨ 特性

- 🎯 **多角色系统** - 支持候选人、面试官、管理员三种角色
- 💻 **在线编程** - 内置 Monaco 代码编辑器，支持多种编程语言
- 🤖 **AI 评分** - 自动执行测试用例和 AI 智能评分
- 📊 **可视化报告** - 生成详细的面试报告和统计分析
- 🔒 **安全可靠** - JWT 认证、RBAC 权限控制、数据加密
- 🐳 **容器化部署** - 一键 Docker 部署，简单快捷
- 📱 **响应式设计** - 完美适配桌面和平板设备

## 🛠 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: shadcn-ui
- **代码编辑器**: Monaco Editor
- **状态管理**: React Context + Hooks
- **HTTP 客户端**: Axios

### 后端
- **框架**: NestJS
- **语言**: TypeScript
- **数据库**: MySQL 8.0
- **ORM**: TypeORM
- **缓存**: Redis
- **认证**: JWT + Passport
- **API 文档**: Swagger

### 部署
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx (可选)
- **进程管理**: PM2 (可选)

## 快速开始

### 前置要求
- Node.js 18+
- Docker & Docker Compose
- pnpm (推荐) 或 npm

### 开发环境

#### 1. 克隆项目
```bash
git clone <repository-url>
cd interview
```

#### 2. 启动 Docker 服务
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 3. 本地开发（不使用 Docker）

**后端开发**:
```bash
cd backend
pnpm install
cp .env.example .env
# 修改 .env 配置
pnpm run start:dev
```

**前端开发**:
```bash
cd frontend
pnpm install
cp .env.example .env.local
# 修改 .env.local 配置
pnpm dev
```

### 访问地址
- **前端**: http://localhost:3000
- **后端 API**: http://localhost:3001
- **API 文档**: http://localhost:3001/api
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

## 项目结构

```
interview/
├── frontend/              # Next.js 前端
│   ├── app/              # App Router 路由
│   ├── components/       # React 组件
│   ├── lib/             # 工具函数
│   ├── hooks/           # 自定义 Hooks
│   └── types/           # TypeScript 类型定义
├── backend/              # NestJS 后端
│   ├── src/
│   │   ├── auth/        # 认证模块
│   │   ├── users/       # 用户模块
│   │   ├── questions/   # 题库模块
│   │   ├── interviews/  # 面试模块
│   │   ├── submissions/ # 提交模块
│   │   └── common/      # 公共模块
│   └── test/            # 测试文件
├── docs/                 # 📚 项目文档 (统一文档目录)
│   ├── README.md        # 文档索引
│   ├── requirements/    # 需求文档
│   ├── development/     # 开发文档
│   ├── deployment/      # 部署文档
│   ├── design/          # 设计文档
│   └── testing/         # 测试文档
├── docker-compose.yml    # Docker 编排配置
└── README.md
```

## 功能模块

### 已实现
- [x] 用户注册/登录 (JWT 认证)
- [x] 角色权限控制 (候选人/面试官/管理员)
- [x] 题库管理 (CRUD)
- [x] 面试场次管理
- [x] 编程题提交与测试
- [x] 问答题提交
- [x] AI 自动评分

### 开发中
- [ ] 面试官复核界面
- [ ] 报告生成
- [ ] 统计仪表盘
- [ ] 代码执行沙箱

## 数据库设计

主要表结构：
- `users` - 用户表
- `roles` - 角色表
- `questions` - 题目表
- `interview_sessions` - 面试场次表
- `templates` - 面试模板表
- `submissions` - 提交记录表
- `score_records` - 评分记录表

详见 `backend/init.sql`

## API 文档

启动后端服务后访问: http://localhost:3001/api

## 环境变量

### 后端 (.env)
```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=interview_user
DATABASE_PASSWORD=interview_pass
DATABASE_NAME=interview_system
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### 前端 (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📚 文档

完整的项目文档已整理至 `docs/` 目录，包括：

- **[文档索引](docs/README.md)** - 查看所有文档的导航
- **[需求文档](docs/requirements/)** - 功能需求和规格说明
- **[开发指南](docs/development/DEVELOPMENT.md)** - 开发环境配置和开发流程
- **[部署文档](docs/deployment/DEPLOYMENT.md)** - 生产环境部署指南
- **[设计文档](docs/design/)** - UI设计系统和架构设计
- **[测试文档](docs/testing/)** - 测试用例和测试指南

## 开发指南

### 代码规范
- 使用 ESLint + Prettier
- 遵循 TypeScript 严格模式
- 使用 Conventional Commits

### 测试
```bash
# 后端单元测试
cd backend
pnpm test

# E2E 测试
pnpm test:e2e
```

详细测试文档请查看 [docs/testing/TESTING_GUIDE.md](docs/testing/TESTING_GUIDE.md)

## 部署

### 生产环境部署
```bash
# 构建并启动所有服务
docker-compose -f docker-compose.prod.yml up -d --build
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 联系方式

项目维护者: XXX

