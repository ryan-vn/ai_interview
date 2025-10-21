# Swagger API 文档使用指南

## 访问地址

启动后端服务后，可以通过以下地址访问 Swagger API 文档：

- **Swagger UI**: http://localhost:3001/api/docs
- **OpenAPI JSON**: http://localhost:3001/api/docs-json

## 功能特性

### 1. 完整的 API 文档
- ✅ 所有接口的详细说明
- ✅ 请求参数和响应格式
- ✅ 数据模型（Entity 和 DTO）
- ✅ 错误响应说明

### 2. 在线测试
Swagger UI 提供了在线测试功能，可以直接在浏览器中测试 API。

### 3. JWT 认证支持
- 点击右上角的 "Authorize" 按钮
- 输入 JWT token（格式：`Bearer your_token_here`）
- 之后的请求会自动携带认证信息

## 使用流程示例

### 1. 用户注册和登录

```bash
# 1. 注册新用户
POST /api/auth/register
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}

# 2. 登录获取 token
POST /api/auth/login
{
  "username": "testuser",
  "password": "password123"
}

# 响应示例
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": { "id": 1, "name": "candidate" }
  }
}

# 3. 使用 token 访问受保护的接口
GET /api/auth/profile
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 在 Swagger UI 中测试

1. 打开 http://localhost:3001/api/docs
2. 找到 `/api/auth/login` 接口
3. 点击 "Try it out" 按钮
4. 填写请求参数
5. 点击 "Execute" 执行请求
6. 复制响应中的 `access_token`
7. 点击页面右上角的 "Authorize" 按钮
8. 输入 token（会自动添加 `Bearer` 前缀）
9. 点击 "Authorize" 确认
10. 现在可以测试需要认证的接口了

## API 模块说明

### Auth 模块 - 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取当前用户信息 🔒

### Users 模块 - 用户管理
- `GET /api/users` - 获取所有用户 🔒 (面试官/管理员)
- `POST /api/users` - 创建用户 🔒 (管理员)
- `GET /api/users/:id` - 获取用户详情 🔒
- `PATCH /api/users/:id` - 更新用户信息 🔒
- `DELETE /api/users/:id` - 删除用户 🔒 (管理员)
- `GET /api/users/roles` - 获取所有角色 🔒

### Questions 模块 - 题库管理
- `GET /api/questions` - 获取所有题目 🔒
- `POST /api/questions` - 创建题目 🔒 (面试官/管理员)
- `GET /api/questions/:id` - 获取题目详情 🔒
- `PATCH /api/questions/:id` - 更新题目 🔒 (面试官/管理员)
- `DELETE /api/questions/:id` - 删除题目 🔒 (管理员)

### Interviews 模块 - 面试管理
- `GET /api/interviews/sessions` - 获取面试场次列表 🔒
- `POST /api/interviews/sessions` - 创建面试场次 🔒
- `GET /api/interviews/sessions/:id` - 获取面试场次详情 🔒
- `PATCH /api/interviews/sessions/:id/start` - 开始面试 🔒
- `PATCH /api/interviews/sessions/:id/complete` - 完成面试 🔒
- `GET /api/interviews/templates` - 获取所有模板 🔒
- `POST /api/interviews/templates` - 创建模板 🔒 (面试官/管理员)
- `GET /api/interviews/templates/:id` - 获取模板详情 🔒
- `DELETE /api/interviews/templates/:id` - 删除模板 🔒 (管理员)

### Submissions 模块 - 提交记录
- `GET /api/submissions` - 获取提交列表 🔒
- `POST /api/submissions` - 提交答案 🔒
- `GET /api/submissions/:id` - 获取提交详情 🔒

### Reports 模块 - 面试报告
- `POST /api/reports/generate/:sessionId` - 生成面试报告 🔒 (面试官/管理员)
- `GET /api/reports/session/:sessionId` - 获取面试报告 🔒
- `PATCH /api/reports/score/:submissionId` - 更新评分 🔒 (面试官/管理员)

🔒 表示需要 JWT 认证

## 数据模型

### 用户角色
1. **candidate** (ID: 1) - 候选人
2. **interviewer** (ID: 2) - 面试官
3. **admin** (ID: 3) - 管理员

### 题目类型
- **programming** - 编程题
- **qa** - 问答题

### 题目难度
- **easy** - 简单
- **medium** - 中等
- **hard** - 困难

### 面试状态
- **scheduled** - 已安排
- **in_progress** - 进行中
- **completed** - 已完成
- **cancelled** - 已取消

### 提交状态
- **pending** - 待处理
- **running** - 运行中
- **success** - 成功
- **failed** - 失败
- **timeout** - 超时
- **error** - 错误

## Swagger UI 功能

### 1. 过滤和搜索
- 使用顶部的搜索框快速查找接口
- 按标签（Tag）筛选接口

### 2. 展开/折叠
- 点击标签可以展开/折叠该模块的所有接口
- 点击 "docExpansion" 可以控制默认展开状态

### 3. 示例值
- 每个接口都提供了示例请求和响应
- 点击 "Example Value" 可以自动填充请求体

### 4. 响应预览
- 执行请求后可以看到完整的响应
- 包括状态码、响应头和响应体

## 导出 API 文档

### 导出为 JSON
```bash
curl http://localhost:3001/api/docs-json > openapi.json
```

### 导出为 YAML
```bash
curl http://localhost:3001/api/docs-json | yq eval -P - > openapi.yaml
```

### 使用 Postman 导入
1. 打开 Postman
2. 点击 "Import"
3. 选择 "Link"
4. 输入 `http://localhost:3001/api/docs-json`
5. 点击 "Continue" 导入

## 自定义配置

Swagger 配置位于 `src/main.ts` 文件中，可以根据需要修改：

```typescript
const config = new DocumentBuilder()
  .setTitle('AI Interview System API')
  .setDescription('API 描述')
  .setVersion('1.0.0')
  .addBearerAuth()
  .addTag('tag-name', '标签描述')
  .build();
```

## 常见问题

### Q: 为什么某些接口返回 401 Unauthorized？
A: 该接口需要 JWT 认证，请先登录获取 token，然后使用 Authorize 功能添加认证信息。

### Q: 如何测试文件上传接口？
A: Swagger UI 支持文件上传，在接口参数中选择文件即可。

### Q: 可以自定义 Swagger UI 的样式吗？
A: 可以，在 `src/main.ts` 中的 `SwaggerModule.setup()` 方法中添加 `customCss` 参数。

### Q: 如何在生产环境中禁用 Swagger？
A: 在 `src/main.ts` 中添加环境判断：
```typescript
if (process.env.NODE_ENV !== 'production') {
  // Swagger 配置
}
```

## 相关资源

- [NestJS Swagger 官方文档](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI 规范](https://swagger.io/specification/)
- [Swagger UI 文档](https://swagger.io/tools/swagger-ui/)

## 技术支持

如有问题，请联系：
- Email: support@example.com
- GitHub: https://github.com/yourcompany/interview-system

