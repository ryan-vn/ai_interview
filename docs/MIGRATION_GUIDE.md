# 文档迁移指南

## 文档重组说明

为了保持项目目录架构的统一性和可维护性，我们将所有文档整理到了 `docs/` 目录下，并按照文档类型进行了分类。

## 文件迁移映射

### 从根目录迁移的文档

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `required.md` | `docs/requirements/required.md` | 基础需求文档 |
| `requirements_detailed.md` | `docs/requirements/requirements_detailed.md` | 详细需求文档 |
| `DEVELOPMENT.md` | `docs/development/DEVELOPMENT.md` | 开发指南 |
| `DEPLOYMENT.md` | `docs/deployment/DEPLOYMENT.md` | 部署文档 |
| `ui-design-system.md` | `docs/design/ui-design-system.md` | UI设计系统 |
| `PROJECT_SUMMARY.md` | `docs/PROJECT_SUMMARY.md` | 项目总结 |

### 从 backend/ 目录迁移的文档

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `backend/TEST_CASES.md` | `docs/testing/TEST_CASES.md` | 测试用例 |
| `backend/TEST_README.md` | `docs/testing/TEST_README.md` | 测试说明 |
| `backend/TEST_SUMMARY.md` | `docs/testing/TEST_SUMMARY.md` | 测试总结 |
| `backend/TESTING_GUIDE.md` | `docs/testing/TESTING_GUIDE.md` | 测试指南 |
| `backend/SWAGGER_GUIDE.md` | `docs/api/SWAGGER_GUIDE.md` | Swagger API 使用指南 |

### 从 frontend/ 目录复制的文档

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `frontend/README.md` | `docs/development/FRONTEND.md` | 前端项目说明（原文件保留） |

### 第二批整理：2024-10-21

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `INTERVIEW_WORKFLOW.md` | `docs/guides/INTERVIEW_WORKFLOW.md` | 面试流程说明 |
| `QUICK_START.md` | `docs/QUICK_START.md` | 快速启动指南 |
| `HR_ADMIN_GUIDE.md` | `docs/guides/HR_ADMIN_GUIDE.md` | HR 管理员指南 |
| `HR_FEATURES.md` | `docs/requirements/HR_FEATURES.md` | HR 功能需求 |
| `INVITE_LINK_FEATURES.md` | `docs/requirements/INVITE_LINK_FEATURES.md` | 邀请链接功能需求 |

### 保持不变的文档

| 文件 | 说明 |
|------|------|
| `README.md` (根目录) | 项目主README，已更新包含新文档结构的说明 |

## 新增文档

| 文件路径 | 说明 |
|---------|------|
| `docs/README.md` | 文档索引和导航（已更新） |
| `docs/MIGRATION_GUIDE.md` | 本文档迁移指南（已更新） |
| `docs/QUICK_START.md` | 快速启动指南 |
| `docs/api/` | API 文档目录（新建） |
| `docs/guides/` | 使用指南目录（新建） |

## 目录结构

```
docs/
├── README.md                               # 📋 文档索引（已更新）
├── PROJECT_SUMMARY.md                      # 📊 项目总结
├── MIGRATION_GUIDE.md                      # 🔄 迁移指南（已更新）
├── QUICK_START.md                          # 🚀 快速启动指南
│
├── requirements/                           # 📝 需求文档
│   ├── README.md                          # 需求文档索引
│   ├── required.md                        # 基础需求
│   ├── requirements_detailed.md           # 详细需求
│   ├── interview_workflow_requirements.md # 面试流程需求
│   ├── HR_FEATURES.md                     # HR 功能需求
│   └── INVITE_LINK_FEATURES.md            # 邀请链接功能
│
├── development/                            # 💻 开发文档
│   ├── DEVELOPMENT.md                     # 开发指南
│   └── FRONTEND.md                        # 前端项目说明
│
├── deployment/                             # 🚀 部署文档
│   ├── DEPLOYMENT.md                      # 部署指南
│   ├── DATABASE_CHARSET_FIX.md            # 数据库字符集修复
│   └── CHARSET_FIX_SUMMARY.md             # 字符集修复总结
│
├── design/                                 # 🎨 设计文档
│   └── ui-design-system.md                # UI 设计系统
│
├── testing/                                # 🧪 测试文档
│   ├── TESTING_GUIDE.md                   # 测试指南
│   ├── TEST_README.md                     # 测试说明
│   ├── TEST_CASES.md                      # 测试用例
│   └── TEST_SUMMARY.md                    # 测试总结
│
├── guides/                                 # 📖 使用指南（新建）
│   ├── INTERVIEW_WORKFLOW.md              # 面试流程说明
│   └── HR_ADMIN_GUIDE.md                  # HR 管理员指南
│
└── api/                                    # 🔌 API 文档（新建）
    └── SWAGGER_GUIDE.md                   # Swagger 使用指南
```

## 更新说明

### 需要更新文档引用的地方

如果你的代码或文档中有引用旧文档路径的地方，请按照上述映射表进行更新。

### Git 历史

由于使用了 `mv` 命令移动文件，Git 应该能够自动跟踪文件的移动历史。如果需要查看文件的完整历史，可以使用：

```bash
git log --follow docs/requirements/required.md
```

## 优势

1. **统一性** - 所有文档集中在一个目录下，便于管理和查找
2. **分类清晰** - 按照文档类型分类，结构更加清晰
3. **易于维护** - 新文档可以轻松地归类到对应目录
4. **标准化** - 符合业界常见的项目文档组织方式

## 后续维护建议

1. 新增文档时，请参考 `docs/README.md` 选择合适的分类目录
2. 定期检查文档的更新状态，确保内容与代码同步
3. 重要更新应在对应文档的顶部添加更新日志
4. 保持文档命名的一致性（使用大写字母和下划线）

## 联系方式

如有任何关于文档迁移的问题，请联系项目维护团队。

