-- 003: 添加简历操作审计日志表

-- 创建简历审计日志表
CREATE TABLE IF NOT EXISTS `resume_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `resume_id` int NOT NULL,
  `action` enum('create','update','delete','upload','parse','reparse','link_job','download','status_change') NOT NULL,
  `user_id` int NOT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_resume_id` (`resume_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_resume_audit_resume` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_resume_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加索引以提高查询性能
CREATE INDEX `idx_resume_action` ON `resume_audit_logs` (`resume_id`, `action`);
CREATE INDEX `idx_user_action` ON `resume_audit_logs` (`user_id`, `action`);

