# 项目文档索引

> 📚 本目录包含项目的所有文档，按类别组织

## 📖 文档目录结构

```
docs/
├── README.md                    # 本索引文件
├── PRD.md                       # 产品需求文档
├── TAD.md                       # 技术架构文档
├── FSD.md                       # 功能规格文档
├── tasks.md                     # 任务清单
├── api/                         # API 文档
├── deployment/                  # 部署文档
├── design/                      # 设计文档
├── development/                 # 开发文档
├── features/                    # 功能文档
└── testing/                     # 测试文档
```

## 🚀 快速开始

### 新手入门
1. **[本地开发快速指南](development/DEV_QUICK_START.md)** ⭐ - 5分钟快速上手
2. **[本地开发完整指南](development/LOCAL_DEV_GUIDE.md)** - 详细的环境配置说明
3. **[开发模式对比](development/DEV_MODES.md)** - 选择适合的开发模式

## 📑 核心文档

### 需求与设计
- **[产品需求文档 (PRD)](PRD.md)** - 产品功能和业务需求
- **[技术架构文档 (TAD)](TAD.md)** - 技术栈和系统架构
- **[功能规格文档 (FSD)](FSD.md)** - 详细的功能规格说明

### 项目管理
- **[任务清单](tasks.md)** - 开发任务和进度跟踪

## 📂 文档分类

### 🛠️ 开发文档 (`development/`)

#### 快速开始
- **[DEV_QUICK_START.md](development/DEV_QUICK_START.md)** - 本地开发快速指南 ⭐
- **[LOCAL_DEV_SETUP.md](development/LOCAL_DEV_SETUP.md)** - 本地开发环境配置完成说明
- **[LOCAL_DEV_GUIDE.md](development/LOCAL_DEV_GUIDE.md)** - 完整的本地开发指南
- **[DEV_MODES.md](development/DEV_MODES.md)** - 开发模式对比和选择

#### 开发指南
- **[DEVELOPMENT.md](development/DEVELOPMENT.md)** - 开发环境配置和开发流程
- **[FRONTEND.md](development/FRONTEND.md)** - 前端开发指南

### 🚀 部署文档 (`deployment/`)
- **[DEPLOYMENT.md](deployment/DEPLOYMENT.md)** - 生产环境部署指南
- **[DATABASE_CHARSET_FIX.md](deployment/DATABASE_CHARSET_FIX.md)** - 数据库字符集修复指南
- **[CHARSET_FIX_SUMMARY.md](deployment/CHARSET_FIX_SUMMARY.md)** - 字符集修复总结

### 🎨 设计文档 (`design/`)
- **[ui-design-system.md](design/ui-design-system.md)** - UI 设计系统和规范

### 🎯 功能文档 (`features/`)
- **[JOBS_FEATURE.md](features/JOBS_FEATURE.md)** - 岗位管理功能说明
- **[JOBS_QUICK_START.md](features/JOBS_QUICK_START.md)** - 岗位管理快速开始 ⭐
- **[JOBS_IMPLEMENTATION_SUMMARY.md](features/JOBS_IMPLEMENTATION_SUMMARY.md)** - 岗位功能实现总结

### 📡 API 文档 (`api/`)
- **[JOBS_API.md](api/JOBS_API.md)** - 岗位管理 API 文档
- **[SWAGGER_GUIDE.md](api/SWAGGER_GUIDE.md)** - Swagger API 文档使用指南

### 🧪 测试文档 (`testing/`)
- **[JOBS_TESTING_GUIDE.md](testing/JOBS_TESTING_GUIDE.md)** - 岗位管理测试指南

## 🔍 按角色查找文档

### 👨‍💻 开发者
**首次配置环境：**
1. [本地开发快速指南](development/DEV_QUICK_START.md)
2. [本地开发完整指南](development/LOCAL_DEV_GUIDE.md)
3. [开发模式对比](development/DEV_MODES.md)

**日常开发：**
- [前端开发指南](development/FRONTEND.md)
- [开发文档](development/DEVELOPMENT.md)
- [任务清单](tasks.md)

**功能开发：**
- [功能文档目录](features/)
- [API 文档目录](api/)

### 👨‍🔧 运维人员
- [部署指南](deployment/DEPLOYMENT.md)
- [数据库字符集修复](deployment/DATABASE_CHARSET_FIX.md)

### 🎨 设计师
- [UI 设计系统](design/ui-design-system.md)

### 🧪 测试人员
- [测试文档目录](testing/)
- [岗位管理测试指南](testing/JOBS_TESTING_GUIDE.md)

### 📋 产品经理
- [产品需求文档 (PRD)](PRD.md)
- [功能规格文档 (FSD)](FSD.md)
- [任务清单](tasks.md)

### 🏗️ 架构师
- [技术架构文档 (TAD)](TAD.md)
- [功能规格文档 (FSD)](FSD.md)

## 📝 文档编写规范

### 文档命名
- 使用大写字母和下划线（如：`DEV_QUICK_START.md`）
- 或使用全小写和连字符（如：`ui-design-system.md`）
- 保持一致性

### 文档结构
1. 标题（H1）
2. 简介/概述
3. 目录（可选）
4. 主要内容（分章节）
5. 相关链接
6. 更新日期/版本信息

### 链接规范
- 使用相对路径
- 同目录：`./FILE.md`
- 上级目录：`../DIR/FILE.md`
- 根目录项目文件：`../../FILE`

## 🔄 文档更新日志

### 2025-10-24
- ✅ 整理所有 md 文档到 `docs/` 目录
- ✅ 将开发相关文档移至 `docs/development/`
- ✅ 将功能相关文档移至 `docs/features/`
- ✅ 更新所有文档的交叉引用链接
- ✅ 创建文档索引文件

## 📚 扩展阅读

### 主项目文档
- **[项目 README](../README.md)** - 项目概述和快速开始

### 模块文档
- **[后端 README](../backend/README.md)** - 后端项目说明
- **[前端 README](../frontend/README.md)** - 前端项目说明

## 💡 提示

- ⭐ 标记的文档是推荐优先阅读的
- 遇到问题可以先查看对应分类下的文档
- 建议按照角色查找适合自己的文档路径

---

**文档维护者**: 开发团队  
**最后更新**: 2025-10-24  
**文档版本**: 1.0

