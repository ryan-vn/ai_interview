# 岗位管理 API 文档

## 概述

岗位管理模块提供完整的CRUD操作，支持岗位信息的创建、编辑、删除、查询和状态管理。

**权限要求**：所有写操作（创建、编辑、删除）仅限 HR 和管理员角色。

## 数据模型

### Job 实体

```typescript
{
  id: number;                        // 岗位ID
  title: string;                     // 岗位名称（必填，最大100字符）
  department: string;                // 所属部门（必填，最大100字符）
  responsibilities: string;          // 岗位职责（必填，文本）
  requirements: string;              // 技能要求（必填，文本）
  skillKeywords: string[];           // 技能关键词（可选，JSON数组）
  hiringCount: number;               // 招聘人数（可选）
  educationRequirement: string;      // 学历要求（可选，最大50字符）
  experienceRequirement: string;     // 工作年限要求（可选，最大50字符）
  salaryRange: string;               // 薪资范围（可选，最大50字符）
  location: string;                  // 工作地点（可选，最大100字符）
  status: 'open' | 'closed';        // 岗位状态（默认：open）
  createdBy: number;                 // 创建者ID
  isDeleted: boolean;                // 是否已删除（软删除标志）
  createdAt: Date;                   // 创建时间
  updatedAt: Date;                   // 更新时间
}
```

### 岗位状态说明

- `open`: 开放招聘，允许投递简历和匹配
- `closed`: 已关闭，不再接受新的简历投递

## API 端点

### 1. 创建岗位

**POST** `/api/jobs`

**权限要求**: HR、管理员

**请求体**:

```json
{
  "title": "高级前端开发工程师",
  "department": "技术研发部",
  "responsibilities": "负责公司核心产品的前端开发...",
  "requirements": "3年以上前端开发经验...",
  "skillKeywords": ["React", "TypeScript", "Node.js"],
  "hiringCount": 2,
  "educationRequirement": "本科及以上",
  "experienceRequirement": "3-5年",
  "salaryRange": "20k-35k",
  "location": "北京",
  "status": "open"
}
```

**响应 201**:

```json
{
  "id": 1,
  "title": "高级前端开发工程师",
  "department": "技术研发部",
  // ... 其他字段
  "createdAt": "2025-10-24T10:00:00.000Z",
  "updatedAt": "2025-10-24T10:00:00.000Z"
}
```

**响应 409 - 冲突**:

```json
{
  "statusCode": 409,
  "message": "同部门已存在同名岗位"
}
```

**业务规则**:
- 同一部门内岗位名称不能重复
- 岗位名称、部门、职责、要求为必填项
- 技能关键词用于简历匹配计算

---

### 2. 获取岗位列表

**GET** `/api/jobs`

**权限要求**: 已登录

**查询参数**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| page | number | 否 | 页码，默认1 | 1 |
| limit | number | 否 | 每页数量，默认10 | 10 |
| status | string | 否 | 岗位状态 | open, closed |
| department | string | 否 | 部门筛选 | 技术研发部 |
| keyword | string | 否 | 搜索关键词（搜索名称、职责、要求） | React |

**请求示例**:

```
GET /api/jobs?page=1&limit=10&status=open&department=技术研发部&keyword=React
```

**响应 200**:

```json
{
  "data": [
    {
      "id": 1,
      "title": "高级前端开发工程师",
      "department": "技术研发部",
      "status": "open",
      // ... 其他字段
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

---

### 3. 获取岗位详情

**GET** `/api/jobs/:id`

**权限要求**: 已登录

**路径参数**:
- `id`: 岗位ID

**响应 200**:

```json
{
  "id": 1,
  "title": "高级前端开发工程师",
  "department": "技术研发部",
  "responsibilities": "...",
  "requirements": "...",
  "skillKeywords": ["React", "TypeScript"],
  "hiringCount": 2,
  "status": "open",
  "creator": {
    "id": 5,
    "username": "hr_admin",
    "email": "hr@example.com"
  },
  "createdAt": "2025-10-24T10:00:00.000Z",
  "updatedAt": "2025-10-24T10:00:00.000Z"
}
```

**响应 404**:

```json
{
  "statusCode": 404,
  "message": "岗位 #1 不存在"
}
```

---

### 4. 更新岗位

**PATCH** `/api/jobs/:id`

**权限要求**: HR、管理员

**路径参数**:
- `id`: 岗位ID

**请求体**（所有字段均可选）:

```json
{
  "title": "资深前端开发工程师",
  "hiringCount": 3,
  "status": "closed"
}
```

**响应 200**:

```json
{
  "id": 1,
  "title": "资深前端开发工程师",
  "hiringCount": 3,
  "status": "closed",
  // ... 其他字段
  "updatedAt": "2025-10-24T11:00:00.000Z"
}
```

**业务规则**:
- 修改名称或部门时，会检查是否与同部门其他岗位冲突
- 可以单独更新状态（开放/关闭）

---

### 5. 删除岗位

**DELETE** `/api/jobs/:id`

**权限要求**: HR、管理员

**路径参数**:
- `id`: 岗位ID

**响应 200**:

```json
{
  "message": "删除成功"
}
```

**业务规则**:
- 采用软删除，数据不会真正从数据库中删除
- 删除后的岗位不会出现在列表查询中
- 如果有关联的简历或面试，会处理关联关系

---

### 6. 批量删除岗位

**POST** `/api/jobs/batch-delete`

**权限要求**: HR、管理员

**请求体**:

```json
{
  "ids": [1, 2, 3]
}
```

**响应 200**:

```json
{
  "message": "批量删除成功"
}
```

---

### 7. 获取部门列表

**GET** `/api/jobs/departments`

**权限要求**: 已登录

**响应 200**:

```json
[
  "技术研发部",
  "产品部",
  "市场部",
  "运营部"
]
```

**说明**:
- 返回当前所有岗位的部门列表（去重）
- 用于前端筛选器的下拉选项

---

## 使用示例

### 示例 1: 创建岗位并设置为开放状态

```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "高级后端工程师",
    "department": "技术研发部",
    "responsibilities": "负责后端服务开发和架构设计",
    "requirements": "熟悉Node.js、NestJS、MySQL、Redis",
    "skillKeywords": ["Node.js", "NestJS", "MySQL", "Redis"],
    "hiringCount": 3,
    "location": "北京",
    "status": "open"
  }'
```

### 示例 2: 搜索某部门开放的岗位

```bash
curl -X GET "http://localhost:3001/api/jobs?department=技术研发部&status=open" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 示例 3: 关闭岗位

```bash
curl -X PATCH http://localhost:3001/api/jobs/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "closed"
  }'
```

### 示例 4: 使用关键词搜索岗位

```bash
curl -X GET "http://localhost:3001/api/jobs?keyword=React&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 错误代码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（未登录或token无效） |
| 403 | 权限不足（非HR或管理员） |
| 404 | 岗位不存在 |
| 409 | 冲突（同部门已存在同名岗位） |
| 500 | 服务器内部错误 |

---

## 业务流程

### 岗位发布流程

1. HR/管理员创建岗位，填写完整信息
2. 设置技能关键词（用于后续简历匹配）
3. 设置状态为"开放"
4. 岗位发布后，可以导入简历进行匹配

### 岗位关闭流程

1. HR/管理员将岗位状态改为"已关闭"
2. 关闭后的岗位仍然保留，可以查看历史信息
3. 关闭后不会参与新的简历匹配

### 岗位删除流程

1. HR/管理员删除岗位（软删除）
2. 检查是否有关联的简历或面试
3. 删除后的岗位不再显示在列表中

---

## 前端集成

### 岗位管理页面

**路径**: `/admin/jobs`

**功能**:
- 岗位列表展示（卡片式）
- 搜索和筛选（关键词、状态、部门）
- 创建新岗位
- 编辑岗位
- 删除岗位
- 状态切换（开放/关闭）
- 分页

### 编辑岗位页面

**路径**: `/admin/jobs/[id]`

**功能**:
- 完整表单编辑所有字段
- 状态切换
- 保存修改

---

## 数据库索引

为了提高查询性能，已在以下字段创建索引：

- `department`: 部门查询
- `status`: 状态筛选
- `is_deleted`: 软删除过滤
- `created_by`: 创建者查询

---

## 注意事项

1. **岗位名称唯一性**: 在同一部门内，岗位名称必须唯一
2. **技能关键词**: 用于简历匹配算法，建议填写准确的技能标签
3. **软删除**: 删除操作不会真正删除数据，只是标记为已删除
4. **权限控制**: 所有写操作必须是HR或管理员角色
5. **关联关系**: 岗位可能与简历、面试、匹配结果关联

---

## 后续扩展

待实现的功能：

- [ ] 岗位发布到外部招聘平台
- [ ] 岗位浏览量统计
- [ ] 岗位收藏功能（候选人）
- [ ] 岗位推荐算法优化
- [ ] 岗位模板功能
- [ ] 岗位复制功能
- [ ] 岗位审批流程

