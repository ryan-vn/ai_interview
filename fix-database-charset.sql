-- ========================================
-- 修复数据库字符集脚本
-- 用于修复现有数据库的中文乱码问题
-- ========================================

-- 设置会话字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 修改数据库字符集
ALTER DATABASE interview_system CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 修改所有表的字符集
ALTER TABLE roles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE questions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE templates CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE interview_sessions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE submissions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE score_records CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE interview_reports CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 验证字符集设置
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    TABLE_COLLATION
FROM 
    information_schema.TABLES
WHERE 
    TABLE_SCHEMA = 'interview_system'
ORDER BY 
    TABLE_NAME;

-- 显示所有列的字符集
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CHARACTER_SET_NAME,
    COLLATION_NAME
FROM 
    information_schema.COLUMNS
WHERE 
    TABLE_SCHEMA = 'interview_system'
    AND CHARACTER_SET_NAME IS NOT NULL
ORDER BY 
    TABLE_NAME, COLUMN_NAME;

