# 测试快速开始指南

## 快速设置（推荐）

### 使用自动化脚本

1. **赋予脚本执行权限**
   ```bash
   cd backend
   chmod +x test/setup-test.sh
   ```

2. **运行设置脚本**
   ```bash
   ./test/setup-test.sh
   ```
   
   脚本会自动完成：
   - ✅ 检查环境依赖
   - ✅ 创建测试数据库
   - ✅ 生成配置文件
   - ✅ 安装依赖包
   - ✅ 初始化数据库
   - ✅ 运行验证测试

3. **开始测试**
   ```bash
   npm run test:e2e
   ```

---

## 手动设置

### 步骤1: 创建测试数据库

```bash
mysql -u root -p
```

```sql
CREATE DATABASE interview_system_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'test_user'@'localhost' IDENTIFIED BY 'test_password';
GRANT ALL PRIVILEGES ON interview_system_test.* TO 'test_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 步骤2: 配置环境变量

在 `backend` 目录下创建 `.env.test` 文件：

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=test_user
DATABASE_PASSWORD=test_password
DATABASE_NAME=interview_system_test

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=test_jwt_secret_key_for_testing
JWT_EXPIRES_IN=1d

PORT=3002
NODE_ENV=test
```

### 步骤3: 安装依赖

```bash
cd backend
npm install
```

### 步骤4: 初始化数据库

```bash
mysql -u test_user -ptest_password interview_system_test < init.sql
```

### 步骤5: 运行测试

```bash
npm run test:e2e
```

---

## 常用测试命令

### 基础命令

```bash
# 运行所有E2E测试
npm run test:e2e

# 运行所有测试
npm test

# 生成覆盖率报告
npm run test:cov

# 监听模式（开发时使用）
npm run test:watch
```

### 运行特定模块测试

```bash
# 认证模块
npm run test:e2e -- auth.e2e-spec.ts

# 用户模块
npm run test:e2e -- users.e2e-spec.ts

# 题目模块
npm run test:e2e -- questions.e2e-spec.ts

# 面试模块
npm run test:e2e -- interviews.e2e-spec.ts

# 提交模块
npm run test:e2e -- submissions.e2e-spec.ts
```

### 运行特定测试用例

```bash
# 运行包含特定关键词的测试
npm run test:e2e -- --testNamePattern="注册"

# 运行包含"登录"的测试
npm run test:e2e -- --testNamePattern="登录"
```

---

## 测试文件说明

| 文件 | 说明 | 测试用例数 |
|------|------|-----------|
| `test/auth.e2e-spec.ts` | 认证模块测试（注册、登录、Token验证） | 20+ |
| `test/users.e2e-spec.ts` | 用户模块测试（CRUD、权限） | 30+ |
| `test/questions.e2e-spec.ts` | 题目模块测试（编程题、问答题） | 35+ |
| `test/interviews.e2e-spec.ts` | 面试模块测试（模板、场次、状态） | 40+ |
| `test/submissions.e2e-spec.ts` | 提交模块测试（答案提交、查询） | 30+ |

**总计**: 150+ 个测试用例

---

## 测试覆盖的功能

### ✅ 认证与授权
- 用户注册（三种角色）
- 用户登录（用户名/邮箱）
- Token验证（有效、过期、无效）
- 权限控制（RBAC）

### ✅ 用户管理
- 用户CRUD操作
- 角色管理
- 权限验证
- 数据验证

### ✅ 题库管理
- 编程题创建和管理
- 问答题创建和管理
- 题目筛选（类型、难度）
- 权限控制

### ✅ 面试管理
- 面试模板创建
- 面试场次管理
- 面试状态流转（pending → in_progress → completed）
- 权限验证

### ✅ 答案提交
- 编程题提交
- 问答题提交
- 提交记录查询
- 权限验证

### ✅ 数据验证
- 输入格式验证
- 边界值测试
- SQL注入防护
- XSS防护

### ✅ 错误处理
- 400 - 参数错误
- 401 - 未授权
- 403 - 权限不足
- 404 - 资源不存在
- 409 - 资源冲突

---

## 测试报告示例

```
Test Suites: 5 passed, 5 total
Tests:       155 passed, 155 total
Snapshots:   0 total
Time:        45.234 s
Ran all test suites.

------------------------|---------|----------|---------|---------|-------------------
File                    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------------|---------|----------|---------|---------|-------------------
All files               |   87.45 |    82.34 |   85.67 |   87.89 |
 auth/                  |   92.15 |    88.45 |   90.23 |   92.45 |
 users/                 |   88.67 |    83.12 |   86.78 |   89.01 |
 questions/             |   85.23 |    79.45 |   83.56 |   85.67 |
 interviews/            |   86.34 |    81.23 |   84.45 |   86.78 |
 submissions/           |   89.12 |    84.56 |   87.89 |   89.45 |
------------------------|---------|----------|---------|---------|-------------------
```

---

## 持续集成 (CI/CD)

### GitHub Actions 配置示例

在 `.github/workflows/test.yml`:

```yaml
name: Backend Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: interview_system_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Setup database
        run: |
          cd backend
          mysql -h 127.0.0.1 -u root -proot interview_system_test < init.sql

      - name: Run tests
        run: |
          cd backend
          npm run test:cov
        env:
          DATABASE_HOST: 127.0.0.1
          DATABASE_PORT: 3306
          DATABASE_USER: root
          DATABASE_PASSWORD: root
          DATABASE_NAME: interview_system_test
          REDIS_HOST: 127.0.0.1
          REDIS_PORT: 6379
          JWT_SECRET: test_secret
          NODE_ENV: test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend
```

---

## 故障排除

### 问题1: 数据库连接失败

```bash
# 检查MySQL服务
sudo systemctl status mysql
# 或
brew services list

# 检查端口占用
lsof -i :3306

# 测试连接
mysql -u test_user -ptest_password -h localhost interview_system_test
```

### 问题2: 测试超时

在 `jest-e2e.json` 中增加超时时间：

```json
{
  "testTimeout": 30000
}
```

### 问题3: 端口冲突

修改 `.env.test` 中的端口：

```env
PORT=3003
```

### 问题4: Redis连接错误

如果不使用Redis，可以在测试中mock Redis服务。

---

## 查看详细文档

- 📘 [TEST_README.md](./TEST_README.md) - 完整测试指南
- 📋 [TEST_CASES.md](./TEST_CASES.md) - 详细测试用例文档
- 🔧 [test-helper.ts](./test/test-helper.ts) - 测试辅助函数

---

## 需要帮助？

如遇到问题，请：
1. 查看 [TEST_README.md](./TEST_README.md) 的常见问题章节
2. 查看测试日志输出
3. 运行单个测试模块进行诊断
4. 联系项目维护者

---

**祝测试顺利！** 🎉

