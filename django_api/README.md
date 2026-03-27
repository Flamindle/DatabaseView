# Django CRUD API

数据库增删改操作 API，与 Node.js 查询功能配合使用。

## 特点

- **认证和 CRUD 使用同一个数据库**（前端传入）
- **Session 存储在 SQLite**（本地文件）
- **auth_user 表必须在用户数据库中存在**

## 环境要求

- Python 3.9+
- MySQL 5.7+ 或 MySQL 8.0+

## 安装

```bash
cd django_api
pip install -r requirements.txt
```

## 初始化

**1. 运行 Django 迁移（创建 SQLite session 表）：**

```bash
python manage.py migrate
```

**2. 创建 auth_user 表和用户：**

在你的 MySQL 数据库中创建 auth_user 表并添加用户：

```bash
python create_auth_user.py --database 你的数据库名 --password 你的数据库密码
```

这会自动：
- 创建 `auth_user` 表
- 创建管理员用户 `admin` / `admin123`

## 启动

```bash
python manage.py runserver 9000
```

## 使用流程

1. 启动 Django 服务
2. 在 Web 前端填写 MySQL 连接信息并连接数据库
3. 点击右上角"登录"按钮
4. 输入用户名密码登录
5. 登录成功后即可使用增删改功能

## 创建用户参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--database` | 数据库名（必填） | - |
| `--host` | MySQL 主机 | localhost |
| `--port` | MySQL 端口 | 3306 |
| `--user` | MySQL 用户名 | root |
| `--password` | MySQL 密码（必填） | - |
| `--username` | 应用用户名 | admin |
| `--password-val` | 应用用户密码 | admin123 |

## API 接口

### 认证接口

```bash
# 登录
POST /api/auth/login
{ "username": "admin", "password": "admin123" }

# 登出
POST /api/auth/logout

# 查询状态
GET /api/auth/status
```

### 数据操作

| 操作 | 方法 | 需登录 |
|------|------|--------|
| 获取表结构 | GET | 否 |
| 新增记录 | POST | 是 |
| 更新记录 | PUT | 是 |
| 删除记录 | DELETE | 是 |
| 批量删除 | POST | 是 |

## auth_user 表结构

```sql
CREATE TABLE `auth_user` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `password` VARCHAR(128) NOT NULL,
    `username` VARCHAR(150) NOT NULL UNIQUE,
    `is_staff` TINYINT(1) DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `date_joined` DATETIME NOT NULL
);
```

密码使用 Django 格式存储，如：`pbkdf2_sha256$720000$...`
