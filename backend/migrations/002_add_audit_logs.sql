-- 添加审计日志表
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

