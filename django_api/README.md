# Django CRUD API

数据库增删改操作 API，与 Node.js 查询功能配合使用。

数据库中手动创建了 Django 需要的系统表，或者不想重新执行迁移，以下指令可以处理这个警告：
python manage.py migrate --fake

## 环境要求

- Python 3.9+
- MySQL 5.7+ 或 MySQL 8.0+

## 安装

```bash
cd django_api

# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

## 配置

编辑 `.env` 文件，配置数据库连接：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database
```

## 启动

```bash
python manage.py migrate    # 首次运行需要初始化数据库
python manage.py runserver 9000
```

## 创建管理员用户

```bash
cd django_api
python manage.py createsuperuser
# 按提示输入用户名和密码
```

或者创建普通用户（可用于登录）：

```bash
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.create_user('admin', 'admin@example.com', 'password123')
>>> User.objects.filter(username='admin').update(is_staff=True)  # 赋予管理员权限
```

## 认证说明

- **登录接口**：POST `/api/auth/login` — 使用 Django auth_user 表验证
- **登出接口**：POST `/api/auth/logout`
- **状态查询**：GET `/api/auth/status`
- **CSRF Token**：GET `/api/auth/csrf`

### 登录请求示例

```bash
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'
```

### 认证状态

- **未登录**：可以查看数据，但无法增删改
- **已登录**：可以查看、增删改数据
- **登出后**：恢复只读权限

## API 接口

### 认证接口

```bash
# 登录
POST /api/auth/login
Content-Type: application/json
{ "username": "admin", "password": "password123" }

# 登出
POST /api/auth/logout

# 查询登录状态
GET /api/auth/status
```

### 新增记录（需登录）
```bash
POST /api/tables/{table_name}/records
Content-Type: application/json

{
  "data": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

### 更新记录（需登录）
```bash
PUT /api/tables/{table_name}/records/{id}
Content-Type: application/json

{
  "data": {
    "field1": "new_value"
  }
}
```

### 删除记录（需登录）
```bash
DELETE /api/tables/{table_name}/records/{id}
```

### 获取单条记录
```bash
GET /api/tables/{table_name}/records/{id}
```

### 批量删除（需登录）
```bash
POST /api/tables/{table_name}/records/batch
Content-Type: application/json

{
  "ids": [1, 2, 3]
}
```

### 获取表结构
```bash
GET /api/tables/{table_name}/records
```

## 响应格式

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

错误响应：
```json
{
  "success": false,
  "message": "错误信息"
}
```
