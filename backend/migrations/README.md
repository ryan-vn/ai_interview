# 数据库迁移说明

## 迁移脚本列表

### 001_add_jobs_resumes_matching.sql
**描述**: 添加岗位管理、简历管理、题库增强、匹配度功能

**包含的更改**:
1. 创建岗位表 (jobs)
2. 创建简历表 (resumes)
3. 创建题目标签表 (question_tags)
4. 创建匹配结果表 (match_results)
5. 修改题目表 (questions) - 添加新字段和类型
6. 修改面试场次表 (interview_sessions) - 添加关联字段

## 执行迁移

### 方式1: 使用MySQL命令行

```bash
# 进入backend目录
cd backend

# 执行迁移脚本
mysql -u interview_user -p interview_system < migrations/001_add_jobs_resumes_matching.sql
```

### 方式2: 使用Docker Compose

如果你的数据库运行在Docker中：

```bash
# 复制SQL文件到容器
docker cp backend/migrations/001_add_jobs_resumes_matching.sql interview-mysql:/tmp/

# 在容器中执行
docker exec -it interview-mysql mysql -u interview_user -p interview_system < /tmp/001_add_jobs_resumes_matching.sql
```

### 方式3: 使用TypeORM自动同步 (开发环境)

在开发环境中，可以暂时启用TypeORM的自动同步功能：

1. 在 `app.module.ts` 中设置 `synchronize: true`
2. 启动应用，TypeORM会自动创建表和字段
3. **重要**: 生产环境请务必设置 `synchronize: false`

## 回滚迁移

如果需要回滚更改，执行以下SQL：

```sql
-- 删除外键约束
ALTER TABLE `interview_sessions` DROP FOREIGN KEY IF EXISTS `fk_interview_sessions_job_id`;
ALTER TABLE `interview_sessions` DROP FOREIGN KEY IF EXISTS `fk_interview_sessions_resume_id`;

-- 删除新增的字段
ALTER TABLE `interview_sessions` DROP COLUMN IF EXISTS `resume_id`;
ALTER TABLE `interview_sessions` DROP COLUMN IF EXISTS `job_id`;
ALTER TABLE `questions` DROP COLUMN IF EXISTS `is_deleted`;
ALTER TABLE `questions` DROP COLUMN IF EXISTS `answer_points`;
ALTER TABLE `questions` DROP COLUMN IF EXISTS `standard_answer`;
ALTER TABLE `questions` DROP COLUMN IF EXISTS `tag_ids`;

-- 删除新表
DROP TABLE IF EXISTS `match_results`;
DROP TABLE IF EXISTS `question_tags`;
DROP TABLE IF EXISTS `resumes`;
DROP TABLE IF EXISTS `jobs`;
```

## 注意事项

1. **备份数据**: 在执行迁移前，请务必备份数据库
2. **测试环境**: 建议先在测试环境执行迁移
3. **权限**: 确保数据库用户有足够的权限执行DDL操作
4. **字符集**: 确保数据库和表使用 `utf8mb4` 字符集
5. **uploads目录**: 需要手动创建 `uploads/resumes/` 目录用于存储简历文件

## 验证迁移

执行迁移后，可以运行以下SQL验证：

```sql
-- 检查新表是否创建成功
SHOW TABLES LIKE 'jobs';
SHOW TABLES LIKE 'resumes';
SHOW TABLES LIKE 'question_tags';
SHOW TABLES LIKE 'match_results';

-- 检查字段是否添加成功
DESCRIBE questions;
DESCRIBE interview_sessions;

-- 检查外键约束
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM
  information_schema.KEY_COLUMN_USAGE
WHERE
  REFERENCED_TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('interview_sessions', 'resumes', 'match_results');
```

## 创建uploads目录

```bash
cd backend
mkdir -p uploads/resumes
chmod 755 uploads/resumes
```

