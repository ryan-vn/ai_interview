# 面试邀请链接功能总结

## 功能概述

HR管理员现在可以创建面试邀请链接，候选人通过链接可以直接访问面试信息并加入面试。系统会自动发送邮件通知候选人。

## 核心功能

### 1. 创建面试邀请链接
- **位置**: `/admin/interviews/create`
- **功能**: HR填写面试信息，系统自动生成邀请链接
- **特点**: 
  - 支持候选人信息填写（姓名、邮箱、电话、职位）
  - 自动生成唯一邀请Token
  - 邀请链接7天有效期
  - 创建成功后立即显示邀请链接

### 2. 邀请链接管理
- **位置**: `/admin/interviews`
- **功能**: 查看所有面试场次的邀请链接
- **特点**:
  - 显示邀请链接URL
  - 一键复制邀请链接
  - 预览邀请页面
  - 重新发送邀请邮件

### 3. 候选人访问邀请页面
- **位置**: `/invite/[token]`
- **功能**: 候选人通过邀请链接查看面试信息
- **特点**:
  - 无需登录即可访问
  - 显示面试详细信息
  - 支持候选人加入面试

## 技术实现

### 后端API

#### 公开端点（无需认证）
```typescript
GET /api/interviews/invite/:token
// 通过邀请Token获取面试信息

POST /api/interviews/invite/:token/join
// 候选人通过邀请Token加入面试
```

#### 认证端点（需要HR权限）
```typescript
POST /api/interviews/sessions
// 创建面试场次并生成邀请链接

POST /api/interviews/sessions/:id/resend-invite
// 重新发送邀请邮件

GET /api/interviews/hr/statistics
// 获取HR统计数据

GET /api/interviews/hr/sessions
// 获取所有面试场次

POST /api/interviews/hr/batch-sessions
// 批量创建面试场次

GET /api/interviews/hr/candidates
// 获取候选人列表

DELETE /api/interviews/sessions/:id
// 取消面试场次
```

### 数据库字段

#### interview_sessions表新增字段
```sql
candidate_name VARCHAR(255) -- 候选人姓名
candidate_email VARCHAR(255) -- 候选人邮箱
candidate_phone VARCHAR(255) -- 候选人电话
position VARCHAR(255) -- 应聘职位
invite_token VARCHAR(255) UNIQUE -- 邀请Token
invite_expires_at DATETIME -- 邀请过期时间
candidate_id INT NULL -- 候选人ID（可为空）
```

### 前端页面

#### HR管理页面
- **仪表板**: `/admin` - 快速操作和统计概览
- **创建面试**: `/admin/interviews/create` - 创建面试并生成邀请链接
- **面试管理**: `/admin/interviews` - 管理所有面试场次和邀请链接
- **批量创建**: `/admin/interviews/batch` - 批量创建面试场次
- **候选人管理**: `/admin/candidates` - 管理候选人信息

#### 候选人页面
- **邀请页面**: `/invite/[token]` - 通过邀请链接访问面试信息

## 使用流程

### HR创建面试邀请
1. 登录HR管理后台 (`/admin`)
2. 点击"创建面试场次"
3. 填写面试信息：
   - 基本信息（名称、模板、时间、面试官）
   - 候选人信息（姓名、邮箱、电话、职位）
   - 面试设置（时长、是否允许重新安排、提醒设置）
4. 提交后系统自动：
   - 生成唯一邀请Token
   - 创建邀请链接
   - 发送邮件通知候选人
   - 显示邀请链接供HR复制

### 候选人使用邀请链接
1. 候选人收到邮件通知
2. 点击邮件中的邀请链接
3. 查看面试详细信息
4. 确认加入面试

### HR管理邀请链接
1. 在面试管理页面查看所有邀请链接
2. 一键复制邀请链接
3. 预览邀请页面
4. 重新发送邀请邮件
5. 取消面试场次

## 安全特性

1. **邀请Token安全**: 使用加密算法生成唯一Token
2. **访问控制**: 邀请链接端点无需认证，但需要有效Token
3. **过期机制**: 邀请链接7天自动过期
4. **角色权限**: HR功能需要admin或interviewer角色

## 邮件通知

系统集成了邮件服务，自动发送面试邀请邮件给候选人，包含：
- 面试基本信息
- 邀请链接
- 面试时间
- 注意事项

## 测试验证

所有功能已通过测试验证：
- ✅ 创建面试场次并生成邀请链接
- ✅ 邀请链接可以正常访问
- ✅ 候选人可以通过邀请链接加入面试
- ✅ 支持重新发送邀请邮件
- ✅ HR可以查看统计数据
- ✅ 角色权限控制正常

## 部署说明

1. 确保数据库已更新（运行init.sql）
2. 重启后端服务
3. 前端页面已更新，无需额外配置
4. 邮件服务需要配置SMTP设置

## 注意事项

1. 邀请链接有效期7天，过期后需要重新发送
2. 候选人信息在创建面试时填写，不需要预先注册
3. 邀请链接是公开的，请妥善保管
4. 建议在生产环境中配置真实的邮件服务
