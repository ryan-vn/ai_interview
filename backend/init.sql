-- ===================================================
-- 面试管理系统数据库初始化脚本
-- 版本: 2.0 (整合所有迁移)
-- 日期: 2025-10-27
-- 说明: 该脚本包含所有表结构和初始数据
-- ===================================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 确保数据库使用正确的字符集
ALTER DATABASE interview_system CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===================================================
-- 基础表：角色和用户
-- ===================================================

-- 创建角色表
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称',
  `description` VARCHAR(255) COMMENT '角色描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（加密）',
  `role_id` INT NOT NULL COMMENT '角色ID',
  `avatar` VARCHAR(255) COMMENT '头像URL',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT,
  INDEX `idx_email` (`email`),
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ===================================================
-- 岗位和简历管理
-- ===================================================

-- 创建岗位表
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

-- 创建简历表
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

-- 创建匹配结果表
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

-- ===================================================
-- 题库管理
-- ===================================================

-- 创建题目表
CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('programming', 'qa', 'behavioral', 'technical_qa') NOT NULL COMMENT '题目类型',
  `title` VARCHAR(255) NOT NULL COMMENT '题目标题',
  `description` TEXT NOT NULL COMMENT '题目描述',
  `difficulty` ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '难度等级',
  `tags` JSON COMMENT '标签（JSON数组）',
  `tag_ids` JSON NULL COMMENT '标签ID列表（JSON数组）',
  `language_options` JSON COMMENT '支持的编程语言（JSON数组）',
  `test_cases` JSON COMMENT '测试用例（JSON数组）',
  `starter_code` JSON COMMENT '初始代码模板（JSON对象）',
  `time_limit` INT DEFAULT 60 COMMENT '时间限制（秒）',
  `memory_limit` INT DEFAULT 256 COMMENT '内存限制（MB）',
  `standard_answer` TEXT NULL COMMENT '标准答案（用于QA/行为题）',
  `answer_points` JSON NULL COMMENT '答案要点（JSON数组）',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已删除',
  `created_by` INT COMMENT '创建者ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_type` (`type`),
  INDEX `idx_difficulty` (`difficulty`),
  INDEX `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目表';

-- 创建题目标签表
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

-- ===================================================
-- 面试管理
-- ===================================================

-- 创建面试模板表
CREATE TABLE IF NOT EXISTS `templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '模板名称',
  `description` TEXT COMMENT '模板描述',
  `question_ids` JSON NOT NULL COMMENT '题目ID列表（JSON数组）',
  `time_limit` INT DEFAULT 3600 COMMENT '时间限制（秒）',
  `instructions` TEXT COMMENT '面试说明',
  `created_by` INT COMMENT '创建者ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面试模板表';

-- 创建面试场次表
CREATE TABLE IF NOT EXISTS `interview_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '面试名称',
  `template_id` INT NOT NULL COMMENT '模板ID',
  `candidate_id` INT NULL COMMENT '候选人用户ID',
  `candidate_name` VARCHAR(100) NOT NULL COMMENT '候选人姓名',
  `candidate_email` VARCHAR(100) NOT NULL COMMENT '候选人邮箱',
  `candidate_phone` VARCHAR(20) NULL COMMENT '候选人电话',
  `position` VARCHAR(100) NULL COMMENT '应聘职位',
  `job_id` INT NULL COMMENT '关联岗位ID',
  `resume_id` INT NULL COMMENT '关联简历ID',
  `invite_token` VARCHAR(255) UNIQUE NULL COMMENT '邀请令牌',
  `invite_expires_at` TIMESTAMP NULL COMMENT '邀请过期时间',
  `interviewer_id` INT COMMENT '面试官ID',
  `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled' COMMENT '面试状态',
  `start_time` TIMESTAMP NULL COMMENT '计划开始时间',
  `end_time` TIMESTAMP NULL COMMENT '计划结束时间',
  `scheduled_at` TIMESTAMP NOT NULL COMMENT '安排时间',
  `actual_start_at` TIMESTAMP NULL COMMENT '实际开始时间',
  `actual_end_at` TIMESTAMP NULL COMMENT '实际结束时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`candidate_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`interviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON DELETE SET NULL,
  INDEX `idx_status` (`status`),
  INDEX `idx_candidate` (`candidate_id`),
  INDEX `idx_interviewer` (`interviewer_id`),
  INDEX `idx_invite_token` (`invite_token`),
  INDEX `idx_job_id` (`job_id`),
  INDEX `idx_resume_id` (`resume_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面试场次表';

-- 创建提交记录表（支持访客提交）
CREATE TABLE IF NOT EXISTS `submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL COMMENT '面试场次ID',
  `question_id` INT NOT NULL COMMENT '题目ID',
  `user_id` INT NULL DEFAULT NULL COMMENT '用户ID（访客为NULL）',
  `type` ENUM('programming', 'qa') NOT NULL COMMENT '提交类型',
  `content` TEXT NOT NULL COMMENT '提交内容',
  `language` VARCHAR(20) COMMENT '编程语言',
  `result` JSON COMMENT '执行结果（JSON）',
  `status` ENUM('pending', 'running', 'success', 'failed', 'timeout', 'error') DEFAULT 'pending' COMMENT '执行状态',
  `score` FLOAT DEFAULT 0 COMMENT '得分',
  `execution_time` INT COMMENT '执行时间（ms）',
  `memory_used` INT COMMENT '内存使用（KB）',
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  FOREIGN KEY (`session_id`) REFERENCES `interview_sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  INDEX `idx_session` (`session_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提交记录表';

-- 创建评分记录表
CREATE TABLE IF NOT EXISTS `score_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `submission_id` INT NOT NULL COMMENT '提交记录ID',
  `ai_score` FLOAT COMMENT 'AI评分',
  `ai_feedback` TEXT COMMENT 'AI反馈',
  `human_score` FLOAT COMMENT '人工评分',
  `human_feedback` TEXT COMMENT '人工反馈',
  `final_score` FLOAT COMMENT '最终得分',
  `scored_by` INT COMMENT '评分人ID',
  `scored_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评分时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`scored_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_submission` (`submission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评分记录表';

-- 创建面试报告表
CREATE TABLE IF NOT EXISTS `interview_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL UNIQUE COMMENT '面试场次ID',
  `overall_score` FLOAT COMMENT '总体得分',
  `technical_score` FLOAT COMMENT '技术得分',
  `qa_score` FLOAT COMMENT '问答得分',
  `status` ENUM('pass', 'fail', 'pending') DEFAULT 'pending' COMMENT '评估结果',
  `summary` TEXT COMMENT '总结',
  `recommendations` TEXT COMMENT '建议',
  `strengths` TEXT COMMENT '优势',
  `weaknesses` TEXT COMMENT '不足',
  `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`session_id`) REFERENCES `interview_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面试报告表';

-- ===================================================
-- 审计日志
-- ===================================================

-- 创建题目操作审计日志表
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `module` ENUM('question', 'tag') NOT NULL COMMENT '模块',
  `action` ENUM('create', 'update', 'delete', 'import', 'batch_delete') NOT NULL COMMENT '操作动作',
  `target_id` INT NULL COMMENT '目标ID（题目ID或标签ID）',
  `target_name` TEXT NULL COMMENT '目标名称',
  `details` JSON NULL COMMENT '操作详情',
  `old_data` JSON NULL COMMENT '操作前数据',
  `new_data` JSON NULL COMMENT '操作后数据',
  `user_id` INT NOT NULL COMMENT '操作人ID',
  `ip_address` VARCHAR(50) NULL COMMENT 'IP地址',
  `user_agent` TEXT NULL COMMENT '用户代理',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  INDEX `idx_module_action` (`module`, `action`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_audit_logs_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- 创建简历操作审计日志表
CREATE TABLE IF NOT EXISTS `resume_audit_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `resume_id` INT NOT NULL COMMENT '简历ID',
  `action` ENUM('create','update','delete','upload','parse','reparse','link_job','download','status_change') NOT NULL COMMENT '操作类型',
  `user_id` INT NOT NULL COMMENT '操作人ID',
  `details` JSON DEFAULT NULL COMMENT '操作详情',
  `ip_address` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_resume_id` (`resume_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_resume_action` (`resume_id`, `action`),
  KEY `idx_user_action` (`user_id`, `action`),
  CONSTRAINT `fk_resume_audit_resume` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_resume_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='简历审计日志表';

-- ===================================================
-- 初始数据
-- ===================================================

-- 插入默认角色
INSERT INTO `roles` (`name`, `description`) VALUES
('candidate', '候选人角色'),
('interviewer', '面试官角色'),
('admin', '管理员角色')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 插入测试用户（密码都是: 111111）
-- 注意：生产环境中应该删除这些测试数据
INSERT INTO `users` (`username`, `email`, `password`, `role_id`) VALUES
('admin', 'admin@example.com', '$2b$10$jQp4AvZB5U5LEuH7uF60.OaZo6UAIrbo5MPBc8q5qbyvTpywZ5.Sa', 3),
('interviewer1', 'interviewer@example.com', '$2b$10$jQp4AvZB5U5LEuH7uF60.OaZo6UAIrbo5MPBc8q5qbyvTpywZ5.Sa', 2),
('candidate1', 'candidate@example.com', '$2b$10$jQp4AvZB5U5LEuH7uF60.OaZo6UAIrbo5MPBc8q5qbyvTpywZ5.Sa', 1)
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

-- 插入示例题目
INSERT INTO `questions` (`type`, `title`, `description`, `difficulty`, `tags`, `language_options`, `test_cases`, `time_limit`) VALUES
(
  'programming',
  '两数之和',
  '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。',
  'easy',
  JSON_ARRAY('数组', '哈希表'),
  JSON_ARRAY('javascript', 'python', 'java'),
  JSON_ARRAY(
    JSON_OBJECT('input', '[2,7,11,15], 9', 'output', '[0,1]'),
    JSON_OBJECT('input', '[3,2,4], 6', 'output', '[1,2]')
  ),
  30
),
(
  'qa',
  '自我介绍',
  '请简单介绍一下你自己，包括你的技术背景、项目经验和职业规划。',
  'easy',
  JSON_ARRAY('行为面试', '软技能'),
  NULL,
  NULL,
  10
)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 插入默认面试模板
INSERT INTO `templates` (`name`, `description`, `question_ids`, `time_limit`, `instructions`) VALUES
('前端工程师面试模板', '适用于前端开发岗位的综合面试，包含算法和前端知识考察', JSON_ARRAY(1, 2), 7200, '本次面试包含编程题和问答题，请在规定时间内完成。编程题请选择你熟悉的语言作答，问答题请详细回答。'),
('算法工程师面试模板', '侧重算法和数据结构的面试，适用于算法工程师岗位', JSON_ARRAY(1), 3600, '本次面试主要考察算法能力，请认真分析问题，选择合适的数据结构和算法实现。'),
('快速面试模板', '适用于初筛的快速面试，包含1-2道基础题目', JSON_ARRAY(2), 1800, '本次面试为快速初筛，请简洁明了地回答问题。'),
('综合技术面试模板', '全面考察候选人的技术能力，包含编程和问答', JSON_ARRAY(1, 2), 5400, '本次面试包含多个部分，请合理分配时间。建议先完成简单题目，再解决难题。'),
('行为面试模板', '主要考察候选人的沟通能力、团队协作和职业规划', JSON_ARRAY(2), 2400, '本次面试主要通过问答了解您的背景和能力，请真实、详细地回答每个问题。')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ===================================================
-- 初始化完成
-- ===================================================
