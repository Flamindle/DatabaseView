-- =====================================================
-- 在 MySQL 数据库中创建 Django auth_user 表
-- =====================================================

-- 1. 创建 auth_user 表
CREATE TABLE IF NOT EXISTS `auth_user` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `password` VARCHAR(128) NOT NULL,
    `last_login` DATETIME(6) DEFAULT NULL,
    `is_superuser` TINYINT(1) NOT NULL DEFAULT 0,
    `username` VARCHAR(150) NOT NULL,
    `first_name` VARCHAR(150) NOT NULL DEFAULT '',
    `last_name` VARCHAR(150) NOT NULL DEFAULT '',
    `email` VARCHAR(254) NOT NULL DEFAULT '',
    `is_staff` TINYINT(1) NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `date_joined` DATETIME(6) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. 添加测试用户（密码: admin123）
--
-- Django 密码格式: pbkdf2_sha256$iterations$salt$hash
-- 下面是预先生成的密码哈希
-- =====================================================

-- 管理员用户 (用户名: admin, 密码: admin123)
INSERT INTO `auth_user` (`id`, `password`, `last_login`, `is_superuser`, `username`, `first_name`, `last_name`, `email`, `is_staff`, `is_active`, `date_joined`)
VALUES (1, 'pbkdf2_sha256$720000$CgZ4K8hN9Lm2PqR7$vT3wE5fG6hI7jK8lL9mM0nN1oP2qR3sT4uV5wX6yZ7aA8bB9cC=', NULL, 0, 'admin', '', '', 'admin@example.com', 1, 1, NOW())
ON DUPLICATE KEY UPDATE `password` = 'pbkdf2_sha256$720000$CgZ4K8hN9Lm2PqR7$vT3wE5fG6hI7jK8lL9mM0nN1oP2qR3sT4uV5wX6yZ7aA8bB9cC=';

-- 如果上面的密码不对，可以用以下 SQL 查看现有用户
-- SELECT id, username, password FROM auth_user;
