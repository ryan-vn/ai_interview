# 岗位信息维护功能

## 功能概述

实现了完整的岗位信息管理功能，支持HR和管理员对招聘岗位进行全生命周期管理。

## 功能特性

### 1. 岗位创建
- ✅ 完整的岗位信息录入（名称、部门、职责、要求等）
- ✅ 技能关键词设置（用于简历智能匹配）
- ✅ 可选字段支持（学历、经验、薪资、地点等）
- ✅ 岗位名称唯一性校验（同部门内不重复）
- ✅ 状态设置（开放/关闭）

### 2. 岗位查询
- ✅ 列表展示（卡片式布局）
- ✅ 多维度筛选
  - 岗位状态（招聘中/已关闭）
  - 所属部门
  - 关键词搜索（名称、职责、要求）
- ✅ 组合查询
- ✅ 分页支持（每页10条）
- ✅ 统计信息（总数显示）

### 3. 岗位编辑
- ✅ 完整信息编辑
- ✅ 状态快速切换（开放⇄关闭）
- ✅ 表单验证
- ✅ 修改时的重名检查
- ✅ 编辑历史追踪（创建时间、更新时间）

### 4. 岗位删除
- ✅ 单个删除
- ✅ 批量删除
- ✅ 软删除实现（数据可恢复）
- ✅ 删除前确认
- ✅ 关联关系处理

### 5. 权限控制
- ✅ 仅HR和管理员可操作
- ✅ JWT令牌验证
- ✅ 角色守卫（RolesGuard）
- ✅ 操作日志（记录创建者）

## 数据模型

```typescript
{
  id: number;                        // 岗位ID
  title: string;                     // 岗位名称 *
  department: string;                // 所属部门 *
  responsibilities: string;          // 岗位职责 *
  requirements: string;              // 技能要求 *
  skillKeywords: string[];           // 技能关键词
  hiringCount: number;               // 招聘人数
  educationRequirement: string;      // 学历要求
  experienceRequirement: string;     // 工作年限要求
  salaryRange: string;               // 薪资范围
  location: string;                  // 工作地点
  status: 'open' | 'closed';        // 岗位状态
  createdBy: number;                 // 创建者ID
  isDeleted: boolean;                // 软删除标志
  createdAt: Date;                   // 创建时间
  updatedAt: Date;                   // 更新时间
}
```

## 技术实现

### 后端技术栈
- **框架**: NestJS
- **数据库**: MySQL (utf8mb4)
- **ORM**: TypeORM
- **验证**: class-validator
- **文档**: Swagger/OpenAPI
- **权限**: JWT + Guards

### 前端技术栈
- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **组件**: shadcn/ui
- **HTTP**: Axios
- **状态管理**: React Hooks

### 目录结构

#### 后端
```
backend/src/jobs/
├── dto/
│   ├── create-job.dto.ts       # 创建岗位DTO
│   └── update-job.dto.ts       # 更新岗位DTO
├── entities/
│   └── job.entity.ts           # 岗位实体
├── jobs.controller.ts          # 控制器
├── jobs.service.ts             # 业务逻辑
└── jobs.module.ts              # 模块定义
```

#### 前端
```
frontend/app/admin/jobs/
├── page.tsx                    # 岗位列表页
└── [id]/
    └── page.tsx                # 岗位编辑页
```

## API 端点

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/jobs` | 创建岗位 | HR, Admin |
| GET | `/api/jobs` | 获取岗位列表 | All |
| GET | `/api/jobs/:id` | 获取岗位详情 | All |
| PATCH | `/api/jobs/:id` | 更新岗位 | HR, Admin |
| DELETE | `/api/jobs/:id` | 删除岗位 | HR, Admin |
| POST | `/api/jobs/batch-delete` | 批量删除 | HR, Admin |
| GET | `/api/jobs/departments` | 获取部门列表 | All |

详细API文档: [JOBS_API.md](../api/JOBS_API.md)

## 业务规则

### 1. 岗位名称唯一性
- 同一部门内，岗位名称不能重复
- 不同部门可以有相同的岗位名称
- 创建和修改时都会进行检查

### 2. 必填字段
- 岗位名称（最大100字符）
- 所属部门（最大100字符）
- 岗位职责（文本）
- 任职要求（文本）

### 3. 状态管理
- **开放状态 (open)**:
  - 允许导入简历
  - 参与匹配计算
  - 显示在招聘列表中
  
- **关闭状态 (closed)**:
  - 不接受新简历
  - 不参与匹配
  - 仍可查看和编辑

### 4. 技能关键词
- JSON数组格式存储
- 用于计算简历匹配度
- 建议填写准确的技能标签
- 支持中英文

### 5. 软删除
- 删除操作不会真正删除数据
- 设置 `isDeleted = true`
- 查询时自动过滤已删除数据
- 可以通过数据库恢复

## UI/UX 设计

### 列表页面特性
1. **搜索和筛选区**
   - 关键词搜索框
   - 状态下拉选择
   - 部门下拉选择
   - 搜索/重置按钮
   - 统计信息显示

2. **岗位卡片**
   - 卡片式布局，清晰易读
   - 状态徽章（招聘中/已关闭）
   - 关键信息展示（部门、地点、人数）
   - 技能关键词标签
   - 详情折叠展示
   - 创建时间
   - 操作按钮（编辑、状态切换、删除）

3. **分页控制**
   - 上一页/下一页按钮
   - 当前页码显示
   - 总页数显示
   - 边界禁用

### 编辑页面特性
1. **表单布局**
   - 两列布局（桌面端）
   - 分组清晰
   - 字段提示
   - 字符限制提示

2. **状态管理**
   - 单选按钮切换
   - 实时预览
   - 顶部状态徽章

3. **操作按钮**
   - 保存修改
   - 取消/返回
   - 加载状态提示

## 数据库设计

### 表结构
```sql
CREATE TABLE `jobs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `responsibilities` TEXT NOT NULL,
  `requirements` TEXT NOT NULL,
  `skill_keywords` JSON NULL,
  `hiring_count` INT NULL,
  `education_requirement` VARCHAR(50) NULL,
  `experience_requirement` VARCHAR(50) NULL,
  `salary_range` VARCHAR(50) NULL,
  `location` VARCHAR(100) NULL,
  `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  `created_by` INT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_department` (`department`),
  INDEX `idx_status` (`status`),
  INDEX `idx_is_deleted` (`is_deleted`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 索引优化
- `idx_department`: 部门筛选查询
- `idx_status`: 状态筛选查询
- `idx_is_deleted`: 软删除过滤
- 外键约束确保数据完整性

## 使用场景

### 场景1: HR发布新岗位
1. HR登录系统
2. 进入"岗位管理"
3. 点击"新建岗位"
4. 填写岗位信息
5. 设置技能关键词（用于后续匹配）
6. 保存并发布

### 场景2: 暂停招聘
1. HR找到需要暂停的岗位
2. 点击"关闭"按钮
3. 岗位状态变为"已关闭"
4. 不再参与简历匹配

### 场景3: 搜索特定岗位
1. 在搜索框输入关键词（如"React"）
2. 选择部门筛选
3. 选择状态筛选
4. 点击搜索查看结果

### 场景4: 编辑岗位信息
1. 点击岗位的"编辑"按钮
2. 修改相关信息
3. 保存修改
4. 返回列表查看更新

## 测试指南

详细测试用例请参考: [JOBS_TESTING_GUIDE.md](../testing/JOBS_TESTING_GUIDE.md)

### 快速测试步骤
```bash
# 1. 启动服务
./start.sh

# 2. 访问管理后台
open http://localhost:3000/admin

# 3. 进入岗位管理
点击"岗位管理"卡片

# 4. 测试创建
点击"新建岗位"，填写信息并提交

# 5. 测试搜索
使用搜索框和筛选器查询岗位

# 6. 测试编辑
点击"编辑"，修改信息并保存

# 7. 测试状态切换
点击"关闭"或"开放"按钮

# 8. 测试删除
点击"删除"并确认
```

## 性能优化

### 已实现
- ✅ 数据库索引优化
- ✅ 分页查询减少数据量
- ✅ 前端懒加载
- ✅ 查询结果缓存（前端状态）

### 待优化
- [ ] Redis缓存热门岗位
- [ ] 全文索引搜索
- [ ] 图片CDN加速（如有岗位图片）

## 安全考虑

1. **权限控制**: 所有写操作需要HR或管理员权限
2. **输入验证**: 前后端双重验证
3. **SQL注入防护**: TypeORM参数化查询
4. **XSS防护**: 内容转义
5. **CSRF防护**: JWT令牌验证

## 扩展性

### 已预留
- 岗位与简历关联（job_id外键）
- 岗位与面试关联（job_id外键）
- 岗位与匹配结果关联（match_results表）

### 可扩展方向
1. **岗位模板**: 快速创建常见岗位
2. **岗位审批流程**: 多级审批
3. **岗位发布到外部平台**: Boss直聘、拉勾等
4. **岗位推荐算法**: AI推荐候选人
5. **岗位统计分析**: 招聘漏斗、转化率
6. **岗位浏览量**: 追踪热度
7. **岗位收藏**: 候选人收藏功能

## 常见问题

### Q1: 如何恢复已删除的岗位？
A: 通过数据库直接修改 `is_deleted` 字段为 `false`

### Q2: 可以批量导入岗位吗？
A: 目前不支持，可通过API循环调用实现

### Q3: 岗位数量有限制吗？
A: 无硬性限制，但建议定期归档旧岗位

### Q4: 如何导出岗位数据？
A: 可通过API获取数据后自行导出，或直接查询数据库

### Q5: 技能关键词有什么用？
A: 用于计算简历与岗位的匹配度，提高招聘效率

## 相关文档

- [API文档](../api/JOBS_API.md)
- [测试指南](../testing/JOBS_TESTING_GUIDE.md)
- [数据库迁移](../../backend/migrations/001_add_jobs_resumes_matching.sql)
- [PRD产品需求](../PRD.md)

## 更新日志

### v1.0.0 (2025-10-24)
- ✅ 实现岗位CRUD功能
- ✅ 实现搜索和筛选
- ✅ 实现权限控制
- ✅ 实现前端UI
- ✅ 完成API文档
- ✅ 完成测试指南

---

**开发团队**: Interview System Dev Team  
**最后更新**: 2025-10-24

