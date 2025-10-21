# 开发指南

本文档为开发者提供项目开发的详细指南。

## 开发环境设置

### 前置要求

- Node.js 18+
- pnpm 8+ (推荐) 或 npm 9+
- Docker & Docker Compose
- Git

### 快速开始

1. **克隆项目**

```bash
git clone <repository-url>
cd interview
```

2. **安装依赖**

```bash
# 后端
cd backend
pnpm install

# 前端
cd ../frontend
pnpm install
```

3. **配置环境变量**

```bash
# 后端
cd backend
cp env.example .env
# 编辑 .env 文件

# 前端
cd ../frontend
cp env.local.example .env.local
# 编辑 .env.local 文件
```

4. **启动数据库服务**

```bash
# 返回项目根目录
cd ..

# 使用脚本启动（推荐）
./dev.sh

# 或手动启动
docker compose up -d mysql redis
```

5. **启动开发服务器**

```bash
# 终端 1 - 后端
cd backend
pnpm run start:dev

# 终端 2 - 前端
cd frontend
pnpm run dev
```

6. **访问应用**

- 前端：http://localhost:3000
- 后端 API：http://localhost:3001
- API 文档：http://localhost:3001/api/docs

## 项目结构

```
interview/
├── backend/                # NestJS 后端
│   ├── src/
│   │   ├── auth/          # 认证模块
│   │   ├── users/         # 用户模块
│   │   ├── questions/     # 题库模块
│   │   ├── interviews/    # 面试模块
│   │   ├── submissions/   # 提交模块
│   │   ├── reports/       # 报告模块
│   │   ├── common/        # 公共模块
│   │   ├── app.module.ts  # 根模块
│   │   └── main.ts        # 入口文件
│   ├── init.sql           # 数据库初始化脚本
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # Next.js 前端
│   ├── app/               # App Router
│   │   ├── page.tsx       # 首页
│   │   ├── login/         # 登录页
│   │   ├── register/      # 注册页
│   │   ├── dashboard/     # 仪表盘
│   │   └── globals.css    # 全局样式
│   ├── components/        # React 组件
│   │   └── ui/           # shadcn-ui 组件
│   ├── lib/              # 工具函数
│   │   ├── api.ts        # API 客户端
│   │   └── utils.ts      # 工具函数
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml     # Docker 编排配置
├── .gitignore
├── README.md
├── DEVELOPMENT.md         # 本文件
└── DEPLOYMENT.md          # 部署指南
```

## 开发规范

### 代码风格

项目使用 ESLint 和 Prettier 进行代码格式化：

```bash
# 后端
cd backend
pnpm run lint
pnpm run format

# 前端
cd frontend
pnpm run lint
```

### Git 提交规范

使用 Conventional Commits 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```
feat(auth): 添加 JWT 认证功能

- 实现用户登录接口
- 添加 JWT token 验证
- 实现角色权限控制

Closes #123
```

### 分支管理

- `main`: 主分支，用于生产环境
- `develop`: 开发分支
- `feature/*`: 功能分支
- `bugfix/*`: 修复分支
- `hotfix/*`: 紧急修复分支

工作流程：
```bash
# 创建功能分支
git checkout -b feature/new-feature develop

# 开发完成后合并到 develop
git checkout develop
git merge --no-ff feature/new-feature

# 删除功能分支
git branch -d feature/new-feature
```

## 后端开发

### 创建新模块

```bash
cd backend

# 使用 NestJS CLI 生成模块
nest generate module moduleName
nest generate controller moduleName
nest generate service moduleName

# 生成完整的 CRUD 资源
nest generate resource moduleName
```

### 数据库操作

```bash
# 生成迁移文件
pnpm run typeorm migration:generate -- -n MigrationName

# 运行迁移
pnpm run typeorm migration:run

# 回滚迁移
pnpm run typeorm migration:revert
```

### API 测试

使用 Swagger UI 进行 API 测试：
- 访问：http://localhost:3001/api/docs
- 点击 "Authorize" 输入 JWT token
- 测试各个 API 端点

### 单元测试

```bash
cd backend

# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test -- users.service.spec.ts

# 生成测试覆盖率报告
pnpm test:cov

# E2E 测试
pnpm test:e2e
```

## 前端开发

### 创建新页面

```bash
# 在 app 目录下创建新路由
cd frontend/app
mkdir new-page
touch new-page/page.tsx
```

### 添加 shadcn-ui 组件

```bash
# 使用 shadcn-ui CLI 添加组件
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
```

### 状态管理

项目使用 React Context + Hooks 进行状态管理：

```tsx
// 创建 Context
import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(initialState);
  
  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
}

// 使用 Context
export function useApp() {
  return useContext(AppContext);
}
```

### API 调用

```tsx
import { questionsApi } from '@/lib/api';

// 在组件中使用
const fetchQuestions = async () => {
  try {
    const response = await questionsApi.getAll();
    setQuestions(response.data);
  } catch (error) {
    console.error('Failed to fetch questions:', error);
  }
};
```

## 调试技巧

### 后端调试

使用 VSCode 调试配置 (`.vscode/launch.json`)：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "start:debug"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

### 前端调试

1. **Chrome DevTools**
   - F12 打开开发者工具
   - 使用 React DevTools 扩展

2. **Next.js 调试**
   - 在代码中添加 `debugger` 语句
   - 使用 VSCode 断点调试

### 数据库调试

```bash
# 连接到 MySQL 容器
docker compose exec mysql mysql -u interview_user -p interview_system

# 查看日志
docker compose logs -f mysql

# 执行 SQL 查询
mysql> SELECT * FROM users;
```

## 常见开发任务

### 添加新的 API 端点

1. 在对应的 service 中添加方法
2. 在 controller 中添加路由处理
3. 添加 DTO 验证
4. 更新 Swagger 文档注解
5. 编写单元测试

### 添加新页面

1. 在 `frontend/app` 下创建路由目录
2. 创建 `page.tsx` 文件
3. 实现页面组件
4. 添加 API 调用
5. 测试页面功能

### 添加数据库表

1. 创建 Entity 类
2. 在模块中注册 Entity
3. 生成并运行迁移
4. 更新初始化脚本 `init.sql`

## 性能优化

### 后端优化

- 使用 Redis 缓存频繁访问的数据
- 优化数据库查询（索引、连接查询）
- 使用分页减少数据传输量
- 实现 API 响应压缩

### 前端优化

- 使用 Next.js 的 Image 组件优化图片
- 实现代码分割和懒加载
- 使用 React.memo 避免不必要的渲染
- 优化 API 调用（缓存、防抖、节流）

## 安全最佳实践

1. **输入验证**
   - 使用 class-validator 验证所有输入
   - 防止 SQL 注入、XSS 攻击

2. **认证授权**
   - 使用 JWT 进行身份验证
   - 实现基于角色的访问控制 (RBAC)

3. **敏感信息**
   - 不要在代码中硬编码密钥
   - 使用环境变量管理配置
   - 不要提交 `.env` 文件到 Git

4. **依赖安全**
   - 定期更新依赖包
   - 使用 `npm audit` 检查漏洞

## 故障排除

### 常见问题

1. **端口冲突**
   - 修改 `docker-compose.yml` 或 `.env` 中的端口配置

2. **数据库连接失败**
   - 检查数据库是否启动
   - 验证环境变量配置

3. **CORS 错误**
   - 检查后端 CORS 配置
   - 验证前端 API URL

4. **类型错误**
   - 运行 `pnpm install` 更新类型定义
   - 检查 TypeScript 配置

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

Pull Request 要求：
- 遵循代码规范
- 包含必要的测试
- 更新相关文档
- 通过 CI/CD 检查

## 资源链接

- [NestJS 文档](https://docs.nestjs.com/)
- [Next.js 文档](https://nextjs.org/docs)
- [shadcn-ui 文档](https://ui.shadcn.com/)
- [TypeORM 文档](https://typeorm.io/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

## 联系方式

如有问题，请：
- 提交 Issue
- 发送邮件至：dev@example.com
- 加入开发者群组

