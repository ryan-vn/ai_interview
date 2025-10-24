
# 💡 面试管理系统技术架构设计文档（TAD）

## 一、项目概述

### 1.1 背景

本系统为企业内部人力资源部门定制的 **面试管理系统**，覆盖从岗位发布、简历导入、面试题库维护到面试流程执行的完整闭环，支持岗位匹配度与智能推荐功能。
系统目标是帮助企业 HR 提高招聘流程透明度、面试协作效率及候选人数据管理质量。

### 1.2 系统目标

* 实现岗位与简历的统一管理；
* 支持多格式简历解析与自动结构化；
* 构建企业私有面试题库；
* 提供高效的面试任务分配与追踪；
* 基于算法提供岗位匹配度评分与智能推荐。

### 1.3 技术栈总览

| 层级    | 技术                            | 说明               |
| ----- | ----------------------------- | ---------------- |
| 前端    | Next.js 14 + TypeScript       | 支持SSR/SSG混合渲染    |
| 状态管理  | Zustand                       | 管理全局状态与异步数据      |
| UI 框架 | TailwindCSS + shadcn/ui       | 提供统一UI风格与组件规范    |
| 后端    | Node.js (NestJS) + TypeScript | 模块化架构，依赖注入与守卫    |
| 数据库   | MySQL                         | 主存储，采用TypeORM建模  |
| 缓存    | Redis                         | 存储Session、面试任务缓存 |
| 通信协议  | RESTful + WebSocket           | 同时支持接口与实时消息      |
| 部署环境  | Docker + Nginx                | 容器化持续部署方案        |

---

## 二、系统总体架构

### 2.1 架构层次图

```
┌──────────────────────────────┐
│          前端 Web 应用层          │
│ Next.js + Zustand + shadcn/ui │
│        │         ↑             │
│   REST API     WebSocket       │
└────────┬──────────────────────┘
         │
┌────────┴──────────────────────┐
│           后端服务层            │
│     Node.js (NestJS) 应用      │
│ ├─ Auth 模块（JWT认证）        │
│ ├─ Job 模块（岗位管理）        │
│ ├─ Resume 模块（简历管理）     │
│ ├─ Question 模块（题库管理）   │
│ ├─ Interview 模块（面试管理）  │
│ └─ Match 模块（匹配度推荐）    │
└────────┬──────────────────────┘
         │
┌────────┴────────────┐
│     数据与缓存层      │
│ MySQL  ←→  Redis      │
│ 存储结构化数据 缓存高频查询 │
└──────────────────────┘
```

---

## 三、模块架构说明

### 3.1 前端架构

#### 技术说明

* **框架**：Next.js 14 (App Router)
* **语言**：TypeScript
* **状态管理**：Zustand
* **样式**：TailwindCSS
* **UI组件**：shadcn/ui（基于 Radix Primitives）
* **请求层**：统一封装 `lib/api.ts`，集中管理接口
* **存储层**：Zustand 持久化插件（localStorage）

#### 目录结构

```
/src
 ├── app/                 # 页面路由与服务端组件
 ├── components/          # 通用 UI 组件
 ├── features/            # 模块化功能区（job、resume等）
 ├── store/               # Zustand 状态管理
 ├── lib/                 # 工具函数与 API 封装
 ├── hooks/               # 通用 Hook（权限、请求、主题）
 └── types/               # TS 类型与接口定义
```

#### 核心模块交互

* **岗位模块（job）**：岗位增删改查、状态切换；
* **简历模块（resume）**：上传、解析、预览、导入；
* **题库模块（question）**：分类、导入、标签管理；
* **面试模块（interview）**：面试创建、分配、状态流转；
* **智能推荐（match）**：展示岗位匹配度、推荐岗位。

---

### 3.2 后端架构

#### 框架与核心中间件

* **框架**：NestJS + Express
* **ORM**：TypeORM
* **认证**：Passport + JWT
* **缓存**：Redis
* **文档**：Swagger 自动生成
* **日志**：winston + nestjs-pino
* **任务队列（可选）**：Bull + Redis

#### 模块划分

| 模块          | 描述   | 主要职责             |
| ----------- | ---- | ---------------- |
| `auth`      | 用户认证 | 登录/注册、JWT签发、权限验证 |
| `job`       | 岗位管理 | 岗位创建、编辑、关闭、绑定简历  |
| `resume`    | 简历管理 | 文件上传、内容解析、结构化入库  |
| `question`  | 题库管理 | 题库导入、分类、增删改查     |
| `interview` | 面试管理 | 面试任务创建、分配、状态流转   |
| `match`     | 智能推荐 | 匹配度计算、岗位推荐服务     |

#### 服务依赖关系

```
auth → 所有模块（用于权限校验）
job  ↔ resume ↔ interview
resume ↔ match
question → interview（题目引用）
```

---

## 四、数据库设计（MySQL）

### 4.1 数据表概览

| 表名              | 功能      |
| --------------- | ------- |
| `jobs`          | 岗位信息    |
| `resumes`       | 候选人简历   |
| `questions`     | 面试题库    |
| `interviews`    | 面试任务    |
| `match_results` | 匹配度计算结果 |
| `users`         | 系统用户    |
| `logs`          | 操作日志    |

### 4.2 示例：interviews 表结构

| 字段                      | 类型        | 描述              |
| ----------------------- | --------- | --------------- |
| id                      | bigint    | 主键              |
| job_id                  | bigint    | 岗位ID            |
| resume_id               | bigint    | 候选人简历ID         |
| interviewer_id          | bigint    | 面试官             |
| schedule_time           | datetime  | 面试时间            |
| status                  | enum      | 待面试 / 进行中 / 已完成 |
| result                  | json      | 评分、评语等结果        |
| created_at / updated_at | timestamp | 审计字段            |

---

## 五、缓存与性能优化（Redis）

| 用途           | Key 示例                             | 说明              |
| ------------ | ---------------------------------- | --------------- |
| 用户登录 Session | `interview:session:{user_id}`      | JWT 缓存与Token黑名单 |
| 简历解析结果缓存     | `resume:cache:{resume_id}`         | 降低重复解析          |
| 岗位匹配度缓存      | `match:score:{job_id}:{resume_id}` | 加速推荐响应          |
| 面试任务列表缓存     | `interview:list:{hr_id}`           | 提升加载速度          |

---

## 六、安全与权限控制

* **基于角色的访问控制（RBAC）**

  * 角色：`admin`、`hr`、`interviewer`、`viewer`
  * 权限分配存储于数据库 `user_roles` 表
* **接口保护**

  * JWT 鉴权守卫拦截器
  * 统一异常过滤器（ExceptionFilter）
* **文件安全**

  * 简历上传大小 ≤10MB
  * PDF/DOC/XLSX 扫描恶意内容
* **数据安全**

  * AES-256 对敏感字段加密（手机号、邮箱）
  * 日志留存与追溯（Winston + MySQL Audit Log）

---

## 七、系统部署架构

### 7.1 运行环境

| 环境   | 说明                | 部署方式                 |
| ---- | ----------------- | -------------------- |
| 开发环境 | 本地 Docker Compose | Node + Redis + MySQL |
| 测试环境 | 内部测试服务器           | CI/CD 自动部署           |
| 生产环境 | Kubernetes 集群     | Nginx + Node.js 容器   |

### 7.2 部署拓扑

```
用户浏览器
   ↓
Nginx (反向代理)
   ↓
Node.js (NestJS)
   ↙          ↘
 MySQL       Redis
```

---
