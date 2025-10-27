# 面试管理系统 - 后端服务

基于 NestJS 的企业内部面试管理系统后端API服务。

## 功能模块

### 1. 岗位管理 (Jobs)
- 岗位的增删改查
- 岗位状态管理（开放/关闭）
- 部门分类
- 技能关键词管理（用于匹配度计算）

### 2. 简历管理 (Resumes)
- 简历上传与解析（支持PDF、DOC、DOCX、TXT、JSON）
- 结构化存储（姓名、联系方式、技能、经历等）
- 简历状态管理（新简历、筛选中、面试中、已发Offer等）
- 关联岗位功能

### 3. 题库管理 (Questions)
- 题目增删改查
- 支持多种题型（编程题、问答题、行为面试题、技术问答题）
- 标签系统（分类管理、层级结构）
- 批量导入题目
- 题目统计

### 4. 面试管理 (Interviews)
- 创建面试场次
- 面试邀请链接生成
- 面试状态管理
- 关联岗位和简历
- 面试模板管理

### 5. 匹配度与推荐 (Matching)
- 简历与岗位匹配度计算（基于Jaccard相似度）
- 为简历推荐合适的岗位
- 为岗位推荐合适的候选人
- 批量计算匹配度

### 6. 其他模块
- 用户管理 (Users)
- 认证授权 (Auth)
- 提交管理 (Submissions)
- 面试报告 (Reports)

## 技术栈

- **框架**: NestJS
- **数据库**: MySQL 8.0
- **ORM**: TypeORM
- **认证**: JWT
- **文档**: Swagger/OpenAPI
- **语言**: TypeScript

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 8.0
- pnpm (推荐) 或 npm

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
cp env.example .env
```

主要配置项：
```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=interview_user
DATABASE_PASSWORD=interview_pass
DATABASE_NAME=interview_system

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### 数据库初始化

执行数据库初始化脚本：

```bash
mysql -u interview_user -p interview_system < init.sql
```

或使用 Docker Compose（如果数据库在容器中）：

```bash
docker cp init.sql interview-mysql:/tmp/
docker exec -it interview-mysql mysql -u interview_user -p interview_system < /tmp/init.sql
```

**注意**：`init.sql` 包含了所有表结构、索引、外键和初始数据，新系统只需执行一次即可。

### 启动服务

```bash
# 开发模式
pnpm run start:dev

# 生产模式
pnpm run build
pnpm run start:prod
```

服务将在 `http://localhost:3000` 启动。

### 访问API文档

启动服务后，访问 Swagger文档：

```
http://localhost:3000/api
```

## API概览

### 岗位管理
- `GET /jobs` - 获取岗位列表
- `POST /jobs` - 创建岗位
- `GET /jobs/:id` - 获取岗位详情
- `PATCH /jobs/:id` - 更新岗位
- `DELETE /jobs/:id` - 删除岗位

### 简历管理
- `GET /resumes` - 获取简历列表
- `POST /resumes` - 创建简历（手动录入）
- `POST /resumes/upload` - 上传简历文件
- `GET /resumes/:id` - 获取简历详情
- `PATCH /resumes/:id` - 更新简历
- `PATCH /resumes/:id/link-job/:jobId` - 关联岗位

### 题库管理
- `GET /questions` - 获取题目列表
- `POST /questions` - 创建题目
- `POST /questions/import` - 批量导入题目
- `GET /questions/:id` - 获取题目详情
- `PATCH /questions/:id` - 更新题目
- `DELETE /questions/:id` - 删除题目

### 标签管理
- `GET /question-tags` - 获取标签列表
- `GET /question-tags/tree` - 获取标签树
- `POST /question-tags` - 创建标签
- `PATCH /question-tags/:id` - 更新标签
- `DELETE /question-tags/:id` - 删除标签

### 匹配与推荐
- `GET /matching/calculate?resumeId=1&jobId=1` - 计算匹配度
- `GET /matching/recommend-jobs?resumeId=1` - 为简历推荐岗位
- `GET /matching/recommend-resumes?jobId=1` - 为岗位推荐候选人
- `POST /matching/batch-calculate` - 批量计算匹配度

## 项目结构

```
backend/
├── src/
│   ├── auth/              # 认证模块
│   ├── users/             # 用户管理
│   ├── jobs/              # 岗位管理
│   ├── resumes/           # 简历管理
│   ├── questions/         # 题库管理
│   ├── interviews/        # 面试管理
│   ├── submissions/       # 提交管理
│   ├── reports/           # 报告管理
│   ├── matching/          # 匹配推荐
│   ├── common/            # 公共模块
│   ├── app.module.ts      # 主模块
│   └── main.ts            # 入口文件
├── init.sql               # 数据库初始化脚本
├── DATABASE_SCHEMA.md     # 数据库架构说明
├── uploads/               # 文件上传目录
│   └── resumes/           # 简历文件
├── test/                  # 测试文件
├── package.json
└── tsconfig.json
```

## 开发指南

### 角色权限

系统内置三种角色：
- `admin` - 管理员（所有权限）
- `hr` - HR（招聘相关权限）
- `interviewer` - 面试官（面试评价权限）
- `candidate` - 候选人（参加面试）

### 认证流程

1. 用户登录获取JWT Token
2. 在请求头中携带 Token：`Authorization: Bearer <token>`
3. 服务端验证Token并识别用户身份和角色

### 添加新模块

1. 使用NestJS CLI生成模块：
```bash
nest g module <module-name>
nest g controller <module-name>
nest g service <module-name>
```

2. 创建实体（Entity）
3. 创建DTO（Data Transfer Object）
4. 实现业务逻辑
5. 添加Swagger文档注解

## 测试

```bash
# 单元测试
pnpm run test

# e2e测试
pnpm run test:e2e

# 测试覆盖率
pnpm run test:cov
```

## 部署

参考 [部署文档](../docs/deployment/DEPLOYMENT.md)

## 相关文档

- [产品需求文档 (PRD)](../docs/PRD.md)
- [功能设计文档 (FSD)](../docs/FSD.md)
- [技术架构文档 (TAD)](../docs/TAD.md)

## License

MIT

