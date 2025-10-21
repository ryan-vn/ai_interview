# AI 面试系统 - 详细需求分析文档

**项目名称**：AI 面试系统（暂定）  
**参赛者**：XXX（个人／团队）  
**日期**：2025-10-21  
**版本**：v1.0 详细版

---

## 目录
- [一、项目概述](#一项目概述)
- [二、功能详细需求分析](#二功能详细需求分析)
- [三、技术栈说明](#三技术栈说明)
- [四、数据模型](#四数据模型)
- [五、开发计划](#五开发计划)

---

## 一、项目概述

### 1.1 项目背景
公司组织的 "AI Coding 竞赛" 要求参赛者基于用户故事自定义一个面试系统。该系统旨在模拟技术／行为面试流程，候选人在线答题，系统生成初步评分，面试官复核，生成报告。项目也旨在让参赛者体验人机协作开发流程。

### 1.2 目标受众
- **候选人**：参与面试的应聘者或内部晋升者
- **面试官／HR**：负责审核和评估候选人表现
- **系统管理员**：负责题库管理、用户管理、系统配置

### 1.3 核心价值
- 提高面试效率，减少人工重复工作
- AI 辅助评分，提供客观评估建议
- 标准化面试流程，保证公平性
- 数据化管理，支持统计分析和优化

### 1.4 术语说明
- **候选人**：参与面试的用户
- **面试官**：负责审核候选人答题的用户
- **题库**：系统中的题目集合（编程题／问答题）
- **AI 评分**：系统利用 AI 模型对候选人提交内容初步评估得分
- **面试场次**：一次完整的面试活动，包含多道题目
- **沙箱**：隔离的代码执行环境，确保安全性

### 1.5 范围说明

**包含范围**：
- ✅ 候选人注册、登录、角色管理
- ✅ 候选人面试流程（选题、答题、提交）
- ✅ 内置代码编辑器 + 测试执行机制
- ✅ 问答题文字输入（后可拓展语音）
- ✅ 自动评分模块（编程测试 + AI 评分）
- ✅ 面试官后台（查看提交、复核评分）
- ✅ 报告生成（得分、反馈、建议）
- ✅ 题库管理（CRUD、标签、难度）
- ✅ 面试场次管理（创建、配置、监控）

**不包含范围（暂定）**：
- ❌ 视频面试（摄像／实时交互）
- ❌ 多人在线面试（只支持一对一）
- ❌ 高级作弊监控（摄像头、浏览器切换检测）
- ❌ 多语言版本（初期仅中文界面）
- ❌ 移动端 App（仅支持 Web）

**依赖关系与假设**：
- 系统可访问 AI 评分服务（OpenAI API 或本地模型）
- 题库初期容量 ≤ 50 题，后期可扩展
- 用户使用现代浏览器（Chrome 90+, Edge 90+, Safari 14+）
- 支持 Docker 容器化部署

---

## 二、功能详细需求分析

### 模块 1：用户角色与认证

#### F1：用户注册／登录

**优先级**：Must Have  
**预估工时**：2 人日

**功能描述**：
实现用户注册和登录功能，支持三种角色（候选人、面试官、管理员），使用邮箱+密码方式认证。

**输入**：
- 注册：
  - `username` (string, 3-20字符，字母数字下划线)
  - `email` (string, 有效邮箱格式)
  - `password` (string, 8-32字符，含大小写+数字)
  - `confirmPassword` (string, 与password一致)
  - `roleType` (enum: 'candidate' | 'interviewer' | 'admin')
- 登录：
  - `identifier` (string, 邮箱或用户名)
  - `password` (string)

**输出**：
- 注册成功：
  ```json
  {
    "success": true,
    "message": "注册成功，请登录",
    "userId": 123
  }
  ```
- 登录成功：
  ```json
  {
    "success": true,
    "token": "jwt_token_string",
    "user": {
      "id": 123,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "candidate"
    }
  }
  ```

**业务规则**：
1. 邮箱唯一性：同一邮箱只能注册一次
2. 密码安全性：
   - 最小长度 8 字符
   - 必须包含大写字母、小写字母、数字
   - 使用 bcrypt 加密存储（salt rounds = 10）
3. Token 管理：
   - JWT Token 有效期 24 小时
   - Refresh Token 有效期 7 天
   - Token 包含：userId, role, email, iat, exp
4. 角色审批：
   - 候选人角色自动激活
   - 面试官/管理员角色需要管理员审批
5. 登录限制：
   - 连续失败 5 次，锁定账号 15 分钟
   - 记录登录历史（IP、时间、设备）

**前置条件**：
- 数据库连接正常
- Redis 缓存服务可用（用于锁定状态）
- 邮箱服务配置完成（用于验证邮件）

**后置条件**：
- 用户信息存入 User 表
- 生成有效的 JWT Token
- 记录登录日志

**异常处理**：
| 错误场景 | 错误码 | 错误信息 | HTTP状态 |
|---------|--------|---------|---------|
| 邮箱已存在 | USER_001 | 该邮箱已被注册 | 400 |
| 用户名已存在 | USER_002 | 该用户名已被使用 | 400 |
| 密码不符合规范 | USER_003 | 密码必须包含大小写字母和数字，长度8-32字符 | 400 |
| 两次密码不一致 | USER_004 | 两次输入的密码不一致 | 400 |
| 用户不存在 | AUTH_001 | 用户名或密码错误 | 401 |
| 密码错误 | AUTH_002 | 用户名或密码错误 | 401 |
| 账号已锁定 | AUTH_003 | 账号已被锁定，请15分钟后重试 | 403 |
| Token无效 | AUTH_004 | 登录已过期，请重新登录 | 401 |

**接口设计**：
```typescript
// POST /api/auth/register
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleType: 'candidate' | 'interviewer' | 'admin';
}

// POST /api/auth/login
interface LoginRequest {
  identifier: string;  // email or username
  password: string;
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/auth/logout
// Headers: Authorization: Bearer <token>
```

**UI 设计要点**：
- 注册表单字段实时验证
- 密码强度指示器（弱/中/强）
- 显示/隐藏密码按钮
- "记住我" 选项（7天免登录）
- 友好的错误提示（字段下方红色文字）
- 加载状态按钮（防止重复提交）

**验收标准**：
- [ ] 能使用邮箱和密码成功注册候选人账号
- [ ] 能使用用户名或邮箱登录
- [ ] 密码在数据库中已加密存储
- [ ] 登录后获得有效 JWT Token
- [ ] Token 能在后续请求中正确验证
- [ ] 密码不符合规范时显示明确错误
- [ ] 邮箱重复时提示已注册
- [ ] 登录失败 5 次后账号被锁定
- [ ] 前端表单验证与后端验证一致

**测试用例**：
```typescript
describe('用户注册登录', () => {
  test('注册成功 - 候选人角色', async () => {
    const userData = {
      username: 'test_user',
      email: 'test@example.com',
      password: 'Test123456',
      confirmPassword: 'Test123456',
      roleType: 'candidate'
    };
    const response = await request(app).post('/api/auth/register').send(userData);
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test('注册失败 - 邮箱重复', async () => {
    // 先注册一次
    // 再次使用相同邮箱注册
    // 验证返回 400 错误
  });

  test('登录成功 - 返回Token', async () => {
    const response = await request(app).post('/api/auth/login').send({
      identifier: 'test@example.com',
      password: 'Test123456'
    });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  test('登录失败5次 - 账号锁定', async () => {
    // 连续5次错误密码登录
    // 验证第6次返回 403 账号锁定
  });
});
```

---

#### F2：角色权限控制

**优先级**：Must Have  
**预估工时**：1.5 人日

**功能描述**：
实现基于角色的访问控制（RBAC），不同角色用户访问不同功能模块，前后端双重验证。

**角色定义**：

| 角色 | 权限范围 | 可访问模块 |
|-----|---------|-----------|
| **候选人** | - 查看分配的面试场次<br>- 参加面试答题<br>- 查看个人结果 | - 个人中心<br>- 面试大厅<br>- 答题界面<br>- 结果查看 |
| **面试官** | - 查看候选人提交<br>- 评分和复核<br>- 生成报告<br>- 查看统计数据 | - 候选人管理<br>- 评分界面<br>- 报告生成<br>- 数据统计 |
| **管理员** | - 所有面试官权限<br>- 用户管理<br>- 题库管理<br>- 系统配置 | - 全部模块<br>- 用户管理<br>- 题库管理<br>- 系统设置 |

**输入**：
- 用户请求（HTTP Request）
- Token（包含 userId, role）
- 请求的资源路径

**输出**：
- 权限验证通过：返回请求的资源
- 权限验证失败：返回 403 Forbidden

**业务规则**：
1. **API 层面权限**：
   - 每个 API 路由使用装饰器声明所需角色
   - 例如：`@Roles('admin', 'interviewer')`
2. **数据层面权限**：
   - 候选人只能查看自己的数据
   - 面试官只能查看分配给自己的候选人
   - 管理员可以查看所有数据
3. **前端权限**：
   - 根据用户角色动态渲染菜单
   - 隐藏无权限的功能入口
   - 前端权限仅用于 UI，不能作为安全保障
4. **权限检查时机**：
   - 用户登录时加载权限
   - 每次 API 请求时验证
   - Token 刷新时更新权限

**权限矩阵**：

| API 端点 | 候选人 | 面试官 | 管理员 |
|---------|-------|--------|-------|
| GET /api/interviews (我的面试) | ✅ | ✅ | ✅ |
| POST /api/submissions (提交答案) | ✅ | ❌ | ❌ |
| GET /api/candidates (候选人列表) | ❌ | ✅ | ✅ |
| PUT /api/scores/:id (调整评分) | ❌ | ✅ | ✅ |
| POST /api/questions (新增题目) | ❌ | ❌ | ✅ |
| GET /api/users (用户管理) | ❌ | ❌ | ✅ |
| DELETE /api/users/:id (删除用户) | ❌ | ❌ | ✅ |

**技术实现**：

**后端守卫（NestJS）**：
```typescript
// roles.decorator.ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;  // 从JWT提取
    
    return requiredRoles.some(role => user.role === role);
  }
}

// 使用示例
@Controller('questions')
export class QuestionsController {
  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  createQuestion(@Body() dto: CreateQuestionDto) {
    // 只有管理员可以访问
  }
}
```

**前端权限控制（React）**：
```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

// ProtectedRoute.tsx
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, hasAnyRole } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/403" />;
  }
  
  return children;
};

// 使用示例
<Route path="/admin" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

**异常处理**：
| 场景 | 错误码 | 错误信息 | HTTP状态 |
|-----|--------|---------|---------|
| 未登录 | AUTH_005 | 请先登录 | 401 |
| 权限不足 | AUTH_006 | 您没有权限访问此资源 | 403 |
| 角色未激活 | AUTH_007 | 您的账号尚未激活，请联系管理员 | 403 |

**验收标准**：
- [ ] 候选人登录后只能看到候选人菜单
- [ ] 面试官登录后可以看到评分相关功能
- [ ] 管理员可以访问所有功能
- [ ] 候选人无法通过 API 访问题库管理接口（返回403）
- [ ] URL 直接访问无权限页面会被重定向
- [ ] 前端菜单根据角色动态显示/隐藏
- [ ] Token 过期后自动跳转登录页

---

### 模块 2：候选人面试流程

#### F3：候选人选择面试场次

**优先级**：Must Have  
**预估工时**：1.5 人日

**功能描述**：
候选人登录后可以查看分配给自己的面试场次列表，包含场次信息、状态、时间，并能进入或继续面试。

**输入**：
- 候选人用户 ID（从 Token 获取）
- 查询参数（可选）：
  - `status` (string): 'upcoming' | 'ongoing' | 'completed'
  - `page` (number): 页码，默认 1
  - `limit` (number): 每页数量，默认 10

**输出**：
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 101,
        "name": "2024春季校招-后端开发",
        "description": "后端开发岗位技术面试",
        "startTime": "2025-10-25T09:00:00Z",
        "endTime": "2025-10-25T11:00:00Z",
        "duration": 120,
        "status": "upcoming",
        "progress": {
          "completedQuestions": 0,
          "totalQuestions": 5,
          "percentage": 0
        },
        "template": {
          "name": "后端面试标准模板",
          "difficulty": "medium"
        },
        "canEnter": false,
        "reason": "面试将于 2025-10-25 09:00 开始"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

**业务规则**：
1. **面试状态**：
   - `upcoming`：未开始（当前时间 < startTime）
   - `ongoing`：进行中（startTime ≤ 当前时间 ≤ endTime）
   - `completed`：已结束（当前时间 > endTime）
   
2. **进入条件**：
   - 只能进入状态为 `ongoing` 的面试
   - 如果已经开始答题，显示"继续面试"
   - 如果未开始答题，显示"开始面试"
   
3. **时间计算**：
   - 显示倒计时（未开始）或剩余时间（进行中）
   - 超时后自动提交已完成的题目
   
4. **排序规则**：
   - 进行中的面试排在最前
   - 其次是即将开始的（按时间升序）
   - 最后是已完成的（按时间降序）

**界面设计**：

**布局结构**：
```
+------------------------------------------+
|  [标签导航] 全部 | 进行中 | 即将开始 | 已完成  |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  | [卡片1]                             |  |
|  | 2024春季校招-后端开发                |  |
|  | 时间: 2025-10-25 09:00-11:00       |  |
|  | 状态: [进行中] ●                    |  |
|  | 进度: [=========>    ] 3/5         |  |
|  | 剩余时间: 01:23:45                  |  |
|  | [继续面试] 按钮                      |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | [卡片2] ...                         |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

**UI 组件要点**：
- 卡片式布局，每个面试一张卡片
- 状态徽章：
  - 未开始：灰色 ⏰
  - 进行中：绿色 ●
  - 已结束：蓝色 ✓
- 进度条：可视化答题进度
- 时间显示：
  - 未开始：倒计时 "距开始还有 2天3小时"
  - 进行中：剩余时间 "01:23:45"
  - 已结束：结束时间 "2025-10-20 已结束"
- 操作按钮：
  - 未开始：禁用状态"等待开始"
  - 进行中：主色调按钮"开始面试"或"继续面试"
  - 已结束：次要按钮"查看结果"

**交互流程**：
1. 页面加载 → 调用 API 获取面试列表
2. 显示加载状态（骨架屏）
3. 渲染面试卡片
4. 每30秒刷新一次状态（检查时间变化）
5. 点击"开始面试" → 跳转到答题界面 `/interview/:sessionId`

**接口设计**：
```typescript
// GET /api/candidate/sessions
interface GetSessionsQuery {
  status?: 'upcoming' | 'ongoing' | 'completed';
  page?: number;
  limit?: number;
}

interface SessionResponse {
  id: number;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;  // 分钟
  status: 'upcoming' | 'ongoing' | 'completed';
  progress: {
    completedQuestions: number;
    totalQuestions: number;
    percentage: number;
  };
  template: {
    name: string;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  canEnter: boolean;
  reason?: string;  // 不能进入的原因
}

// POST /api/candidate/sessions/:id/enter
// 进入面试，创建或恢复答题会话
```

**异常处理**：
| 场景 | 处理方式 |
|-----|---------|
| 没有分配的面试 | 显示空状态页"暂无面试安排" |
| 面试已过期 | 灰色显示，禁用按钮 |
| 网络请求失败 | 显示重试按钮 |
| 同时进入多个面试 | 提示"您有未完成的面试，请先完成" |

**验收标准**：
- [ ] 能正确显示所有分配的面试场次
- [ ] 状态标识正确（未开始/进行中/已结束）
- [ ] 倒计时/剩余时间实时更新
- [ ] 只能进入状态为"进行中"的面试
- [ ] 进度条准确反映答题情况
- [ ] 标签筛选功能正常工作
- [ ] 分页加载正常
- [ ] 空状态显示友好
- [ ] 移动端响应式布局良好

---

#### F4：编程题模块

**优先级**：Must Have  
**预估工时**：4 人日

**功能描述**：
提供在线代码编辑器，支持多语言编程，实时运行测试用例，提交后执行完整测试并返回结果。

**输入**：
- 题目 ID
- 候选人代码
- 编程语言选择
- 操作类型：`run`（运行示例）或 `submit`（提交）

**输出**：
```json
{
  "success": true,
  "data": {
    "status": "success",
    "result": {
      "totalTests": 10,
      "passedTests": 8,
      "failedTests": 2,
      "passRate": 80,
      "executionTime": 245,
      "memoryUsage": 15.6,
      "testCases": [
        {
          "id": 1,
          "input": "[1,2,3,4]",
          "expectedOutput": "10",
          "actualOutput": "10",
          "passed": true,
          "executionTime": 23,
          "hidden": false
        },
        {
          "id": 2,
          "input": "[5,6,7,8]",
          "expectedOutput": "26",
          "actualOutput": "25",
          "passed": false,
          "error": "输出不匹配",
          "hidden": false
        }
      ],
      "compileError": null,
      "runtimeError": null
    }
  }
}
```

**技术架构**：

**前端组件**：
1. **代码编辑器**：Monaco Editor
   - 语法高亮
   - 自动补全
   - 代码格式化（Prettier）
   - 多语言支持
   - 快捷键支持（Ctrl+S 保存，Ctrl+/ 注释）

2. **布局设计**：
```
+--------------------------------------------------+
| [题目标题] Two Sum (中等)  [Python ▼] [重置] [运行] [提交] |
+------------------------+-------------------------+
| 题目描述               | 代码编辑器              |
|                        |                         |
| # 题目                 | def twoSum(nums, target):|
| 给定一个整数数组...    |     # 在这里编写代码     |
|                        |                         |
| ## 示例                |                         |
| 输入: [2,7,11,15], 9   |                         |
| 输出: [0,1]            |                         |
|                        |                         |
| ## 约束                |                         |
| - 时间限制: 1000ms     |                         |
| - 内存限制: 256MB      |                         |
|                        |                         |
+------------------------+-------------------------+
| 测试结果                                          |
| ✅ 测试用例 1: 通过 (23ms)                        |
| ❌ 测试用例 2: 失败 - 输出不匹配                  |
| ✅ 测试用例 3: 通过 (19ms)                        |
| 通过率: 8/10 (80%)                                |
+--------------------------------------------------+
```

**后端代码执行流程**：

```
候选人提交代码
    ↓
后端接收 & 验证
    ↓
创建 Docker 容器（隔离环境）
    ↓
写入代码文件 + 测试用例
    ↓
编译代码（如需要）
    ↓
执行测试用例（并行）
    ↓
收集结果（输出、时间、内存）
    ↓
销毁容器
    ↓
返回结果 & 计算得分
```

**支持的编程语言**：

| 语言 | 版本 | 容器镜像 | 执行命令 |
|------|------|---------|---------|
| Python | 3.11 | python:3.11-alpine | `python solution.py` |
| JavaScript | Node 20 | node:20-alpine | `node solution.js` |
| Java | 17 | openjdk:17-alpine | `javac Solution.java && java Solution` |
| C++ | GCC 12 | gcc:12-alpine | `g++ -o solution solution.cpp && ./solution` |
| Go | 1.21 | golang:1.21-alpine | `go run solution.go` |

**代码模板**：
```python
# Python 模板
def solution(input_data):
    """
    :param input_data: 输入参数
    :return: 输出结果
    """
    # 在这里编写你的代码
    pass

# 测试框架会自动调用这个函数
```

**业务规则**：

1. **代码执行限制**：
   - 单个测试用例超时：5 秒
   - 总执行时间：30 秒
   - 内存限制：256MB
   - 禁止网络访问
   - 禁止文件系统写入（除了临时目录）

2. **测试用例**：
   - 公开测试用例：候选人可见，用于"运行"功能
   - 隐藏测试用例：候选人不可见，仅"提交"时执行
   - 测试用例比例：公开 20%，隐藏 80%

3. **评分规则**：
   - 测试通过率占 60%
   - 时间效率占 20%（与标准解法对比）
   - 空间效率占 20%（与标准解法对比）

4. **自动保存**：
   - 每 30 秒自动保存到服务器
   - 离开页面前提示保存
   - 支持恢复上次保存的代码

**安全措施**：

```typescript
// Docker 容器配置
const containerConfig = {
  Image: 'python:3.11-alpine',
  Cmd: ['python', '/code/solution.py'],
  HostConfig: {
    Memory: 256 * 1024 * 1024,  // 256MB
    NanoCpus: 1000000000,  // 1 CPU
    NetworkMode: 'none',  // 禁止网络
    ReadonlyRootfs: true,  // 只读文件系统
    Tmpfs: {
      '/tmp': 'rw,noexec,nosuid,size=50m'
    },
    PidsLimit: 50,  // 限制进程数
  },
  WorkingDir: '/code',
};

// 代码注入检测
const dangerousPatterns = [
  /import\s+os/,
  /import\s+sys/,
  /eval\s*\(/,
  /exec\s*\(/,
  /__import__/,
  /subprocess/,
];
```

**接口设计**：

```typescript
// POST /api/submissions/run
interface RunCodeRequest {
  questionId: number;
  code: string;
  language: 'python' | 'javascript' | 'java' | 'cpp' | 'go';
  testCaseIds?: number[];  // 可指定运行哪些测试用例
}

// POST /api/submissions/submit
interface SubmitCodeRequest {
  sessionId: number;
  questionId: number;
  code: string;
  language: string;
}

// GET /api/submissions/:id/result
interface SubmissionResult {
  id: number;
  status: 'pending' | 'running' | 'success' | 'failed' | 'timeout';
  result: {
    totalTests: number;
    passedTests: number;
    score: number;
    testCases: TestCaseResult[];
    compileError?: string;
    runtimeError?: string;
  };
}
```

**异常处理**：

| 场景 | 错误信息 | 处理方式 |
|-----|---------|---------|
| 编译错误 | 显示编译器输出 | 标注错误行，提示语法错误 |
| 运行超时 | "代码执行超时 (>5s)" | 提示优化算法复杂度 |
| 内存溢出 | "内存使用超限 (>256MB)" | 提示优化空间复杂度 |
| 运行时错误 | 显示错误堆栈 | 标注错误位置，提示错误类型 |
| 输出不匹配 | 显示期望输出 vs 实际输出 | Diff 对比显示 |
| 沙箱执行失败 | "系统错误，请重试" | 记录日志，通知管理员 |

**性能优化**：

1. **并发控制**：
   - 使用消息队列（Redis + Bull）
   - 限制并发执行数（最多 10 个容器同时运行）
   - 排队机制，显示队列位置

2. **缓存策略**：
   - 相同代码的执行结果缓存 5 分钟
   - 代码 hash 作为缓存 key

3. **资源回收**：
   - 执行完成后立即销毁容器
   - 超时强制 kill 容器
   - 定期清理僵尸容器

**验收标准**：
- [ ] Monaco 编辑器正常工作，支持语法高亮
- [ ] 可以切换编程语言，代码模板自动更新
- [ ] "运行"功能可以执行公开测试用例
- [ ] "提交"功能执行所有测试用例并返回结果
- [ ] 测试结果清晰显示通过/失败状态
- [ ] 编译错误和运行错误有友好提示
- [ ] 代码每 30 秒自动保存
- [ ] 刷新页面后代码恢复
- [ ] 容器隔离有效，无法访问网络
- [ ] 超时和内存限制生效
- [ ] 并发测试时不会相互影响
- [ ] 左右面板可调整大小
- [ ] 支持快捷键操作

---

#### F5：问答题模块

**优先级**：Must Have  
**预估工时**：2 人日

**功能描述**：
提供富文本编辑器供候选人回答系统设计题、行为面试题等开放性问题，支持 Markdown 格式、代码块、图片等。

**输入**：
- 题目 ID
- 候选人答案（Markdown 格式）
- 提交类型：`draft`（草稿）或 `submit`（提交）

**输出**：
```json
{
  "success": true,
  "data": {
    "submissionId": 5678,
    "status": "submitted",
    "wordCount": 856,
    "savedAt": "2025-10-21T10:30:00Z",
    "aiScore": {
      "score": 85,
      "feedback": "回答结构清晰，考虑了多个维度...",
      "strengths": ["系统设计思路完整", "考虑了可扩展性"],
      "improvements": ["可以补充更多性能优化细节"]
    }
  }
}
```

**界面布局**：

```
+--------------------------------------------------+
| [题目] 设计一个高并发秒杀系统  [字数: 856/2000]     |
+--------------------------------------------------+
| 题目描述                                          |
| 请设计一个支持百万级并发的电商秒杀系统，要求...     |
|                                                  |
| 要点提示:                                         |
| • 系统架构设计                                    |
| • 数据库设计                                      |
| • 缓存策略                                        |
| • 限流和降级方案                                  |
+--------------------------------------------------+
|                                                  |
| [编辑区]                  | [预览区]             |
|                           |                      |
| ## 系统架构              | ## 系统架构           |
|                           |                      |
| 我设计的秒杀系统...       | 我设计的秒杀系统...   |
|                           |                      |
| ```python                 | [代码高亮显示]        |
| def seckill():            |                      |
|     pass                  |                      |
| ```                       |                      |
|                           |                      |
+--------------------------------------------------+
| [自动保存于 10:29] [保存草稿] [全屏编辑] [提交答案] |
+--------------------------------------------------+
```

**功能特性**：

1. **Markdown 编辑器**：
   - 实时预览（左右分屏或标签切换）
   - 语法提示
   - 工具栏：标题、粗体、斜体、列表、链接、图片、代码块
   - 支持表格、任务列表
   - 支持数学公式（KaTeX）

2. **代码块**：
   - 支持多种语言语法高亮
   - 行号显示
   - 一键复制

3. **图片上传**：
   - 支持拖拽上传
   - 粘贴板上传
   - 图片预览
   - 自动压缩（限制 5MB）
   - 存储到云存储（如阿里云 OSS）

4. **字数统计**：
   - 实时统计字数
   - 建议字数范围提示
   - 超出或不足时颜色提示

5. **自动保存**：
   - 每 30 秒自动保存草稿
   - 显示最后保存时间
   - 网络断开时本地缓存（LocalStorage）

**业务规则**：

1. **字数要求**：
   - 最少字数：200 字
   - 建议字数：500-2000 字
   - 最多字数：5000 字

2. **提交限制**：
   - 草稿可无限次保存
   - 正式提交后不可修改
   - 提交前需确认弹窗

3. **答案评估**（后续 F6 详述）：
   - 提交后自动调用 AI 评分
   - 评估维度：完整性、逻辑性、专业性、表达能力
   - 生成初步得分和反馈

**技术实现**：

**前端组件**：
```typescript
// 使用 react-md-editor
import MDEditor from '@uiw/react-md-editor';

const QuestionAnswerEditor = () => {
  const [value, setValue] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);

  // 自动保存
  useEffect(() => {
    const timer = setInterval(() => {
      if (value) {
        saveDraft(value);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [value]);

  // 字数统计（排除 Markdown 语法）
  const countWords = (markdown: string) => {
    const plainText = markdown
      .replace(/```[\s\S]*?```/g, '')  // 移除代码块
      .replace(/[#*`\[\]()]/g, '')     // 移除 Markdown 语法
      .trim();
    return plainText.length;
  };

  return (
    <div>
      <MDEditor
        value={value}
        onChange={setValue}
        height={600}
        preview="live"  // 实时预览
      />
      <div>字数: {wordCount} / 2000</div>
      <div>最后保存: {lastSaved}</div>
      <button onClick={handleSubmit}>提交答案</button>
    </div>
  );
};
```

**后端接口**：
```typescript
// POST /api/submissions/qa/draft
interface SaveQADraftRequest {
  sessionId: number;
  questionId: number;
  answer: string;  // Markdown 格式
}

// POST /api/submissions/qa/submit
interface SubmitQARequest {
  sessionId: number;
  questionId: number;
  answer: string;
}

// POST /api/uploads/image
// multipart/form-data
// 返回图片 URL
```

**Markdown 内容处理**：
```typescript
// 后端接收到 Markdown 后的处理
class MarkdownProcessor {
  // 1. XSS 防护
  sanitize(markdown: string): string {
    return DOMPurify.sanitize(markdown);
  }

  // 2. 提取纯文本（用于字数统计）
  extractText(markdown: string): string {
    const htmlresult = marked(markdown);
    return htmlToText(html);
  }

  // 3. 转换为 HTML（用于显示）
  toHTML(markdown: string): string {
    return marked(markdown, {
      highlight: (code, lang) => {
        return hljs.highlight(code, { language: lang }).value;
      }
    });
  }
}
```

**验收标准**：
- [ ] Markdown 编辑器正常工作
- [ ] 实时预览功能正常
- [ ] 工具栏按钮功能完整
- [ ] 代码块语法高亮
- [ ] 图片上传成功并显示
- [ ] 字数统计准确（不含 Markdown 语法）
- [ ] 每 30 秒自动保存
- [ ] 保存时间准确显示
- [ ] 网络断开时本地缓存生效
- [ ] 提交前有确认弹窗
- [ ] 提交后不可再编辑
- [ ] 答案少于 200 字时提示警告
- [ ] 支持全屏编辑模式
- [ ] 移动端布局自适应

---

#### F6：自动评分流程

**优先级**：Must Have  
**预估工时**：3 人日

**功能描述**：
候选人提交后，系统自动对编程题和问答题进行评分，生成初步分数和反馈建议。

**评分维度**：

**编程题评分（总分 100）**：
| 维度 | 权重 | 评分标准 |
|-----|------|---------|
| **测试通过率** | 40% | (通过数/总数) × 40 |
| **时间复杂度** | 20% | 与标准解法对比 |
| **空间复杂度** | 15% | 内存使用情况 |
| **代码质量** | 15% | 命名、注释、结构 |
| **代码规范** | 10% | Linter 检查 |

**问答题评分（总分 100）**：
| 维度 | 权重 | 评分标准 |
|-----|------|---------|
| **完整性** | 30% | 是否覆盖问题所有方面 |
| **逻辑性** | 25% | 论述是否清晰连贯 |
| **专业性** | 25% | 技术深度和准确性 |
| **表达能力** | 20% | 语言组织和条理性 |

**技术实现**：

**编程题评分流程**：

```typescript
class ProgrammingQuestionScorer {
  async score(submission: Submission): Promise<ScoreResult> {
    const scores = {
      testPassRate: 0,
      timeComplexity: 0,
      spaceComplexity: 0,
      codeQuality: 0,
      codeStyle: 0,
    };

    // 1. 测试通过率（40分）
    scores.testPassRate = (submission.passedTests / submission.totalTests) * 40;

    // 2. 时间复杂度评分（20分）
    scores.timeComplexity = await this.evaluateTimeComplexity(submission);

    // 3. 空间复杂度评分（15分）
    scores.spaceComplexity = await this.evaluateSpaceComplexity(submission);

    // 4. 代码质量评分（15分）- 使用 AI
    scores.codeQuality = await this.evaluateCodeQuality(submission);

    // 5. 代码规范评分（10分）- 使用 Linter
    scores.codeStyle = await this.evaluateCodeStyle(submission);

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    return {
      totalScore,
      breakdown: scores,
      feedback: this.generateFeedback(scores, submission),
    };
  }

  private async evaluateTimeComplexity(submission: Submission): Promise<number> {
    // 与标准解法对比执行时间
    const standardTime = submission.question.standardExecutionTime;
    const actualTime = submission.executionTime;
    const ratio = actualTime / standardTime;

    if (ratio <= 1.2) return 20;  // 优秀
    if (ratio <= 1.5) return 15;  // 良好
    if (ratio <= 2.0) return 10;  // 中等
    if (ratio <= 3.0) return 5;   // 较差
    return 0;  // 很差
  }

  private async evaluateSpaceComplexity(submission: Submission): Promise<number> {
    // 与标准解法对比内存使用
    const standardMemory = submission.question.standardMemoryUsage;
    const actualMemory = submission.memoryUsage;
    const ratio = actualMemory / standardMemory;

    if (ratio <= 1.2) return 15;
    if (ratio <= 1.5) return 12;
    if (ratio <= 2.0) return 8;
    if (ratio <= 3.0) return 4;
    return 0;
  }

  private async evaluateCodeQuality(submission: Submission): Promise<number> {
    // 调用 AI 评估代码质量
    const prompt = `
请评估以下代码的质量（满分15分）：

题目：${submission.question.title}
代码：
\`\`\`${submission.language}
${submission.code}
\`\`\`

评估维度：
1. 变量命名（5分）：是否有意义、符合规范
2. 代码结构（5分）：是否清晰、易读
3. 注释质量（5分）：是否充分、准确

请以 JSON 格式返回：
{
  "score": 12,
  "namingScore": 4,
  "structureScore": 5,
  "commentScore": 3,
  "feedback": "代码结构清晰，但缺少必要的注释"
}
    `;

    const aiResponse = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const result = JSON.parse(aiResponse.choices[0].message.content);
    return result.score;
  }

  private async evaluateCodeStyle(submission: Submission): Promise<number> {
    // 使用 ESLint/Pylint 等工具检查代码规范
    const linter = this.getLinter(submission.language);
    const issues = await linter.lint(submission.code);

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    let score = 10;
    score -= errorCount * 2;  // 每个错误扣2分
    score -= warningCount * 0.5;  // 每个警告扣0.5分

    return Math.max(0, score);
  }

  private generateFeedback(scores: any, submission: Submission): string {
    const feedback = [];

    if (scores.testPassRate < 20) {
      feedback.push('⚠️ 测试通过率较低，请检查算法逻辑');
    }

    if (scores.timeComplexity < 10) {
      feedback.push('⏰ 时间复杂度较高，建议优化算法效率');
    }

    if (scores.spaceComplexity < 8) {
      feedback.push('💾 内存使用较多，建议优化空间复杂度');
    }

    if (scores.codeQuality < 10) {
      feedback.push('📝 代码可读性待提升，建议添加注释和优化命名');
    }

    if (scores.codeStyle < 7) {
      feedback.push('✨ 存在代码规范问题，建议修复 Linter 警告');
    }

    return feedback.join('\n');
  }
}
```

**问答题评分流程**：

```typescript
class QAQuestionScorer {
  async score(submission: QASubmission): Promise<ScoreResult> {
    const prompt = `
你是一位资深的技术面试官，请评估候选人对以下问题的回答。

题目：${submission.question.title}
${submission.question.description}

候选人回答：
${submission.answer}

参考答案要点：
${submission.question.referencePoints.join('\n')}

请按以下维度评分（总分100分）：
1. 完整性（30分）：是否覆盖了题目的所有方面
2. 逻辑性（25分）：论述是否清晰、连贯、有条理
3. 专业性（25分）：技术深度、准确性、最佳实践
4. 表达能力（20分）：语言组织、结构化、易理解

请以 JSON 格式返回：
{
  "totalScore": 85,
  "scores": {
    "completeness": 26,
    "logic": 22,
    "professionalism": 21,
    "expression": 16
  },
  "strengths": [
    "系统架构设计思路清晰",
    "考虑了可扩展性和高可用性"
  ],
  "improvements": [
    "可以补充更多性能优化细节",
    "缺少对监控和运维的考虑"
  ],
  "feedback": "整体回答质量较好，展现了扎实的系统设计能力...",
  "keyPointsCovered": ["架构设计", "缓存策略", "数据库设计"],
  "keyPointsMissing": ["限流方案", "监控告警"]
}
    `;

    const aiResponse = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一位资深技术面试官，擅长评估候选人的技术能力和思维深度。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const result = JSON.parse(aiResponse.choices[0].message.content);
    return result;
  }
}
```

**异步任务处理**：

```typescript
// 使用消息队列异步处理评分任务
@Processor('scoring')
export class ScoringProcessor {
  @Process('programming')
  async handleProgrammingScore(job: Job) {
    const submission = job.data;
    const scorer = new ProgrammingQuestionScorer();
    const result = await scorer.score(submission);

    // 保存评分结果
    await this.scoreService.save({
      submissionId: submission.id,
      aiScore: result.totalScore,
      breakdown: result.breakdown,
      feedback: result.feedback,
    });

    // 通知前端（WebSocket）
    this.eventGateway.emit(`score:${submission.id}`, result);
  }

  @Process('qa')
  async handleQAScore(job: Job) {
    const submission = job.data;
    const scorer = new QAQuestionScorer();
    const result = await scorer.score(submission);

    await this.scoreService.save({
      submissionId: submission.id,
      aiScore: result.totalScore,
      scores: result.scores,
      strengths: result.strengths,
      improvements: result.improvements,
      feedback: result.feedback,
    });

    this.eventGateway.emit(`score:${submission.id}`, result);
  }
}
```

**前端实时反馈**：

```typescript
// 提交后等待评分
const SubmissionResult = () => {
  const [status, setStatus] = useState('pending');
  const [scoreResult, setScoreResult] = useState(null);

  useEffect(() => {
    // 连接 WebSocket
    const socket = io();

    socket.on(`score:${submissionId}`, (result) => {
      setStatus('completed');
      setScoreResult(result);
    });

    return () => socket.disconnect();
  }, []);

  if (status === 'pending') {
    return (
      <div>
        <Spin />
        <p>AI 正在评分中，请稍候...</p>
      </div>
    );
  }

  return (
    <div>
      <h2>评分结果</h2>
      <ScoreCard result={scoreResult} />
    </div>
  );
};
```

**异常处理**：

| 场景 | 处理策略 |
|-----|---------|
| AI API 超时 | 使用基础评分（仅测试结果），标记为"待人工复核" |
| API 调用失败 | 重试 3 次，失败后降级为基础评分 |
| AI 返回格式错误 | 记录日志，使用默认分数 60，标记为"评分异常" |
| 并发评分过多 | 加入队列，显示排队位置 |

**评分结果展示**：

```
+------------------------------------------+
| 评分结果                                  |
+------------------------------------------+
| 总分: 85 / 100                           |
| [========================================] 85% |
|                                          |
| 详细评分:                                |
| • 测试通过率: 36/40 ✅                   |
| • 时间复杂度: 18/20 ✅                   |
| • 空间复杂度: 12/15 ⚠️                   |
| • 代码质量: 12/15 ⚠️                     |
| • 代码规范: 7/10 ✅                      |
|                                          |
| AI 反馈:                                 |
| ✅ 算法逻辑正确，测试通过率高             |
| ⚠️ 内存使用较多，建议优化空间复杂度       |
| ⚠️ 代码可读性待提升，建议添加必要注释     |
|                                          |
| [查看详细报告]                            |
+------------------------------------------+
```

**验收标准**：
- [ ] 编程题提交后能自动评分
- [ ] 评分在 10 秒内完成
- [ ] 评分结果包含所有维度
- [ ] AI 反馈准确且有建设性
- [ ] 问答题能获得合理的 AI 评分
- [ ] 评分结果实时推送到前端
- [ ] AI 服务异常时有降级方案
- [ ] 评分结果保存到数据库
- [ ] 面试官可以查看详细评分依据

---

#### F7：候选人查看结果界面

**优先级**：Must Have  
**预估工时**：1.5 人日

**功能描述**：
面试结束后，候选人可以查看每道题的得分、AI 反馈和最终评价。

**输入**：
- 候选人 ID
- 面试场次 ID

**输出**：
```json
{
  "success": true,
  "data": {
    "sessionId": 101,
    "sessionName": "2024春季校招-后端开发",
    "completedAt": "2025-10-25T11:00:00Z",
    "status": "pending_review",
    "overallScore": 82.5,
    "submissions": [
      {
        "questionId": 1,
        "questionTitle": "Two Sum",
        "type": "programming",
        "score": 85,
        "maxScore": 100,
        "aiScore": 85,
        "humanScore": null,
        "feedback": {
          "strengths": ["算法正确", "时间复杂度优秀"],
          "improvements": ["可以添加更多注释"]
        }
      }
    ],
    "finalReport": null
  }
}
```

**界面设计**：

```
+------------------------------------------+
| 2024春季校招-后端开发 面试结果            |
| 状态: 待面试官复核 ⏳                     |
+------------------------------------------+
| 总分: 82.5 / 100                         |
| [=================================   ] 82.5% |
|                                          |
| 雷达图:                                  |
|     算法能力 ●                            |
|        /   \                             |
|   代码质量   系统设计                     |
|        \   /                             |
|     问题解决                              |
+------------------------------------------+
| 题目详情:                                |
|                                          |
| ✅ 1. Two Sum (编程题)                   |
|    得分: 85/100                          |
|    [展开详情 ▼]                          |
|                                          |
| ✅ 2. 设计秒杀系统 (问答题)               |
|    得分: 80/100                          |
|    [展开详情 ▼]                          |
|                                          |
+------------------------------------------+
| [下载完整报告 PDF] (面试官复核后可用)      |
+------------------------------------------+
```

**业务规则**：
- 提交后立即显示 AI 评分
- 面试官复核前显示"评分待确认"
- 面试官确认后显示最终得分
- 最终报告需面试官生成后才能下载

**验收标准**：
- [ ] 能查看所有题目的得分
- [ ] 雷达图准确展示各维度能力
- [ ] AI 反馈清晰易懂
- [ ] 面试官复核前后状态区分明显
- [ ] 报告下载功能正常

---

### 模块 3：面试官后台流程

#### F8：面试官查看候选人提交记录

**优先级**：Should Have  
**预估工时**：2 人日

**功能描述**：
面试官可以查看所有候选人的提交记录，包括代码、运行结果、答案内容等，支持筛选和搜索。

**输入**：
- 筛选条件：
  - `sessionId` (number, 可选): 面试场次
  - `status` (string, 可选): 'completed' | 'pending_review' | 'reviewed'
  - `dateRange` (可选): 时间范围
  - `keyword` (string, 可选): 候选人姓名
- 分页参数：`page`, `limit`

**输出**：
```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": 123,
        "name": "张三",
        "email": "zhang@example.com",
        "sessionName": "后端开发面试",
        "completedAt": "2025-10-25T11:00:00Z",
        "duration": 115,
        "status": "pending_review",
        "overallScore": 82.5,
        "aiScore": 82.5,
        "humanScore": null,
        "questionsCompleted": 5,
        "questionsTotal": 5
      }
    ],
    "pagination": { "total": 45, "page": 1, "limit": 20 }
  }
}
```

**界面设计**：

```
+--------------------------------------------------+
| 候选人管理                                        |
+--------------------------------------------------+
| [搜索框] 🔍 候选人姓名                  [筛选 ▼]  |
| [面试场次: 全部 ▼] [状态: 待复核 ▼] [时间: 本周 ▼] |
+--------------------------------------------------+
| 姓名    | 面试场次 | 完成时间 | AI评分 | 状态 | 操作 |
|--------|---------|---------|--------|------|------|
| 张三    | 后端开发 | 10-25   | 82.5   | 待复核 | [查看] |
| 李四    | 前端开发 | 10-24   | 75.0   | 已复核 | [查看] |
+--------------------------------------------------+
```

**详情侧边栏**：

```
+--------------------------------------------------+
| [关闭 ×]          候选人: 张三                     |
+--------------------------------------------------+
| 基本信息                                          |
| • 邮箱: zhang@example.com                        |
| • 面试时间: 2025-10-25 09:00-11:00               |
| • 用时: 115 分钟 / 120 分钟                       |
| • AI 总分: 82.5                                  |
+--------------------------------------------------+
| 题目列表:                                         |
|                                                  |
| 1. Two Sum (编程题) - 85分                       |
|    [查看代码]                                     |
|                                                  |
| 2. 设计秒杀系统 (问答题) - 80分                   |
|    [查看答案]                                     |
|                                                  |
+--------------------------------------------------+
| [开始复核评分]                                    |
+--------------------------------------------------+
```

**代码查看器**：
```
+--------------------------------------------------+
| Two Sum - 候选人代码                              |
| 语言: Python | 执行时间: 245ms | 内存: 15.6MB     |
+--------------------------------------------------+
| [只读编辑器显示代码]                               |
| def twoSum(nums, target):                         |
|     # 使用哈希表优化                               |
|     hash_map = {}                                 |
|     for i, num in enumerate(nums):                |
|         ...                                       |
+--------------------------------------------------+
| 测试结果: 8/10 通过                               |
| ✅ 测试用例 1: 通过                               |
| ✅ 测试用例 2: 通过                               |
| ❌ 测试用例 3: 输出不匹配                         |
+--------------------------------------------------+
| AI 评分: 85/100                                  |
| • 测试通过率: 36/40                               |
| • 时间复杂度: 18/20                               |
| • 代码质量: 15/15 ✅ 优秀                         |
| • 代码规范: 9/10                                  |
+--------------------------------------------------+
| [复制代码] [下载] [调整评分]                      |
+--------------------------------------------------+
```

**业务规则**：
- 面试官只能查看分配给自己的候选人
- 管理员可以查看所有候选人
- 支持导出候选人列表（Excel）
- 代码以只读模式展示，支持语法高亮

**接口设计**：
```typescript
// GET /api/interviewer/candidates
interface GetCandidatesQuery {
  sessionId?: number;
  status?: 'completed' | 'pending_review' | 'reviewed';
  dateRange?: { start: string; end: string };
  keyword?: string;
  page?: number;
  limit?: number;
}

// GET /api/interviewer/submissions/:candidateId
interface CandidateSubmissionsResponse {
  candidate: CandidateInfo;
  submissions: SubmissionDetail[];
}
```

**验收标准**：
- [ ] 能查看所有分配的候选人
- [ ] 筛选和搜索功能正常
- [ ] 代码显示清晰，语法高亮
- [ ] 测试结果完整展示
- [ ] AI 评分和反馈可见
- [ ] 支持导出候选人列表
- [ ] 性能良好（100+ 候选人）
- [ ] 移动端响应式布局

---

#### F9：面试官调整评分

**优先级**：Should Have  
**预估工时**：2 人日

**功能描述**：
面试官查看 AI 初步评分后，可以手动调整分数，并填写调整理由，系统记录评分变更历史。

**输入**：
```typescript
interface AdjustScoreRequest {
  submissionId: number;
  adjustedScore: number;  // 0-100
  reason: string;  // 调整理由
  remarks?: string;  // 额外备注
}
```

**输出**：
```json
{
  "success": true,
  "data": {
    "scoreRecordId": 789,
    "submissionId": 456,
    "aiScore": 85,
    "humanScore": 90,
    "finalScore": 90,
    "adjustedBy": "面试官A",
    "adjustedAt": "2025-10-25T14:30:00Z",
    "reason": "代码逻辑清晰，虽有小问题但整体优秀"
  }
}
```

**界面设计**：

```
+--------------------------------------------------+
| 调整评分                                          |
+--------------------------------------------------+
| 题目: Two Sum (编程题)                            |
| AI 初步评分: 85 / 100                            |
|                                                  |
| AI 评分详情:                                     |
| • 测试通过率: 36/40 (90%)                        |
| • 时间复杂度: 18/20 (优秀)                       |
| • 空间复杂度: 12/15 (良好)                       |
| • 代码质量: 12/15 (中等)                         |
| • 代码规范: 7/10 (良好)                          |
|                                                  |
| AI 反馈:                                         |
| ✅ 算法逻辑正确，测试通过率高                     |
| ⚠️ 代码可读性待提升                              |
+--------------------------------------------------+
| 调整后评分:                                       |
| [滑块: 0 ----●---- 100]  90                     |
|                                                  |
| 调整理由 *:                                      |
| [文本框]                                         |
| 代码逻辑清晰，虽有小问题但整体优秀...             |
|                                                  |
| 额外备注 (可选):                                 |
| [文本框]                                         |
| 建议候选人多注意代码注释...                       |
|                                                  |
| [取消] [确认调整]                                |
+--------------------------------------------------+
```

**业务规则**：

1. **评分范围**：0-100
2. **调整理由**：
   - 必填项
   - 最少 10 字
   - 最多 500 字
3. **评分记录**：
   - 保存 AI 原始分数
   - 保存人工调整分数
   - 最终分数 = 人工分数（如有）否则 AI 分数
4. **权限控制**：
   - 只能调整分配给自己的候选人
   - 调整后可以再次修改
   - 每次修改记录历史
5. **审计日志**：
   - 记录调整时间
   - 记录调整人
   - 记录调整前后分数

**评分历史**：

```
+--------------------------------------------------+
| 评分历史                                          |
+--------------------------------------------------+
| 时间              | 评分人  | 分数变更 | 理由      |
|------------------|--------|---------|----------|
| 2025-10-25 14:30 | 面试官A | 85→90   | 代码优秀  |
| 2025-10-25 10:05 | AI系统  | 初评85  | 自动评分  |
+--------------------------------------------------+
```

**技术实现**：

```typescript
// 评分调整服务
@Injectable()
export class ScoreAdjustmentService {
  async adjustScore(dto: AdjustScoreDto, interviewerId: number) {
    // 1. 验证权限
    const submission = await this.submissionRepo.findOne(dto.submissionId);
    await this.verifyPermission(interviewerId, submission);

    // 2. 验证评分范围
    if (dto.adjustedScore < 0 || dto.adjustedScore > 100) {
      throw new BadRequestException('评分必须在 0-100 之间');
    }

    // 3. 验证理由长度
    if (dto.reason.length < 10) {
      throw new BadRequestException('调整理由至少 10 字');
    }

    // 4. 保存评分记录
    const scoreRecord = await this.scoreRepo.findOne({
      where: { submissionId: dto.submissionId }
    });

    const oldHumanScore = scoreRecord.humanScore;

    scoreRecord.humanScore = dto.adjustedScore;
    scoreRecord.finalScore = dto.adjustedScore;
    scoreRecord.adjustedBy = interviewerId;
    scoreRecord.adjustedAt = new Date();
    scoreRecord.reason = dto.reason;
    scoreRecord.remarks = dto.remarks;

    await this.scoreRepo.save(scoreRecord);

    // 5. 记录审计日志
    await this.auditLogService.log({
      action: 'SCORE_ADJUSTED',
      userId: interviewerId,
      targetType: 'SUBMISSION',
      targetId: dto.submissionId,
      oldValue: oldHumanScore,
      newValue: dto.adjustedScore,
      reason: dto.reason,
    });

    // 6. 通知候选人（可选）
    await this.notificationService.notifyCandidateScoreUpdated(
      submission.userId,
      submission.id
    );

    return scoreRecord;
  }
}
```

**接口设计**：
```typescript
// PUT /api/interviewer/scores/:submissionId
interface AdjustScoreRequest {
  adjustedScore: number;
  reason: string;
  remarks?: string;
}

// GET /api/interviewer/scores/:submissionId/history
interface ScoreHistoryResponse {
  records: Array<{
    timestamp: string;
    adjustedBy: string;
    scoreBefore: number;
    scoreAfter: number;
    reason: string;
  }>;
}
```

**验收标准**：
- [ ] 能查看 AI 初步评分和详细依据
- [ ] 能手动调整分数（0-100）
- [ ] 调整理由必填且有长度验证
- [ ] 调整后分数立即生效
- [ ] 评分历史完整记录
- [ ] 候选人能看到更新后的分数
- [ ] 审计日志正确记录
- [ ] 只能调整有权限的候选人分数

---

#### F10：生成最终报告

**优先级**：Should Have  
**预估工时**：2.5 人日

**功能描述**：
面试官复核完所有题目后，生成候选人的完整面试报告，包含各项得分、综合评价、建议等，支持 PDF 导出。

**输入**：
```typescript
interface GenerateReportRequest {
  sessionId: number;
  candidateId: number;
  overallComment?: string;  // 面试官总评
  recommendation: 'pass' | 'pending' | 'fail';  // 推荐结果
}
```

**输出**：
```json
{
  "success": true,
  "data": {
    "reportId": 1001,
    "pdfUrl": "https://cdn.example.com/reports/1001.pdf",
    "generatedAt": "2025-10-25T15:00:00Z"
  }
}
```

**报告内容结构**：

```
┌──────────────────────────────────────────────┐
│           面试评估报告                        │
│         Interview Assessment Report          │
└──────────────────────────────────────────────┘

候选人信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
姓名：张三
邮箱：zhang@example.com
面试职位：后端开发工程师
面试时间：2025-10-25 09:00-11:00
面试官：李面试官

整体评价
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总分：82.5 / 100  ⭐⭐⭐⭐
推荐结果：✅ 通过

能力雷达图
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        算法能力 (85)
           ●
          / \
         /   \
代码质量(80)  系统设计(82)
         \   /
          \ /
           ●
      问题解决 (84)

详细评分
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Two Sum (编程题)
   得分：85 / 100
   测试通过率：90%
   时间复杂度：O(n) ✅
   空间复杂度：O(n) ✅
   
   优势：
   • 算法逻辑正确
   • 时间复杂度优秀
   • 代码结构清晰
   
   改进建议：
   • 可以添加更多注释
   • 变量命名可以更具描述性

2. 设计秒杀系统 (问答题)
   得分：80 / 100
   完整性：26/30
   逻辑性：22/25
   专业性：18/25
   表达能力：14/20
   
   优势：
   • 系统架构设计思路清晰
   • 考虑了可扩展性
   • 提出了合理的缓存策略
   
   改进建议：
   • 可以补充更多性能优化细节
   • 缺少对监控和运维的考虑

[其他题目...]

面试官总评
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
候选人展现了扎实的编程基础和良好的系统设计能力。
代码逻辑清晰，算法选择合理。系统设计方案较为完整，
但在细节把控上还有提升空间。总体表现良好，建议通过。

综合建议
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 继续加强系统设计的深度和广度
• 注意代码注释和文档的完善
• 可以多关注性能优化和监控运维方面的知识

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
报告生成时间：2025-10-25 15:00:00
报告编号：RPT-2025-1001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**技术实现**：

```typescript
// 报告生成服务
@Injectable()
export class ReportGenerationService {
  constructor(
    private submissionService: SubmissionService,
    private scoreService: ScoreService,
    private pdfService: PdfService,
  ) {}

  async generateReport(dto: GenerateReportDto): Promise<Report> {
    // 1. 获取所有提交和评分
    const submissions = await this.submissionService.findBySession(
      dto.sessionId,
      dto.candidateId
    );

    // 2. 计算总分和各维度分数
    const scores = await this.calculateScores(submissions);

    // 3. 收集反馈和建议
    const feedback = await this.collectFeedback(submissions);

    // 4. 生成报告数据
    const reportData = {
      candidate: await this.getCandidateInfo(dto.candidateId),
      session: await this.getSessionInfo(dto.sessionId),
      scores,
      submissions: submissions.map(s => this.formatSubmission(s)),
      feedback,
      overallComment: dto.overallComment,
      recommendation: dto.recommendation,
      generatedAt: new Date(),
      generatedBy: dto.interviewerId,
    };

    // 5. 生成 PDF
    const pdfBuffer = await this.pdfService.generate(reportData);

    // 6. 上传到云存储
    const pdfUrl = await this.uploadPdf(pdfBuffer, reportData);

    // 7. 保存报告记录
    const report = await this.reportRepo.save({
      sessionId: dto.sessionId,
      candidateId: dto.candidateId,
      data: reportData,
      pdfUrl,
      status: 'completed',
    });

    // 8. 通知候选人
    await this.notificationService.notifyCandidateReportReady(
      dto.candidateId,
      report.id
    );

    return report;
  }

  private async calculateScores(submissions: Submission[]) {
    const programmingSubmissions = submissions.filter(s => s.type === 'programming');
    const qaSubmissions = submissions.filter(s => s.type === 'qa');

    return {
      overall: this.calculateOverallScore(submissions),
      algorithm: this.calculateAlgorithmScore(programmingSubmissions),
      codeQuality: this.calculateCodeQualityScore(programmingSubmissions),
      systemDesign: this.calculateSystemDesignScore(qaSubmissions),
      problemSolving: this.calculateProblemSolvingScore(submissions),
    };
  }
}
```

**PDF 生成**：

```typescript
// 使用 puppeteer 或 pdfkit
@Injectable()
export class PdfService {
  async generate(reportData: ReportData): Promise<Buffer> {
    // 方案1: HTML 模板 + Puppeteer
    const html = await this.renderTemplate(reportData);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
    });
    await browser.close();
    return pdfBuffer;

    // 方案2: PDFKit (更轻量)
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    // 添加内容
    doc.fontSize(20).text(报告标题', { align: 'center' });
    doc.fontSize(12).text(`候选人：${reportData.candidate.name}`);
    // ... 更多内容
    
    doc.end();
    return Buffer.concat(buffers);
  }
}
```

**业务规则**：

1. **生成条件**：
   - 所有题目已评分
   - 面试官已复核
   - 推荐结果已选择

2. **报告版本**：
   - 每次生成覆盖旧版本
   - 保留生成历史记录

3. **访问权限**：
   - 候选人可查看和下载自己的报告
   - 面试官可查看所有报告
   - 报告链接 24 小时内有效（签名 URL）

**接口设计**：

```typescript
// POST /api/interviewer/reports/generate
interface GenerateReportRequest {
  sessionId: number;
  candidateId: number;
  overallComment?: string;
  recommendation: 'pass' | 'pending' | 'fail';
}

// GET /api/reports/:reportId
interface GetReportResponse {
  report: ReportData;
  pdfUrl: string;  // 签名 URL
}

// GET /api/reports/:reportId/download
// 返回 PDF 文件流
```

**验收标准**：
- [ ] 能成功生成完整报告
- [ ] PDF 格式规范美观
- [ ] 包含所有必要信息
- [ ] 雷达图和图表正确显示
- [ ] 候选人能查看和下载报告
- [ ] PDF 支持中文显示
- [ ] 生成速度 < 5 秒
- [ ] 报告链接有时效性

---

### 模块 4：管理员与题库管理

#### F11：题库 CRUD 管理

**优先级**：Could Have  
**预估工时**：3 人日

**功能描述**：
管理员可以添加、编辑、删除题目（编程题和问答题），配置测试用例、参考答案、评分标准等。

**编程题配置**：

```json
{
  "type": "programming",
  "title": "Two Sum",
  "description": "给定一个整数数组 nums 和一个整数目标值 target...",
  "difficulty": "easy",
  "tags": ["数组", "哈希表"],
  "timeLimit": 1000,
  "memoryLimit": 256,
  "languages": ["python", "javascript", "java", "cpp"],
  "templates": {
    "python": "def twoSum(nums, target):\n    pass",
    "javascript": "function twoSum(nums, target) {\n    \n}"
  },
  "testCases": [
    {
      "id": 1,
      "input": "[2,7,11,15], 9",
      "expectedOutput": "[0,1]",
      "explanation": "因为 nums[0] + nums[1] == 9",
      "isHidden": false,
      "weight": 1
    },
    {
      "id": 2,
      "input": "[3,2,4], 6",
      "expectedOutput": "[1,2]",
      "isHidden": true,
      "weight": 2
    }
  ],
  "standardSolution": {
    "code": "def twoSum(nums, target):\n    ...",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(n)",
    "executionTime": 200,
    "memoryUsage": 10.5
  }
}
```

**问答题配置**：

```json
{
  "type": "qa",
  "title": "设计一个高并发秒杀系统",
  "description": "请设计一个支持百万级并发的电商秒杀系统...",
  "difficulty": "hard",
  "tags": ["系统设计", "高并发", "缓存"],
  "suggestedWordCount": {
    "min": 500,
    "max": 2000
  },
  "evaluationCriteria": [
    "系统架构设计",
    "数据库设计",
    "缓存策略",
    "限流和降级方案",
    "监控和运维"
  ],
  "referencePoints": [
    "使用 Redis 缓存热点数据",
    "数据库读写分离",
    "消息队列削峰",
    "限流算法（令牌桶/漏桶）"
  ],
  "referenceAnswer": "秒杀系统的核心挑战是..."
}
```

**界面设计**：

```
+--------------------------------------------------+
| 题库管理                                [+ 新增题目] |
+--------------------------------------------------+
| [搜索] 🔍  [类型: 全部 ▼] [难度: 全部 ▼] [标签 ▼] |
+--------------------------------------------------+
| ID | 标题        | 类型 | 难度 | 标签    | 操作    |
|----|------------|------|------|---------|---------|
| 1  | Two Sum    | 编程 | 简单 | 数组    | [编辑][删] |
| 2  | 秒杀系统   | 问答 | 困难 | 系统设计 | [编辑][删] |
+--------------------------------------------------+
```

**编程题编辑界面**：

```
+--------------------------------------------------+
| 新增编程题                                        |
+--------------------------------------------------+
| 基本信息:                                         |
| 标题 *: [Two Sum_______________________________] |
| 难度 *: [简单 ▼]  类型: 编程题                    |
| 标签: [数组] [哈希表] [+ 添加]                    |
| 时间限制: [1000] ms  内存限制: [256] MB           |
+--------------------------------------------------+
| 题目描述 * (支持 Markdown):                       |
| [Markdown 编辑器]                                |
|                                                  |
+--------------------------------------------------+
| 支持语言:                                         |
| ☑ Python  ☑ JavaScript  ☑ Java  ☑ C++          |
+--------------------------------------------------+
| 代码模板:                                         |
| Python:                                          |
| [代码编辑器]                                      |
| def twoSum(nums, target):                         |
|     pass                                         |
+--------------------------------------------------+
| 测试用例: [+ 添加测试用例] [批量导入 JSON]          |
|                                                  |
| 测试用例 1: [公开 ▼]                              |
| 输入: [[2,7,11,15], 9_________________________] |
| 预期输出: [[0,1]______________________________] |
| 说明: [因为 nums[0] + nums[1] == 9____________] |
| 权重: [1] [删除]                                 |
|                                                  |
| 测试用例 2: [隐藏 ▼]                              |
| ...                                              |
+--------------------------------------------------+
| 标准答案 (可选):                                  |
| [代码编辑器]                                      |
| 时间复杂度: [O(n)___] 空间复杂度: [O(n)___]      |
+--------------------------------------------------+
| [取消] [保存草稿] [发布]                          |
+--------------------------------------------------+
```

**业务规则**：

1. **题目验证**：
   - 标题唯一
   - 至少 1 个测试用例
   - 至少支持 1 种编程语言
   - 公开测试用例不少于 2 个

2. **测试用例导入**：
   - 支持 JSON 格式批量导入
   - 格式验证
   - 自动执行标准答案验证

3. **题目状态**：
   - 草稿：不可用于面试
   - 已发布：可用于面试
   - 已归档：不可用，但保留记录

4. **删除保护**：
   - 已用于面试的题目不可删除
   - 软删除机制
   - 删除前二次确认

**接口设计**：

```typescript
// POST /api/admin/questions
interface CreateQuestionRequest {
  type: 'programming' | 'qa';
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  // 编程题特有字段
  timeLimit?: number;
  memoryLimit?: number;
  languages?: string[];
  templates?: Record<string, string>;
  testCases?: TestCase[];
  standardSolution?: StandardSolution;
  // 问答题特有字段
  suggestedWordCount?: { min: number; max: number };
  evaluationCriteria?: string[];
  referencePoints?: string[];
  referenceAnswer?: string;
}

// PUT /api/admin/questions/:id
// DELETE /api/admin/questions/:id
// GET /api/admin/questions
// GET /api/admin/questions/:id
```

**验收标准**：
- [ ] 能添加编程题和问答题
- [ ] 测试用例配置正确
- [ ] 支持 Markdown 编辑和预览
- [ ] 代码模板支持多语言
- [ ] 可以批量导入测试用例
- [ ] 编辑和删除功能正常
- [ ] 题目搜索和筛选准确
- [ ] 标签管理功能完善
- [ ] 标准答案自动验证
- [ ] 已使用的题目删除保护

---

#### F12：面试模板管理

**优先级**：Could Have  
**预估工时**：2 人日

**功能描述**：
管理员创建面试模板，配置题目组合、时间限制、通过标准等，模板可复用于多个面试场次。

**模板配置**：

```json
{
  "id": 1,
  "name": "后端开发标准面试",
  "description": "适用于初中级后端开发工程师",
  "duration": 120,
  "passingScore": 70,
  "questions": [
    {
      "questionId": 1,
      "order": 1,
      "weight": 20,
      "required": true
    },
    {
      "questionId": 5,
      "order": 2,
      "weight": 30,
      "required": true
    }
  ],
  "settings": {
    "allowSkip": true,
    "allowBacktrack": true,
    "showScoreImmediately": false,
    "autoSubmitOnTimeout": true
  }
}
```

**界面设计**：

```
+--------------------------------------------------+
| 面试模板管理                        [+ 创建模板]  |
+--------------------------------------------------+
| 模板列表:                                         |
|                                                  |
| 📋 后端开发标准面试                               |
|    5道题 | 120分钟 | 通过线70分                    |
|    [编辑] [复制] [删除] [查看使用记录]             |
|                                                  |
| 📋 前端开发标准面试                               |
|    4道题 | 90分钟 | 通过线65分                     |
|    [编辑] [复制] [删除] [查看使用记录]             |
+--------------------------------------------------+
```

**模板编辑界面**：

```
+--------------------------------------------------+
| 创建面试模板                                      |
+--------------------------------------------------+
| 基本信息:                                         |
| 模板名称 *: [后端开发标准面试__________________] |
| 描述: [适用于初中级后端开发工程师______________] |
| 总时长: [120] 分钟                               |
| 通过分数线: [70] 分                              |
+--------------------------------------------------+
| 题目配置: [+ 添加题目]                            |
|                                                  |
| [可拖拽排序]                                      |
|                                                  |
| 1. Two Sum (编程题 - 简单)                       |
|    权重: [20] %  ☑ 必答  [▲][▼] [删除]          |
|                                                  |
| 2. 设计秒杀系统 (问答题 - 困难)                   |
|    权重: [30] %  ☑ 必答  [▲][▼] [删除]          |
|                                                  |
| 3. ...                                           |
|                                                  |
| 总权重: 100% ✅                                  |
+--------------------------------------------------+
| 高级设置:                                         |
| ☑ 允许跳过题目                                   |
| ☑ 允许返回修改                                   |
| ☐ 提交后立即显示分数                             |
| ☑ 超时自动提交                                   |
+--------------------------------------------------+
| [取消] [保存]                                    |
+--------------------------------------------------+
```

**业务规则**：

1. **题目选择**：
   - 至少 1 道题
   - 最多 10 道题
   - 权重总和必须为 100%

2. **时间设置**：
   - 建议 30-180 分钟
   - 可根据题目数量自动计算建议时长

3. **通过标准**：
   - 默认 60 分
   - 可调整 0-100 分

4. **模板复用**：
   - 可复制已有模板
   - 可查看模板使用记录
   - 正在使用的模板不可删除

**接口设计**：

```typescript
// POST /api/admin/templates
interface CreateTemplateRequest {
  name: string;
  description: string;
  duration: number;  // 分钟
  passingScore: number;
  questions: Array<{
    questionId: number;
    order: number;
    weight: number;
    required: boolean;
  }>;
  settings: TemplateSettings;
}

// GET /api/admin/templates
// PUT /api/admin/templates/:id
// DELETE /api/admin/templates/:id
// POST /api/admin/templates/:id/duplicate  // 复制模板
// GET /api/admin/templates/:id/usage  // 使用记录
```

**验收标准**：
- [ ] 能创建和编辑模板
- [ ] 题目选择和排序灵活
- [ ] 权重自动计算和验证
- [ ] 可拖拽调整题目顺序
- [ ] 模板复制功能正常
- [ ] 使用记录准确显示
- [ ] 正在使用的模板删除保护
- [ ] 高级设置生效

---

#### F13：用户与权限管理

**优先级**：Could Have  
**预估工时**：2 人日

**功能描述**：
管理员可以查看、管理所有用户，分配角色权限，禁用/启用账号，查看用户活动日志。

**界面设计**：

```
+--------------------------------------------------+
| 用户管理                            [+ 邀请用户]  |
+--------------------------------------------------+
| [搜索] 🔍  [角色: 全部 ▼] [状态: 全部 ▼]          |
+--------------------------------------------------+
| 用户名 | 邮箱           | 角色   | 状态 | 操作    |
|--------|---------------|--------|------|---------|
| 张三   | zhang@xx.com  | 候选人 | 激活 | [编辑]  |
| 李四   | li@xx.com     | 面试官 | 激活 | [编辑]  |
| 王五   | wang@xx.com   | 管理员 | 激活 | [编辑]  |
+--------------------------------------------------+
```

**用户编辑**：

```
+--------------------------------------------------+
| 编辑用户                                [关闭 ×]  |
+--------------------------------------------------+
| 用户名: 张三                                      |
| 邮箱: zhang@example.com                          |
| 注册时间: 2025-10-20                             |
| 最后登录: 2025-10-25 09:00                       |
+--------------------------------------------------+
| 角色 *: [候选人 ▼]                               |
|   ○ 候选人  ○ 面试官  ● 管理员                  |
+--------------------------------------------------+
| 账号状态:                                        |
|   ☑ 激活  ☐ 禁用                                |
+--------------------------------------------------+
| [保存] [重置密码] [查看活动日志]                  |
+--------------------------------------------------+
```

**活动日志**：

```
+--------------------------------------------------+
| 用户活动日志 - 张三                               |
+--------------------------------------------------+
| 时间              | 操作         | IP地址     | 详情 |
|------------------|-------------|-----------|------|
| 2025-10-25 09:00 | 登录成功    | 192.168.1.1| -   |
| 2025-10-25 09:05 | 进入面试    | 192.168.1.1|场次101|
| 2025-10-25 10:30 | 提交编程题  | 192.168.1.1|题目1 |
+--------------------------------------------------+
```

**业务规则**：

1. **角色变更**：
   - 需二次确认
   - 不能删除自己的管理员权限
   - 记录变更历史

2. **账号禁用**：
   - 禁用后用户无法登录
   - 已登录的 Token 立即失效
   - 可重新启用

3. **密码重置**：
   - 发送重置邮件
   - 临时密码 24 小时有效

4. **审计日志**：
   - 记录所有敏感操作
   - 保留 90 天

**验收标准**：
- [ ] 能查看所有用户
- [ ] 角色分配正常工作
- [ ] 禁用/启用功能有效
- [ ] 密码重置邮件发送成功
- [ ] 活动日志记录完整
- [ ] 操作有二次确认
- [ ] 权限变更有审计日志

---

### 模块 5：报告与统计分析

#### F14：完整面试报告

详见 F10，此处不再重复。

---

#### F15：统计仪表盘

**优先级**：Could Have  
**预估工时**：3 人日

**功能描述**：
展示面试系统整体运营数据，包括面试数量、通过率、题目分析、候选人表现等多维度统计。

**仪表盘布局**：

```
+--------------------------------------------------+
| 数据统计仪表盘                [时间: 本周 ▼]       |
+--------------------------------------------------+
| 核心指标                                          |
| +------------+ +------------+ +------------+      |
| | 总面试数   | | 今日面试   | | 平均得分   |      |
| | 127 场     | | 15 场      | | 76.5 分    |      |
| | +12% ↑    | | +3 ↑       | | -2.1% ↓   |      |
| +------------+ +------------+ +------------+      |
| +------------+ +------------+                     |
| | 通过率     | | 平均用时   |                     |
| | 68.5%      | | 98 分钟    |                     |
| | +5% ↑     | | -5min ↓   |                     |
| +------------+ +------------+                     |
+--------------------------------------------------+
| 面试趋势                                          |
| [折线图] 最近7天面试数量和通过率                   |
|                                                  |
+--------------------------------------------------+
| 题目分析                          | 候选人分布    |
| [柱状图] 各题目平均分             | [饼图] 分数段 |
|                                   |              |
+--------------------------------------------------+
| 最近面试记录                                      |
| 候选人 | 时间   | 得分 | 状态                     |
|--------|--------|------|-------                  |
| 张三   | 10-25  | 85   | 已通过                  |
+--------------------------------------------------+
```

**统计维度**：

1. **整体统计**：
   - 总面试数（环比增长）
   - 今日/本周面试数
   - 平均得分（趋势）
   - 通过率（趋势）
   - 平均用时

2. **题目维度**：
   - 各题目平均分
   - 各题目通过率
   - 最难/最易题目
   - 题目类型分布

3. **候选人维度**：
   - 分数分布（0-60, 60-70, 70-80, 80-90, 90-100）
   - 来源分析（如果有）
   - 地域分布（如果有）

4. **时间维度**：
   - 每日面试数趋势
   - 峰值时段分析
   - 周/月对比

**技术实现**：

```typescript
@Injectable()
export class StatisticsService {
  async getDashboardData(query: DashboardQuery) {
    const { startDate, endDate } = this.parseDateRange(query.timeRange);

    const [
      overallStats,
      trends,
      questionStats,
      candidateDistribution,
      recentInterviews
    ] = await Promise.all([
      this.getOverallStats(startDate, endDate),
      this.getTrends(startDate, endDate),
      this.getQuestionStats(startDate, endDate),
      this.getCandidateDistribution(startDate, endDate),
      this.getRecentInterviews(10)
    ]);

    return {
      overallStats,
      trends,
      questionStats,
      candidateDistribution,
      recentInterviews
    };
  }

  private async getOverallStats(startDate: Date, endDate: Date) {
    const currentPeriod = await this.interviewRepo
      .createQueryBuilder('interview')
      .where('interview.completedAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate
      })
      .select([
        'COUNT(*) as totalCount',
        'AVG(score) as avgScore',
        'AVG(duration) as avgDuration',
        'SUM(CASE WHEN score >= passingScore THEN 1 ELSE 0 END) / COUNT(*) as passRate'
      ])
      .getRawOne();

    // 计算上一周期数据用于对比
    const previousPeriod = await this.getPreviousPeriodStats(startDate, endDate);

    return {
      totalInterviews: currentPeriod.totalCount,
      avgScore: currentPeriod.avgScore,
      avgDuration: currentPeriod.avgDuration,
      passRate: currentPeriod.passRate * 100,
      trends: {
        totalInterviews: this.calculateGrowth(currentPeriod, previousPeriod, 'totalCount'),
        avgScore: this.calculateGrowth(currentPeriod, previousPeriod, 'avgScore'),
        passRate: this.calculateGrowth(currentPeriod, previousPeriod, 'passRate'),
      }
    };
  }
}
```

**图表组件**：

```typescript
// 使用 Recharts
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const InterviewTrendChart = ({ data }) => {
  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="count" stroke="#8884d8" name="面试数" />
      <Line type="monotone" dataKey="passRate" stroke="#82ca9d" name="通过率%" />
    </LineChart>
  );
};
```

**缓存策略**：

```typescript
// 统计数据每小时更新一次
@Injectable()
export class StatisticsCacheService {
  @Cron('0 * * * *')  // 每小时执行
  async refreshStatistics() {
    const data = await this.statisticsService.getDashboardData({
      timeRange: 'week'
    });

    await this.cacheService.set('dashboard:week', data, 3600);
  }
}
```

**接口设计**：

```typescript
// GET /api/statistics/dashboard
interface DashboardQuery {
  timeRange?: 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
}

// GET /api/statistics/questions
// 题目统计

// GET /api/statistics/export
// 导出 Excel
```

**验收标准**：
- [ ] 数据统计准确无误
- [ ] 图表展示清晰美观
- [ ] 时间范围切换正常
- [ ] 环比增长计算正确
- [ ] 支持导出 Excel
- [ ] 数据加载性能良好（< 2秒）
- [ ] 移动端响应式布局
- [ ] 缓存机制有效

---

## 三、技术栈说明

### 3.1 前端技术栈

| 技术 | 选型 | 用途 |
|------|------|------|
| **框架** | Next.js 14 | React 全栈框架，支持 SSR/SSG |
| **语言** | TypeScript 5 | 类型安全 |
| **样式** | Tailwind CSS 3 | 实用优先的 CSS 框架 |
| **UI 组件库** | Ant Design 5 / shadcn/ui | 企业级 UI 组件 |
| **代码编辑器** | Monaco Editor | VS Code 同款编辑器 |
| **Markdown 编辑器** | @uiw/react-md-editor | Markdown 编辑和预览 |
| **状态管理** | Zustand / React Context | 轻量级状态管理 |
| **数据请求** | TanStack Query (React Query) | 服务端状态管理 |
| **表单** | React Hook Form + Zod | 表单验证 |
| **图表** | Recharts / ECharts | 数据可视化 |
| **实时通信** | Socket.IO Client | WebSocket 通信 |

### 3.2 后端技术栈

| 技术 | 选型 | 用途 |
|------|------|------|
| **框架** | NestJS 10 | Node.js 企业级框架 |
| **语言** | TypeScript 5 | 类型安全 |
| **HTTP 服务器** | Express (NestJS 默认) | HTTP 处理 |
| **数据库** | PostgreSQL 15 | 关系型数据库 |
| **ORM** | Prisma | 类型安全的 ORM |
| **缓存** | Redis 7 | 缓存和消息队列 |
| **消息队列** | Bull (基于 Redis) | 异步任务处理 |
| **代码执行沙箱** | Docker | 隔离的代码执行环境 |
| **AI 服务** | OpenAI API (GPT-4) | AI 评分 |
| **身份认证** | Passport + JWT | 鉴权 |
| **文件存储** | 阿里云 OSS / AWS S3 | 对象存储 |
| **PDF 生成** | Puppeteer / PDFKit | PDF 报告生成 |
| **日志** | Winston + ELK | 日志管理 |
| **监控** | Prometheus + Grafana | 系统监控 |
| **WebSocket** | Socket.IO | 实时通信 |

### 3.3 开发工具

| 工具 | 用途 |
|------|------|
| **版本控制** | Git + GitHub |
| **包管理** | pnpm |
| **代码规范** | ESLint + Prettier |
| **Git Hooks** | Husky + lint-staged |
| **API 文档** | Swagger / Scalar |
| **API 测试** | Postman / Bruno |
| **容器化** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |

### 3.4 部署架构

```
[前端 Next.js]  ←→  [Nginx 反向代理]  ←→  [后端 NestJS]
                                             ↓
                                        [PostgreSQL]
                                             ↓
                                          [Redis]
                                             ↓
                                      [Docker 沙箱集群]
```

---

## 四、数据模型

### 4.1 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 角色表
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,  -- candidate, interviewer, admin
  description TEXT
);

-- 题目表
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,  -- programming, qa
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL,  -- easy, medium, hard
  tags JSONB,
  config JSONB,  -- 题目配置（测试用例、时间限制等）
  status VARCHAR(20) DEFAULT 'draft',  -- draft, published, archived
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 面试模板表
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INT NOT NULL,  -- 分钟
  passing_score DECIMAL(5,2) NOT NULL,
  questions JSONB NOT NULL,  -- [{questionId, order, weight, required}]
  settings JSONB,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 面试场次表
CREATE TABLE interview_sessions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  template_id INT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',  -- scheduled, ongoing, completed, cancelled
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 候选人-场次关联表
CREATE TABLE session_candidates (
  id SERIAL PRIMARY KEY,
  session_id INT NOT NULL,
  candidate_id INT NOT NULL,
  interviewer_id INT,
  status VARCHAR(20) DEFAULT 'invited',  -- invited, started, completed
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES interview_sessions(id),
  FOREIGN KEY (candidate_id) REFERENCES users(id),
  FOREIGN KEY (interviewer_id) REFERENCES users(id),
  UNIQUE(session_id, candidate_id)
);

-- 提交记录表
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  session_candidate_id INT NOT NULL,
  question_id INT NOT NULL,
  type VARCHAR(20) NOT NULL,  -- programming, qa
  code TEXT,  -- 编程题代码
  language VARCHAR(20),  -- 编程语言
  answer TEXT,  -- 问答题答案
  result JSONB,  -- 执行结果
  status VARCHAR(20) DEFAULT 'pending',  -- pending, running, completed, failed
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_candidate_id) REFERENCES session_candidates(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- 评分记录表
CREATE TABLE score_records (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL UNIQUE,
  ai_score DECIMAL(5,2),
  ai_feedback JSONB,  -- AI 反馈详情
  human_score DECIMAL(5,2),
  human_feedback TEXT,
  final_score DECIMAL(5,2),
  adjusted_by INT,
  adjusted_at TIMESTAMP,
  reason TEXT,  -- 调整理由
  FOREIGN KEY (submission_id) REFERENCES submissions(id),
  FOREIGN KEY (adjusted_by) REFERENCES users(id)
);

-- 面试报告表
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  session_candidate_id INT NOT NULL UNIQUE,
  data JSONB NOT NULL,  -- 报告完整数据
  pdf_url VARCHAR(500),
  recommendation VARCHAR(20),  -- pass, pending, fail
  overall_comment TEXT,
  generated_by INT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_candidate_id) REFERENCES session_candidates(id),
  FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- 审计日志表
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id INT,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4.2 索引优化

```sql
-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);

-- 题目表索引
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);

-- 面试场次索引
CREATE INDEX idx_sessions_status ON interview_sessions(status);
CREATE INDEX idx_sessions_time ON interview_sessions(start_time, end_time);

-- 提交记录索引
CREATE INDEX idx_submissions_session_candidate ON submissions(session_candidate_id);
CREATE INDEX idx_submissions_question ON submissions(question_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- 审计日志索引
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 五、开发计划

### 5.1 里程碑规划

| 阶段 | 时间 | 目标 | 关键交付物 |
|-----|------|------|-----------|
| **阶段 0** | 0.5 天 | 环境搭建 | - 项目初始化<br>- Docker 环境<br>- 数据库设计 |
| **阶段 1** | 1.5 天 | 用户认证 | - 注册登录<br>- 权限控制<br>- JWT 鉴权 |
| **阶段 2** | 3 天 | 编程题模块 | - 代码编辑器<br>- 沙箱执行<br>- 测试评分 |
| **阶段 3** | 2 天 | 问答题模块 | - Markdown 编辑器<br>- AI 评分 |
| **阶段 4** | 2 天 | 候选人流程 | - 面试场次<br>- 答题流程<br>- 结果查看 |
| **阶段 5** | 2 天 | 面试官后台 | - 候选人管理<br>- 评分复核<br>- 报告生成 |
| **阶段 6** | 2 天 | 管理员功能 | - 题库管理<br>- 模板管理<br>- 用户管理 |
| **阶段 7** | 1.5 天 | 统计分析 | - 仪表盘<br>- 数据报表 |
| **阶段 8** | 1.5 天 | 测试优化 | - 单元测试<br>- 集成测试<br>- 性能优化 |
| **阶段 9** | 1 天 | 部署上线 | - Docker 部署<br>- CI/CD<br>- 文档完善 |

**总计**: 约 17 天

### 5.2 任务分解（阶段 0-2 详细）

#### 阶段 0: 环境搭建 (0.5 天)

- [ ] 创建 Git 仓库
- [ ] 初始化 Next.js 项目
- [ ] 初始化 NestJS 项目
- [ ] 配置 TypeScript
- [ ] 配置 ESLint + Prettier
- [ ] 配置 Tailwind CSS
- [ ] 设置 Docker Compose（PostgreSQL + Redis）
- [ ] 初始化 Prisma Schema
- [ ] 运行数据库迁移
- [ ] 配置环境变量

#### 阶段 1: 用户认证 (1.5 天)

**后端任务**：
- [ ] 实现用户注册 API
- [ ] 实现用户登录 API
- [ ] 实现 JWT 生成和验证
- [ ] 实现角色权限守卫
- [ ] 实现密码加密（bcrypt）
- [ ] 实现登录失败锁定机制
- [ ] 编写单元测试

**前端任务**：
- [ ] 创建登录页面
- [ ] 创建注册页面
- [ ] 实现表单验证
- [ ] 实现 Auth Context
- [ ] 实现 Protected Route
- [ ] 实现 Token 自动刷新

#### 阶段 2: 编程题模块 (3 天)

**后端任务**：
- [ ] 设计题目数据模型
- [ ] 实现题目 CRUD API
- [ ] 实现 Docker 沙箱服务
- [ ] 实现代码执行服务
- [ ] 实现测试用例执行
- [ ] 实现评分算法
- [ ] 实现 AI 代码质量评估
- [ ] 实现消息队列（Bull）
- [ ] 编写集成测试

**前端任务**：
- [ ] 集成 Monaco Editor
- [ ] 实现代码编辑器组件
- [ ] 实现多语言切换
- [ ] 实现运行测试功能
- [ ] 实现提交功能
- [ ] 实现结果展示
- [ ] 实现代码自动保存
- [ ] 实现 WebSocket 实时反馈

### 5.3 技术风险与对策

| 风险 | 影响 | 对策 |
|-----|------|------|
| Docker 沙箱性能问题 | 高 | - 使用容器池<br>- 实现排队机制<br>- 监控资源使用 |
| AI API 调用失败 | 中 | - 实现重试机制<br>- 提供降级方案<br>- 使用本地模型备份 |
| 并发执行资源耗尽 | 高 | - 限制并发数<br>- 使用消息队列<br>- 动态扩容 |
| 数据库性能瓶颈 | 中 | - 优化查询<br>- 添加索引<br>- 使用 Redis 缓存 |
| 前端代码编辑器卡顿 | 低 | - 使用 Web Worker<br>- 懒加载<br>- 虚拟滚动 |

### 5.4 测试策略

**单元测试（目标覆盖率 80%）**：
- 所有服务层函数
- 所有工具函数
- 核心算法

**集成测试**：
- API 端到端测试
- 数据库操作测试
- 第三方服务集成测试

**端到端测试（关键流程）**：
- 用户注册登录流程
- 完整答题流程
- 面试官评分流程
- 报告生成流程

**性能测试**：
- 并发编程题执行（100 并发）
- API 响应时间（P99 < 500ms）
- 数据库查询性能

### 5.5 部署方案

**开发环境**：
```bash
docker-compose -f docker-compose.dev.yml up
```

**生产环境**：
```bash
# 使用 Docker Swarm 或 Kubernetes
docker-compose -f docker-compose.prod.yml up -d
```

**CI/CD 流程**：
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    - run: pnpm test
  build:
    - run: docker build
  deploy:
    - run: docker push
    - run: kubectl apply
```

---

## 六、附录

### 6.1 API 文档规范

所有 API 遵循 RESTful 规范，使用 Swagger 自动生成文档。

**通用响应格式**：
```typescript
{
  "success": true,
  "data": any,
  "message": string,
  "error": {
    "code": string,
    "message": string,
    "details": any
  }
}
```

### 6.2 错误码规范

| 前缀 | 模块 | 示例 |
|------|------|------|
| USER_ | 用户模块 | USER_001: 邮箱已存在 |
| AUTH_ | 认证模块 | AUTH_001: 用户名或密码错误 |
| QUESTION_ | 题目模块 | QUESTION_001: 题目不存在 |
| SUBMISSION_ | 提交模块 | SUBMISSION_001: 代码执行超时 |
| SCORE_ | 评分模块 | SCORE_001: AI 评分失败 |

### 6.3 代码规范

**命名约定**：
- 文件名：kebab-case（user-service.ts）
- 类名：PascalCase（UserService）
- 函数名：camelCase（getUserById）
- 常量：UPPER_SNAKE_CASE（MAX_RETRY_COUNT）

**注释规范**：
```typescript
/**
 * 用户登录
 * @param dto 登录信息
 * @returns JWT Token 和用户信息
 * @throws {UnauthorizedException} 用户名或密码错误
 */
async login(dto: LoginDto): Promise<LoginResponse> {
  // ...
}
```

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2025-10-21 | 初始版本 | AI Assistant |

---

**文档结束**
