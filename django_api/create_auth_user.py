#!/usr/bin/env python
"""
创建 Django auth_user 表和用户
直接连接到 MySQL 数据库，创建 auth_user 表并添加用户
"""
import sys
import os

# 添加 Django 项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

import mysql.connector
from django.contrib.auth.hashers import make_password


def create_auth_user_table(conn):
    """创建 auth_user 表"""
    cursor = conn.cursor()
    cursor.execute("""
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    conn.commit()
    cursor.close()
    print("[OK] auth_user 表已创建")


def create_user(conn, username, password, is_staff=True):
    """创建用户"""
    # 使用 Django 生成密码哈希
    hashed_password = make_password(password)

    cursor = conn.cursor()
    # 先删除已存在的用户
    cursor.execute("DELETE FROM auth_user WHERE username = %s", (username,))
    # 插入新用户
    cursor.execute("""
        INSERT INTO auth_user (password, last_login, is_superuser, username,
            first_name, last_name, email, is_staff, is_active, date_joined)
        VALUES (%s, NULL, 0, %s, '', '', '', %s, 1, NOW())
    """, (hashed_password, username, is_staff))
    conn.commit()
    cursor.close()
    print(f"[OK] 用户 '{username}' 已创建，密码: {password}")


def main():
    print("=" * 50)
    print("Django auth_user 表创建工具")
    print("=" * 50)

    # 从命令行参数或环境变量获取配置
    import argparse
    parser = argparse.ArgumentParser(description='创建 auth_user 表和用户')
    parser.add_argument('--host', default='localhost', help='MySQL 主机')
    parser.add_argument('--port', type=int, default=3306, help='MySQL 端口')
    parser.add_argument('--user', default='root', help='MySQL 用户名')
    parser.add_argument('--password', default='', help='MySQL 密码')
    parser.add_argument('--database', required=True, help='数据库名')
    parser.add_argument('--username', default='admin', help='要创建的用户名')
    parser.add_argument('--password-val', default='admin123', help='用户密码')

    args = parser.parse_args()

    print(f"\n配置信息:")
    print(f"  主机: {args.host}")
    print(f"  端口: {args.port}")
    print(f"  用户: {args.user}")
    print(f"  数据库: {args.database}")

    try:
        # 连接 MySQL
        print("\n正在连接 MySQL...")
        conn = mysql.connector.connect(
            host=args.host,
            port=args.port,
            user=args.user,
            password=args.password,
            database=args.database,
            charset='utf8mb4'
        )
        print("[OK] 连接成功\n")

        # 创建表
        create_auth_user_table(conn)

        # 创建用户
        create_user(conn, args.username, args.password_val, is_staff=True)

        conn.close()
        print("\n" + "=" * 50)
        print("完成！现在可以使用以下账号登录：")
        print(f"  用户名: {args.username}")
        print(f"  密码: {args.password_val}")
        print("=" * 50)

    except mysql.connector.Error as e:
        print(f"\n[错误] MySQL 连接失败: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
