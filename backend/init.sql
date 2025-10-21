-- 初始化数据库脚本
-- 注意：该脚本在数据库首次创建时自动执行

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 确保数据库使用正确的字符集
ALTER DATABASE interview_system CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 创建角色表
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `avatar` VARCHAR(255),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT,
  INDEX `idx_email` (`email`),
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建题目表
CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('programming', 'qa') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `difficulty` ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  `tags` JSON,
  `language_options` JSON,
  `test_cases` JSON,
  `starter_code` JSON,
  `time_limit` INT DEFAULT 60,
  `memory_limit` INT DEFAULT 256,
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_type` (`type`),
  INDEX `idx_difficulty` (`difficulty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建面试模板表
CREATE TABLE IF NOT EXISTS `templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `question_ids` JSON NOT NULL,
  `time_limit` INT DEFAULT 3600,
  `instructions` TEXT,
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建面试场次表
CREATE TABLE IF NOT EXISTS `interview_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `template_id` INT NOT NULL,
  `candidate_id` INT NULL,
  `candidate_name` VARCHAR(100) NOT NULL,
  `candidate_email` VARCHAR(100) NOT NULL,
  `candidate_phone` VARCHAR(20) NULL,
  `position` VARCHAR(100) NULL,
  `invite_token` VARCHAR(255) UNIQUE NULL,
  `invite_expires_at` TIMESTAMP NULL,
  `interviewer_id` INT,
  `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  `start_time` TIMESTAMP NULL,
  `end_time` TIMESTAMP NULL,
  `scheduled_at` TIMESTAMP NOT NULL,
  `actual_start_at` TIMESTAMP NULL,
  `actual_end_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`candidate_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`interviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_status` (`status`),
  INDEX `idx_candidate` (`candidate_id`),
  INDEX `idx_interviewer` (`interviewer_id`),
  INDEX `idx_invite_token` (`invite_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建提交记录表
CREATE TABLE IF NOT EXISTS `submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `type` ENUM('programming', 'qa') NOT NULL,
  `content` TEXT NOT NULL,
  `language` VARCHAR(20),
  `result` JSON,
  `status` ENUM('pending', 'running', 'success', 'failed', 'timeout', 'error') DEFAULT 'pending',
  `score` FLOAT DEFAULT 0,
  `execution_time` INT,
  `memory_used` INT,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`session_id`) REFERENCES `interview_sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_session` (`session_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建评分记录表
CREATE TABLE IF NOT EXISTS `score_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `submission_id` INT NOT NULL,
  `ai_score` FLOAT,
  `ai_feedback` TEXT,
  `human_score` FLOAT,
  `human_feedback` TEXT,
  `final_score` FLOAT,
  `scored_by` INT,
  `scored_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`scored_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_submission` (`submission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建面试报告表
CREATE TABLE IF NOT EXISTS `interview_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL UNIQUE,
  `overall_score` FLOAT,
  `technical_score` FLOAT,
  `qa_score` FLOAT,
  `status` ENUM('pass', 'fail', 'pending') DEFAULT 'pending',
  `summary` TEXT,
  `recommendations` TEXT,
  `strengths` TEXT,
  `weaknesses` TEXT,
  `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`session_id`) REFERENCES `interview_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

