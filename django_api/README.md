# Django CRUD API

数据库增删改操作 API，与 Node.js 查询功能配合使用。

## 环境要求

- Python 3.10+
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
python manage.py runserver 8000
```

## API 接口

### 新增记录
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

### 更新记录
```bash
PUT /api/tables/{table_name}/records/{id}
Content-Type: application/json

{
  "data": {
    "field1": "new_value"
  }
}
```

### 删除记录
```bash
DELETE /api/tables/{table_name}/records/{id}
```

### 获取单条记录
```bash
GET /api/tables/{table_name}/records/{id}
```

### 批量删除
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
