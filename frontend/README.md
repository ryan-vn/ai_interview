# AI 面试系统 - 前端项目

## 项目概述

基于 Next.js 14 开发的 AI 面试系统前端，提供完整的面试管理、题库浏览和历史记录功能。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: Radix UI + shadcn/ui
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **图标**: Lucide React
- **日期处理**: date-fns

## 已完成的功能模块

### 1. 用户认证模块

#### 登录页面 (`/login`)
- 用户名/邮箱登录
- 密码输入和验证
- 记住登录状态
- 友好的错误提示

#### 注册页面 (`/register`)
- 新用户注册
- 邮箱验证
- 密码强度校验
- 确认密码匹配

### 2. 仪表盘 (`/dashboard`)

**主要功能**：
- 显示用户信息和角色
- 快捷导航卡片
  - 我的面试
  - 题库管理
  - 历史记录
- 最近的面试场次列表
- 一键跳转到各模块

### 3. 我的面试模块 (`/interviews`)

**主要功能**：
- ✅ 面试场次列表展示
- ✅ 多标签筛选（全部/进行中/即将开始/已完成）
- ✅ 状态徽章显示（未开始/进行中/已完成/已取消）
- ✅ 时间信息和倒计时
- ✅ 面试进度展示
- ✅ 开始/继续面试按钮
- ✅ 查看结果功能

**页面特性**：
- 卡片式布局
- 实时状态更新
- 响应式设计
- 友好的空状态提示

#### 面试详情页 (`/interviews/[id]`)

**主要功能**：
- ✅ 面试基本信息展示
- ✅ 题目列表和顺序
- ✅ 题目类型标识（编程题/问答题）
- ✅ 难度等级显示
- ✅ 开始面试按钮
- ✅ 温馨提示和注意事项
- ✅ 跳转到具体题目

### 4. 题库管理模块 (`/questions`)

**主要功能**：
- ✅ 题目列表展示
- ✅ 搜索功能（标题/描述）
- ✅ 类型筛选（全部/编程题/问答题）
- ✅ 难度筛选（全部/简单/中等/困难）
- ✅ 题目统计（总数/各难度数量）
- ✅ 标签展示
- ✅ 卡片式布局

**页面特性**：
- 高级筛选功能
- 实时搜索
- 美观的难度徽章
- 题目类型图标

#### 题目详情页 (`/questions/[id]`)

**主要功能**：
- ✅ 题目完整描述
- ✅ 示例展示（编程题）
- ✅ 代码模板展示
- ✅ 题目信息侧边栏
  - 类型、难度
  - 时间/内存限制
  - 标签
  - 支持的编程语言

**页面特性**：
- 左右分栏布局
- 代码高亮显示
- Markdown 渲染支持

### 5. 历史记录模块 (`/history`)

**主要功能**：
- ✅ 完成的面试列表
- ✅ 统计卡片
  - 完成场次
  - 平均分
  - 通过数
  - 总时长
- ✅ 分数可视化
- ✅ 评价等级显示

**页面特性**：
- 统计数据概览
- 时间线展示
- 分数颜色编码

#### 历史详情页 (`/history/[id]`)

**主要功能**：
- ✅ 面试总分展示
- ✅ 分项得分（技术/问答）
- ✅ 题目详情列表
- ✅ 每题得分和状态
- ✅ AI 评价
  - 总结
  - 优势
  - 待改进
  - 建议
- ✅ 报告下载按钮（功能预留）

**页面特性**：
- 成绩卡片设计
- 详细的评分展示
- AI 反馈模块
- 可下载完整报告

## 项目结构

```
frontend/
├── app/
│   ├── dashboard/          # 仪表盘
│   │   └── page.tsx
│   ├── interviews/         # 面试模块
│   │   ├── page.tsx       # 面试列表
│   │   └── [id]/          # 面试详情
│   │       └── page.tsx
│   ├── questions/          # 题库模块
│   │   ├── page.tsx       # 题目列表
│   │   └── [id]/          # 题目详情
│   │       └── page.tsx
│   ├── history/            # 历史记录
│   │   ├── page.tsx       # 历史列表
│   │   └── [id]/          # 历史详情
│   │       └── page.tsx
│   ├── login/              # 登录
│   │   └── page.tsx
│   ├── register/           # 注册
│   │   └── page.tsx
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   └── globals.css         # 全局样式
├── components/
│   └── ui/                 # UI 组件
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── toast.tsx
├── lib/
│   ├── api.ts              # API 封装
│   └── utils.ts            # 工具函数
└── package.json
```

## API 集成

### 已集成的 API 接口

```typescript
// lib/api.ts

// 认证相关
authApi.register()
authApi.login()
authApi.getProfile()

// 面试相关
interviewsApi.getSessions()
interviewsApi.getSession(id)
interviewsApi.startSession(id)
interviewsApi.completeSession(id)
interviewsApi.getTemplates()
interviewsApi.getTemplate(id)

// 题目相关
questionsApi.getAll(params)
questionsApi.getOne(id)

// 提交相关
submissionsApi.getAll(params)
submissionsApi.getOne(id)
submissionsApi.create(data)

// 报告相关
reportsApi.getBySession(sessionId)
reportsApi.updateScore(submissionId, data)
```

## 启动项目

### 开发环境

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp env.local.example .env.local

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

### 生产构建

```bash
# 构建
pnpm build

# 启动生产服务器
pnpm start
```

## 环境变量

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 页面路由

| 路径 | 功能 | 权限 |
|------|------|------|
| `/` | 首页 | 公开 |
| `/login` | 登录 | 公开 |
| `/register` | 注册 | 公开 |
| `/dashboard` | 仪表盘 | 需要登录 |
| `/interviews` | 面试列表 | 需要登录 |
| `/interviews/[id]` | 面试详情 | 需要登录 |
| `/questions` | 题库列表 | 需要登录 |
| `/questions/[id]` | 题目详情 | 需要登录 |
| `/history` | 历史记录 | 需要登录 |
| `/history/[id]` | 历史详情 | 需要登录 |

## UI 设计特点

### 设计原则
- **简洁明了**: 清晰的信息层级
- **响应式**: 适配各种屏幕尺寸
- **现代化**: 使用渐变和模糊效果
- **友好**: 友好的空状态和错误提示
- **一致性**: 统一的颜色和间距系统

### 颜色系统
- **主色调**: 蓝色/紫色渐变
- **成功**: 绿色 (简单/通过)
- **警告**: 黄色 (中等)
- **错误**: 红色 (困难/失败)
- **信息**: 蓝色 (进行中)

### 组件样式
- 卡片阴影和悬停效果
- 圆角设计
- 徽章和标签
- 加载状态动画
- 空状态插图

## 待实现功能

### 高优先级
- [ ] 答题界面（编程题编辑器）
- [ ] 答题界面（问答题 Markdown 编辑器）
- [ ] 实时代码执行和测试
- [ ] WebSocket 实时通信
- [ ] 答案自动保存

### 中优先级
- [ ] 面试官管理后台
- [ ] 管理员功能（题库/模板管理）
- [ ] 数据统计仪表盘
- [ ] 通知中心

### 低优先级
- [ ] 个人设置页面
- [ ] 暗黑模式切换
- [ ] 多语言支持
- [ ] 移动端 App

## 性能优化

- ✅ 使用 Next.js App Router
- ✅ 代码分割和懒加载
- ✅ 图片优化
- ✅ API 请求缓存
- ✅ 骨架屏加载状态

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 相关文档

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [后端 API 文档](http://localhost:3001/api/docs)

## 问题反馈

如有问题或建议，请联系开发团队。

---

**开发状态**: 🟢 基础功能已完成

**最后更新**: 2025-10-21

