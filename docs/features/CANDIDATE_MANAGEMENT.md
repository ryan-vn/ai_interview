# 候选人管理功能说明

## 功能概述

本文档说明了 AI 面试系统中的候选人管理功能，包括候选人录入、列表查看和管理等核心功能。

---

## 📋 功能列表

### 1. 候选人录入 ✨新增

**访问路径**：`/admin/candidates/create`

**功能描述**：
- 独立的候选人信息录入页面
- HR可以在创建面试之前预先录入候选人信息
- 录入的候选人会进入"候选人池"，方便后续创建面试时选择

**支持字段**：
- ✅ **必填字段**
  - 姓名
  - 邮箱（作为唯一标识）
  
- ✅ **选填字段**
  - 手机号
  - 应聘职位
  - 简历链接或摘要
  - 备注信息

**数据存储**：
- 当前版本：存储在浏览器 localStorage 中（候选人池）
- 未来版本：将扩展后端API支持候选人数据库存储

---

### 2. 候选人列表管理 ✅已有+增强

**访问路径**：`/admin/candidates`

**功能描述**：
- 查看所有候选人信息
- 统计候选人的面试次数和历史
- 区分候选人来源（候选人池 vs 已有面试）

**功能特性**：

#### 数据来源（双重整合）
1. **已有面试的候选人**：从后端API获取（`GET /api/interviews/hr/candidates`）
2. **候选人池**：从本地存储获取预先录入的候选人
3. **智能合并**：自动合并两个来源的数据，避免重复

#### 统计信息
- 📊 总候选人数
- 👥 活跃候选人数（有面试记录的）
- 📈 平均面试次数
- 📅 本月新增候选人数

#### 候选人卡片显示
- 基本信息：姓名、邮箱、电话、职位
- 面试统计：
  - 面试总次数
  - 首次面试时间
  - 最近面试时间
  - 面试频率（自动计算）
- 标签区分：
  - 🟢 "候选人池"标签：未有面试记录的预录入候选人
  - 📊 面试次数标签

#### 搜索功能
- 支持按姓名搜索
- 支持按邮箱搜索
- 支持按职位搜索
- 实时过滤

#### 快捷操作
- 为候选人创建新面试
- 查看候选人的所有面试

---

## 🔄 业务流程

### 方式一：先录入候选人，再创建面试（推荐）

```
1. HR访问候选人管理页面 (/admin/candidates)
   ↓
2. 点击"录入候选人"按钮
   ↓
3. 填写候选人基本信息
   ↓
4. 保存到候选人池
   ↓
5. 创建面试时可从候选人池选择
   ↓
6. 面试创建后，候选人自动关联面试记录
```

### 方式二：直接创建面试（传统方式）

```
1. HR创建面试场次
   ↓
2. 在创建表单中填写候选人信息
   ↓
3. 候选人信息随面试一起保存
   ↓
4. 候选人自动出现在候选人列表中
```

---

## 🎨 UI/UX 特性

### 视觉设计
- ✨ 现代化卡片式布局
- 📊 清晰的数据统计展示
- 🎯 直观的操作按钮
- 🏷️ 醒目的标签系统（区分候选人来源）

### 用户体验
- 🔍 实时搜索过滤
- 💾 自动保存
- ✅ 表单验证
- 📱 响应式设计（支持桌面和平板）
- 🎨 友好的提示信息

---

## 🔌 API 接口

### 后端API（已实现）

#### 获取候选人列表
```typescript
GET /api/interviews/hr/candidates
Authorization: Bearer <token>
Roles: admin

Response: {
  data: [
    {
      name: string;
      email: string;
      phone?: string;
      position?: string;
      interviewCount: number;
      firstInterviewDate: string;
      lastInterviewDate: string;
    }
  ]
}
```

**实现位置**：
- Controller: `backend/src/interviews/interviews.controller.ts` (Line 144-149)
- Service: `backend/src/interviews/interviews.service.ts` (Line 263-294)

**数据来源**：
- 从 `interview_sessions` 表中提取候选人信息
- 自动去重（按邮箱）
- 统计每个候选人的面试次数和时间范围

---

## 💾 数据结构

### 候选人池数据（LocalStorage）

```typescript
interface CandidatePool {
  id: number;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  resume?: string;
  notes?: string;
  createdAt: string; // ISO 8601
}

// 存储键
localStorage.candidatesPool: CandidatePool[]
```

### 面试关联的候选人（数据库）

```sql
-- interview_sessions 表中的候选人字段
candidate_name VARCHAR(100)
candidate_email VARCHAR(100)
candidate_phone VARCHAR(20)
position VARCHAR(100)
```

---

## 🚀 未来扩展计划

### 短期优化
1. ✅ 添加候选人编辑功能
2. ✅ 添加候选人删除功能
3. ✅ 添加候选人导入功能（Excel/CSV）
4. ✅ 添加候选人导出功能

### 中期扩展
1. 🔄 将候选人池迁移到数据库存储
2. 🔄 添加候选人标签系统
3. 🔄 添加候选人技能树
4. 🔄 添加候选人简历附件上传

### 长期规划
1. 🎯 候选人评价系统
2. 🎯 候选人匹配推荐（AI）
3. 🎯 候选人生命周期管理
4. 🎯 批量操作（批量邮件、批量安排面试）

---

## 📝 使用指南

### 对于HR管理员

#### 录入新候选人
1. 登录系统后，访问"候选人管理"页面
2. 点击右上角"录入候选人"按钮
3. 填写候选人基本信息（必填：姓名、邮箱）
4. 可选择填写补充信息（电话、职位、简历等）
5. 点击"保存"按钮

#### 查看候选人列表
1. 访问"候选人管理"页面
2. 查看统计数据卡片（总数、活跃数等）
3. 使用搜索框过滤候选人
4. 点击候选人卡片查看详细信息

#### 为候选人创建面试
1. 在候选人列表中找到目标候选人
2. 点击"创建面试"按钮
3. 系统会自动填充候选人信息
4. 完善其他面试信息并提交

---

## 🔧 技术实现细节

### 前端组件

**主要文件**：
```
frontend/app/admin/candidates/
├── page.tsx              # 候选人列表页面（已增强）
└── create/
    └── page.tsx          # 候选人录入页面（新增）
```

**使用的UI组件**：
- Card, CardContent, CardHeader, CardTitle
- Button
- Input
- Label
- Badge（新增）
- Toast（新增）

**状态管理**：
- React useState（本地状态）
- localStorage（候选人池持久化）

### 后端实现

**Service方法**：
```typescript
async getCandidates(): Promise<any[]> {
  // 1. 从数据库获取所有面试场次的候选人信息
  const sessions = await this.sessionsRepository.find({
    select: ['candidateName', 'candidateEmail', 'candidatePhone', 'position', 'createdAt'],
    order: { createdAt: 'DESC' }
  });

  // 2. 按邮箱去重
  const candidateMap = new Map();
  
  // 3. 统计每个候选人的面试次数和时间范围
  sessions.forEach(session => {
    // ... 统计逻辑
  });

  // 4. 返回候选人列表
  return Array.from(candidateMap.values());
}
```

---

## ✅ 已完成的功能清单

- [x] 后端候选人列表API（`getCandidates`）
- [x] 前端候选人列表页面
- [x] 候选人统计数据展示
- [x] 候选人搜索功能
- [x] 候选人录入页面（新增）✨
- [x] 候选人池本地存储
- [x] 候选人来源标签区分（新增）✨
- [x] Badge UI组件（新增）
- [x] Toast通知组件（新增）
- [x] 候选人列表和候选人池数据合并（新增）✨

---

## 📚 相关文档

- [面试流程说明](../guides/INTERVIEW_WORKFLOW.md)
- [HR功能需求](../requirements/HR_FEATURES.md)
- [Swagger API文档](../api/SWAGGER_GUIDE.md)

---

**最后更新时间**：2024-10-21  
**功能状态**：✅ 已完成并可用

