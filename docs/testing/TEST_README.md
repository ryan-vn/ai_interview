# 后端测试指南

## 目录
- [测试概述](#测试概述)
- [测试环境准备](#测试环境准备)
- [运行测试](#运行测试)
- [测试覆盖率](#测试覆盖率)
- [测试文件说明](#测试文件说明)
- [编写测试](#编写测试)
- [常见问题](#常见问题)

---

## 测试概述

本项目包含全面的测试套件，覆盖所有后端API接口和业务逻辑。

### 测试类型

1. **E2E测试（端到端测试）**
   - 测试完整的API请求-响应流程
   - 测试数据库交互
   - 测试权限和认证
   - 位置: `test/*.e2e-spec.ts`

2. **单元测试**
   - 测试单个函数和类
   - Mock外部依赖
   - 位置: `src/**/*.spec.ts`

### 测试统计

- **总测试用例数**: 200+
- **测试模块**: 5个主要模块（Auth, Users, Questions, Interviews, Submissions）
- **覆盖的场景**: 正常流程、异常处理、权限验证、数据验证

---

## 测试环境准备

### 前置要求

1. **Node.js**: v18+
2. **数据库**: MySQL 8.0（测试数据库）
3. **Redis**: 用于缓存（可选）

### 环境配置

1. **创建测试数据库**

```bash
# 登录MySQL
mysql -u root -p

# 创建测试数据库
CREATE DATABASE interview_system_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建测试用户
CREATE USER 'test_user'@'localhost' IDENTIFIED BY 'test_password';
GRANT ALL PRIVILEGES ON interview_system_test.* TO 'test_user'@'localhost';
FLUSH PRIVILEGES;
```

2. **配置环境变量**

创建 `.env.test` 文件：

```env
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=test_user
DATABASE_PASSWORD=test_password
DATABASE_NAME=interview_system_test

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT配置
JWT_SECRET=test_jwt_secret_key_for_testing
JWT_EXPIRES_IN=1d

# API配置
PORT=3002
NODE_ENV=test
```

3. **安装依赖**

```bash
cd backend
npm install
# 或
pnpm install
```

4. **初始化测试数据库**

```bash
# 运行数据库迁移
npm run migration:run

# 或直接导入初始化脚本
mysql -u test_user -p interview_system_test < init.sql
```

---

## 运行测试

### 运行所有测试

```bash
# 运行所有测试
npm test

# 运行E2E测试
npm run test:e2e

# 运行单元测试（如果有）
npm test -- --testPathPattern='\.spec\.ts$'
```

### 运行特定模块的测试

```bash
# 只运行认证模块测试
npm run test:e2e -- auth.e2e-spec.ts

# 只运行用户模块测试
npm run test:e2e -- users.e2e-spec.ts

# 只运行题目模块测试
npm run test:e2e -- questions.e2e-spec.ts

# 只运行面试模块测试
npm run test:e2e -- interviews.e2e-spec.ts

# 只运行提交模块测试
npm run test:e2e -- submissions.e2e-spec.ts
```

### 运行特定测试用例

```bash
# 使用 --testNamePattern 运行特定测试
npm run test:e2e -- --testNamePattern="应该成功注册候选人账户"

# 运行包含特定描述的测试
npm run test:e2e -- --testNamePattern="用户注册"
```

### 监听模式（开发时使用）

```bash
# 监听文件变化，自动运行测试
npm run test:watch

# E2E测试监听模式
npm run test:e2e -- --watch
```

### 调试模式

```bash
# 使用Node调试器
npm run test:debug

# 使用VSCode调试
# 1. 在VSCode中打开调试面板
# 2. 选择 "Jest Debug" 配置
# 3. 设置断点
# 4. 按F5启动调试
```

---

## 测试覆盖率

### 生成覆盖率报告

```bash
# 运行测试并生成覆盖率报告
npm run test:cov

# E2E测试覆盖率
npm run test:e2e -- --coverage

# 查看HTML覆盖率报告
open coverage/lcov-report/index.html
```

### 覆盖率目标

- **语句覆盖率（Statement）**: > 80%
- **分支覆盖率（Branch）**: > 75%
- **函数覆盖率（Function）**: > 80%
- **行覆盖率（Line）**: > 80%

### 覆盖率报告示例

```
---------------------------|---------|----------|---------|---------|-------------------
File                       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------------|---------|----------|---------|---------|-------------------
All files                  |   85.23 |    78.45 |   82.15 |   85.67 |
 auth                      |   92.45 |    85.23 |   90.15 |   92.78 |
  auth.controller.ts       |   95.12 |    88.45 |   93.25 |   95.34 | 45,67
  auth.service.ts          |   89.78 |    82.01 |   87.05 |   90.22 | 123,145-150
 users                     |   88.34 |    80.12 |   85.45 |   88.56 |
  users.controller.ts      |   91.23 |    83.45 |   88.12 |   91.45 |
  users.service.ts         |   85.45 |    76.79 |   82.78 |   85.67 | 78,92-95
...
---------------------------|---------|----------|---------|---------|-------------------
```

---

## 测试文件说明

### 测试文件结构

```
backend/
├── test/
│   ├── jest-e2e.json           # E2E测试Jest配置
│   ├── test-helper.ts          # 测试辅助函数
│   ├── auth.e2e-spec.ts        # 认证模块测试
│   ├── users.e2e-spec.ts       # 用户模块测试
│   ├── questions.e2e-spec.ts   # 题目模块测试
│   ├── interviews.e2e-spec.ts  # 面试模块测试
│   └── submissions.e2e-spec.ts # 提交模块测试
├── src/
│   └── **/*.spec.ts            # 单元测试文件
├── TEST_CASES.md               # 详细测试用例文档
└── TEST_README.md              # 本文件
```

### 各模块测试说明

#### 1. auth.e2e-spec.ts - 认证模块测试

测试内容：
- ✅ 用户注册（各角色）
- ✅ 用户登录（用户名/邮箱）
- ✅ 获取用户信息
- ✅ Token验证
- ✅ 数据验证（邮箱格式、密码强度等）
- ✅ 错误处理（重复注册、错误密码等）

测试用例数：20+

#### 2. users.e2e-spec.ts - 用户模块测试

测试内容：
- ✅ CRUD操作（创建、读取、更新、删除）
- ✅ 角色权限验证
- ✅ 获取角色列表
- ✅ 用户信息查询和筛选
- ✅ 数据验证
- ✅ 权限控制

测试用例数：30+

#### 3. questions.e2e-spec.ts - 题目模块测试

测试内容：
- ✅ 题目创建（编程题/问答题）
- ✅ 题目查询和筛选
- ✅ 题目更新和删除
- ✅ 按类型和难度筛选
- ✅ 权限验证
- ✅ 数据验证

测试用例数：35+

#### 4. interviews.e2e-spec.ts - 面试模块测试

测试内容：
- ✅ 模板管理（创建、查询、删除）
- ✅ 面试场次管理
- ✅ 开始/完成面试
- ✅ 权限验证
- ✅ 状态流转
- ✅ 数据验证

测试用例数：40+

#### 5. submissions.e2e-spec.ts - 提交模块测试

测试内容：
- ✅ 提交编程题答案
- ✅ 提交问答题答案
- ✅ 查询提交记录
- ✅ 权限验证
- ✅ 数据验证
- ✅ 重复提交处理

测试用例数：30+

---

## 编写测试

### 测试模板

```typescript
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, registerAndLogin } from './test-helper';

describe('YourModule (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    const userData = await registerAndLogin(app, {
      username: 'test_user',
      email: 'test@test.com',
      password: 'Test123456!',
      roleId: 1,
    });
    token = userData.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /your-endpoint', () => {
    it('should work correctly', () => {
      return request(app.getHttpServer())
        .post('/your-endpoint')
        .set('Authorization', `Bearer ${token}`)
        .send({ data: 'test' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
        });
    });
  });
});
```

### 测试最佳实践

1. **测试命名**
   - 使用描述性的测试名称
   - 使用 "should" 开头描述期望行为
   - 例如: "应该成功创建用户", "应该返回401错误"

2. **测试隔离**
   - 每个测试应该独立运行
   - 使用 `beforeEach` 创建测试数据
   - 使用 `afterEach` 清理测试数据

3. **使用辅助函数**
   - 复用 `test-helper.ts` 中的函数
   - 创建特定模块的辅助函数
   - 避免重复代码

4. **断言检查**
   - 验证HTTP状态码
   - 验证响应体结构
   - 验证数据库状态（如需要）

5. **错误场景**
   - 测试正常流程
   - 测试边界条件
   - 测试错误处理
   - 测试权限验证

### 示例：完整的测试用例

```typescript
describe('POST /users - 创建用户', () => {
  it('管理员应该能成功创建用户', async () => {
    // Arrange - 准备测试数据
    const userData = {
      username: 'new_user_' + Date.now(),
      email: `new_user_${Date.now()}@test.com`,
      password: 'Test123456!',
      roleId: 3,
    };

    // Act - 执行操作
    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(userData);

    // Assert - 验证结果
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(userData.username);
    expect(response.body.email).toBe(userData.email);
    expect(response.body).not.toHaveProperty('password');
  });

  it('候选人尝试创建用户应该返回403', () => {
    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        username: 'test',
        email: 'test@test.com',
        password: 'Test123456!',
        roleId: 3,
      })
      .expect(403);
  });
});
```

---

## 常见问题

### Q1: 测试运行失败，提示数据库连接错误

**A**: 检查以下几点：
1. 确认MySQL服务正在运行
2. 确认 `.env.test` 配置正确
3. 确认测试数据库已创建
4. 确认数据库用户权限正确

```bash
# 检查MySQL服务状态
systemctl status mysql
# 或
brew services list | grep mysql

# 测试数据库连接
mysql -u test_user -p -h localhost interview_system_test
```

### Q2: 测试运行很慢

**A**: 可以采取以下措施：
1. 只运行特定模块的测试
2. 使用测试数据库（而不是真实数据库）
3. 使用内存数据库（如SQLite）进行快速测试
4. 并行运行测试：`npm test -- --maxWorkers=4`

### Q3: 测试之间互相干扰

**A**: 确保：
1. 每个测试使用唯一的测试数据（使用 `Date.now()` 或UUID）
2. 在 `beforeEach`/`afterEach` 中正确清理数据
3. 不要依赖其他测试的执行顺序
4. 使用测试事务（如果可能）

### Q4: Token过期导致测试失败

**A**: 
1. 在 `.env.test` 中设置较长的token过期时间
2. 在每个测试前重新获取token
3. 使用mock的token验证

### Q5: 如何跳过某些测试

**A**: 
```typescript
// 跳过单个测试
it.skip('暂时跳过这个测试', () => {
  // 测试代码
});

// 跳过整个测试套件
describe.skip('User Module', () => {
  // 测试代码
});

// 只运行特定测试
it.only('只运行这个测试', () => {
  // 测试代码
});
```

### Q6: 如何测试文件上传

**A**: 
```typescript
import * as path from 'path';

it('应该能上传文件', () => {
  return request(app.getHttpServer())
    .post('/upload')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', path.join(__dirname, 'test-file.txt'))
    .expect(201);
});
```

### Q7: 如何Mock外部API调用

**A**: 
```typescript
import * as nock from 'nock';

// Mock外部API
nock('https://api.external.com')
  .post('/endpoint')
  .reply(200, { success: true });

// 运行测试
// ...
```

### Q8: 测试覆盖率报告在哪里

**A**: 
- HTML报告: `coverage/lcov-report/index.html`
- LCOV报告: `coverage/lcov.info`
- JSON报告: `coverage/coverage-final.json`

### Q9: 如何在CI/CD中运行测试

**A**: 
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
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
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## 测试报告

### 生成测试报告

```bash
# 生成JUnit XML报告
npm test -- --reporters=default --reporters=jest-junit

# 生成HTML报告
npm test -- --reporters=default --reporters=jest-html-reporter
```

### 查看测试结果

测试报告会生成在：
- `test-results/junit.xml` - JUnit格式
- `test-results/test-report.html` - HTML格式

---

## 持续集成

### 推荐的CI流程

1. **代码检查**
   ```bash
   npm run lint
   ```

2. **运行测试**
   ```bash
   npm test
   npm run test:e2e
   ```

3. **检查覆盖率**
   ```bash
   npm run test:cov
   ```

4. **生成报告**
   ```bash
   npm test -- --coverage --reporters=jest-junit
   ```

---

## 参考资源

- [NestJS Testing文档](https://docs.nestjs.com/fundamentals/testing)
- [Jest文档](https://jestjs.io/docs/getting-started)
- [Supertest文档](https://github.com/visionmedia/supertest)
- [测试用例文档](./TEST_CASES.md)

---

## 联系方式

如有问题或建议，请联系：
- 项目维护者: XXX
- Email: xxx@example.com

---

**最后更新**: 2025-10-21

