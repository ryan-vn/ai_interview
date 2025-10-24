-- ===================================================
-- 数据库迁移脚本
-- 版本: 001
-- 描述: 添加岗位管理、简历管理、题库增强、匹配度功能
-- 日期: 2025-10-24
-- ===================================================

-- 1. 创建岗位表 (jobs)
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL COMMENT '岗位名称',
  `department` VARCHAR(100) NOT NULL COMMENT '所属部门',
  `responsibilities` TEXT NOT NULL COMMENT '岗位职责',
  `requirements` TEXT NOT NULL COMMENT '技能要求',
  `skill_keywords` JSON NULL COMMENT '技能关键词（JSON数组）',
  `hiring_count` INT NULL COMMENT '招聘人数',
  `education_requirement` VARCHAR(50) NULL COMMENT '学历要求',
  `experience_requirement` VARCHAR(50) NULL COMMENT '工作年限要求',
  `salary_range` VARCHAR(50) NULL COMMENT '薪资范围',
  `location` VARCHAR(100) NULL COMMENT '工作地点',
  `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open' COMMENT '岗位状态',
  `created_by` INT NULL COMMENT '创建者ID',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已删除',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_department` (`department`),
  INDEX `idx_status` (`status`),
  INDEX `idx_is_deleted` (`is_deleted`),
  INDEX `idx_created_by` (`created_by`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='岗位表';

-- 2. 创建简历表 (resumes)
CREATE TABLE IF NOT EXISTS `resumes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '候选人姓名',
  `phone` VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
  `gender` VARCHAR(10) NULL COMMENT '性别',
  `age` INT NULL COMMENT '年龄',
  `skills` JSON NULL COMMENT '技能关键词（JSON数组）',
  `experience` JSON NULL COMMENT '工作经历（JSON数组）',
  `education` JSON NULL COMMENT '教育经历（JSON数组）',
  `years_of_experience` INT NULL COMMENT '工作年限',
  `expected_salary` VARCHAR(50) NULL COMMENT '期望薪资',
  `status` ENUM('new', 'screening', 'interview', 'offer', 'rejected', 'hired') NOT NULL DEFAULT 'new' COMMENT '当前状态',
  `job_id` INT NULL COMMENT '关联岗位ID',
  `file_path` VARCHAR(500) NULL COMMENT '简历文件路径',
  `file_name` VARCHAR(255) NULL COMMENT '简历文件名',
  `parse_status` ENUM('success', 'failed', 'pending') NOT NULL DEFAULT 'pending' COMMENT '解析状态',
  `parse_error` TEXT NULL COMMENT '解析错误信息',
  `source` VARCHAR(50) NULL DEFAULT 'upload' COMMENT '简历来源',
  `notes` TEXT NULL COMMENT '备注',
  `imported_by` INT NULL COMMENT '导入者ID',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已删除',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_phone` (`phone`),
  INDEX `idx_email` (`email`),
  INDEX `idx_status` (`status`),
  INDEX `idx_job_id` (`job_id`),
  INDEX `idx_is_deleted` (`is_deleted`),
  INDEX `idx_imported_by` (`imported_by`),
  FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`imported_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='简历表';

-- 3. 创建题目标签表 (question_tags)
CREATE TABLE IF NOT EXISTS `question_tags` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
  `category` ENUM('technical', 'behavioral', 'management', 'other') NOT NULL DEFAULT 'technical' COMMENT '标签分类',
  `color` VARCHAR(20) NULL COMMENT '标签颜色',
  `parent_id` INT NULL COMMENT '父标签ID',
  `description` TEXT NULL COMMENT '标签描述',
  `created_by` INT NULL COMMENT '创建者ID',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已删除',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_name` (`name`),
  INDEX `idx_category` (`category`),
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_is_deleted` (`is_deleted`),
  FOREIGN KEY (`parent_id`) REFERENCES `question_tags`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目标签表';

-- 4. 创建匹配结果表 (match_results)
CREATE TABLE IF NOT EXISTS `match_results` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `resume_id` INT NOT NULL COMMENT '简历ID',
  `job_id` INT NOT NULL COMMENT '岗位ID',
  `score` FLOAT NOT NULL COMMENT '匹配度分值（0-100）',
  `matched_keywords` JSON NULL COMMENT '匹配的关键词（JSON数组）',
  `missing_keywords` JSON NULL COMMENT '缺失的关键词（JSON数组）',
  `details` TEXT NULL COMMENT '匹配详情说明',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_resume_job` (`resume_id`, `job_id`),
  INDEX `idx_score` (`score`),
  FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='匹配结果表';

-- 5. 修改题目表 (questions) - 添加新字段
ALTER TABLE `questions` 
  ADD COLUMN IF NOT EXISTS `tag_ids` JSON NULL COMMENT '标签ID列表（JSON数组）' AFTER `tags`,
  ADD COLUMN IF NOT EXISTS `standard_answer` TEXT NULL COMMENT '标准答案（用于QA/行为题）' AFTER `memory_limit`,
  ADD COLUMN IF NOT EXISTS `answer_points` JSON NULL COMMENT '答案要点（JSON数组）' AFTER `standard_answer`,
  ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已删除' AFTER `answer_points`;

-- 修改题目类型枚举，添加新类型
ALTER TABLE `questions` 
  MODIFY COLUMN `type` ENUM('programming', 'qa', 'behavioral', 'technical_qa') NOT NULL COMMENT '题目类型';

-- 添加索引
ALTER TABLE `questions` 
  ADD INDEX IF NOT EXISTS `idx_is_deleted` (`is_deleted`);

-- 6. 修改面试场次表 (interview_sessions) - 添加关联字段
ALTER TABLE `interview_sessions` 
  ADD COLUMN IF NOT EXISTS `job_id` INT NULL COMMENT '关联岗位ID' AFTER `position`,
  ADD COLUMN IF NOT EXISTS `resume_id` INT NULL COMMENT '关联简历ID' AFTER `job_id`;

-- 添加外键和索引
ALTER TABLE `interview_sessions` 
  ADD INDEX IF NOT EXISTS `idx_job_id` (`job_id`),
  ADD INDEX IF NOT EXISTS `idx_resume_id` (`resume_id`);

-- 添加外键约束（如果不存在）
SET @fk_job_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'interview_sessions' 
    AND CONSTRAINT_NAME = 'fk_interview_sessions_job_id'
);

SET @sql_add_fk_job = IF(
  @fk_job_exists = 0,
  'ALTER TABLE `interview_sessions` ADD CONSTRAINT `fk_interview_sessions_job_id` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE SET NULL',
  'SELECT "FK already exists" AS message'
);

PREPARE stmt FROM @sql_add_fk_job;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_resume_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'interview_sessions' 
    AND CONSTRAINT_NAME = 'fk_interview_sessions_resume_id'
);

SET @sql_add_fk_resume = IF(
  @fk_resume_exists = 0,
  'ALTER TABLE `interview_sessions` ADD CONSTRAINT `fk_interview_sessions_resume_id` FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON DELETE SET NULL',
  'SELECT "FK already exists" AS message'
);

PREPARE stmt FROM @sql_add_fk_resume;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. 创建uploads目录（通过代码处理，这里仅作记录）
-- 需要在服务器上手动创建或通过代码创建以下目录：
-- - uploads/resumes/  (简历文件存储)

-- ===================================================
-- 迁移完成
-- ===================================================

