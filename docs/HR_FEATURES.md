# HR 功能使用指南

## 🎯 功能概述

HR功能模块提供了完整的面试管理解决方案，包括面试场次创建、邀请链接生成、候选人管理等功能。

## 🚀 主要功能

### 1. 面试场次管理

#### 创建面试场次
- **路径**: `/admin/interviews/create`
- **功能**: HR可以创建新的面试场次
- **必需信息**:
  - 面试名称
  - 面试模板
  - 面试时间
  - 候选人信息（姓名、邮箱、手机号、职位）

#### 面试场次列表
- **路径**: `/admin/interviews`
- **功能**: 查看和管理所有面试场次
- **特性**:
  - 搜索和筛选功能
  - 状态统计
  - 邀请链接管理
  - 重新发送邀请

### 2. 邀请链接系统

#### 自动生成邀请链接
- 每个面试场次自动生成唯一的邀请令牌
- 邀请链接格式: `https://yourdomain.com/invite/{token}`
- 默认有效期: 7天

#### 邀请链接管理
- 一键复制邀请链接
- 预览邀请页面
- 重新发送邀请邮件
- 链接过期自动续期

### 3. 邮件通知系统

#### 自动邮件发送
- 创建面试时自动发送邀请邮件
- 邮件包含完整的面试信息
- 美观的HTML邮件模板
- 支持中文内容

#### 邮件内容包含
- 面试基本信息
- 候选人信息确认
- 面试说明和注意事项
- 邀请链接和有效期

### 4. HR 仪表板

#### 统计概览
- **路径**: `/admin`
- **功能**: 提供面试数据统计
- **统计指标**:
  - 总面试数
  - 已安排面试数
  - 进行中面试数
  - 已完成面试数
  - 已取消面试数

#### 快捷操作
- 创建面试
- 管理面试
- 题库管理
- 模板管理

## 📋 使用流程

### HR 创建面试流程

1. **登录系统**
   - 使用HR账号登录
   - 进入管理面板

2. **创建面试场次**
   - 点击"创建面试"
   - 填写面试基本信息
   - 填写候选人信息
   - 选择面试模板和面试官
   - 设置面试时间

3. **系统自动处理**
   - 生成唯一邀请令牌
   - 创建邀请链接
   - 发送邮件通知候选人

4. **管理面试场次**
   - 查看面试列表
   - 复制邀请链接
   - 重新发送邀请
   - 监控面试状态

### 候选人参与流程

1. **接收邮件**
   - 候选人收到面试邀请邮件
   - 邮件包含面试详情和邀请链接

2. **访问邀请页面**
   - 点击邮件中的邀请链接
   - 查看面试详细信息
   - 确认候选人信息

3. **加入面试**
   - 登录或注册系统
   - 点击"加入面试"
   - 开始面试

## 🔧 技术实现

### 后端 API

#### 面试场次管理
```typescript
// 创建面试场次
POST /api/interviews/sessions
{
  "name": "前端工程师面试",
  "templateId": 1,
  "interviewerId": 2,
  "scheduledAt": "2024-01-01T10:00:00Z",
  "candidateInfo": {
    "name": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138000",
    "position": "前端开发工程师"
  },
  "settings": {
    "duration": 120,
    "allowReschedule": true,
    "reminderEnabled": true
  }
}

// 获取面试场次列表
GET /api/interviews/sessions

// 通过邀请链接获取面试信息
GET /api/interviews/invite/{token}

// 候选人加入面试
POST /api/interviews/invite/{token}/join

// 重新发送邀请邮件
POST /api/interviews/sessions/{id}/resend-invite
```

### 前端页面

#### 管理页面
- `/admin` - HR仪表板
- `/admin/interviews` - 面试场次管理
- `/admin/interviews/create` - 创建面试

#### 候选人页面
- `/invite/[token]` - 邀请页面

### 数据库设计

#### 面试场次表 (interview_sessions)
```sql
CREATE TABLE interview_sessions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  template_id INTEGER NOT NULL,
  candidate_id INTEGER,
  candidate_name VARCHAR(100) NOT NULL,
  candidate_email VARCHAR(100) NOT NULL,
  candidate_phone VARCHAR(20),
  position VARCHAR(100),
  invite_token VARCHAR(255) UNIQUE NOT NULL,
  invite_expires_at TIMESTAMP NOT NULL,
  interviewer_id INTEGER,
  status VARCHAR(20) DEFAULT 'scheduled',
  scheduled_at TIMESTAMP NOT NULL,
  actual_start_at TIMESTAMP,
  actual_end_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 界面特性

### 响应式设计
- 支持桌面和移动设备
- 现代化的UI设计
- 直观的操作界面

### 用户体验
- 实时状态更新
- 一键复制功能
- 搜索和筛选
- 状态统计图表

### 安全性
- 邀请令牌唯一性
- 链接过期机制
- 用户身份验证
- 权限控制

## 📊 监控和统计

### 实时统计
- 面试状态分布
- 完成率统计
- 最近面试记录
- 趋势分析

### 数据导出
- 面试记录导出
- 统计数据报表
- 候选人信息导出

## 🔮 未来扩展

### 计划功能
- 批量创建面试
- 面试时间冲突检测
- 候选人信息验证
- 面试结果通知
- 高级邮件模板
- 面试提醒系统

### 集成功能
- 日历系统集成
- 视频会议集成
- 第三方邮件服务
- 移动端应用

## 🛠️ 配置说明

### 环境变量
```bash
# 前端URL（用于生成邀请链接）
FRONTEND_URL=http://localhost:3000

# 邮件服务配置
EMAIL_SERVICE_URL=your-email-service-url
EMAIL_API_KEY=your-email-api-key
```

### 邮件服务集成
目前使用模拟邮件服务，生产环境需要集成真实的邮件服务：
- SendGrid
- AWS SES
- Nodemailer
- 其他SMTP服务

## 📞 技术支持

如有问题或建议，请联系开发团队或查看项目文档。

---

*最后更新: 2024年1月*
