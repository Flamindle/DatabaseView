# Django 集成方案 - 数据库 CRUD 功能扩展

## 一、项目背景

当前 DatabaseView 项目基于 Node.js + Express 实现了 MySQL 数据库的**查询**功能，包括：
- 数据库连接管理
- 表数据查询（分页、排序）
- 字段管理和视图切换
- 主题切换

**目标**：增加 Django 子项目，实现数据库的**增、删、改**操作，与现有 Node.js 项目协同工作。

---

## 二、架构设计

### 2.1 整体架构（读写分离）

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vite + 原生 JS)                  │
│  - 查询操作 → Node.js API (端口 3000)                        │
│  - 增删改操作 → Django API (端口 9000)                       │
└─────────────────────────────────────────────────────────────┘
                    ↓                        ↓
        ┌───────────────────┐      ┌───────────────────┐
        │   Node.js 后端     │      │   Django 后端      │
        │   (Express)       │      │   (DRF)           │
        │   端口: 3000      │      │   端口: 9000      │
        │                   │      │                   │
        │ - 查询数据库列表   │      │ - 新增记录 (POST)  │
        │ - 查询表数据       │      │ - 更新记录 (PUT)   │
        │ - 分页/排序       │      │ - 删除记录 (DELETE)│
        └───────────────────┘      └───────────────────┘
                    ↓                        ↓
                ┌─────────────────────────────────┐
                │         MySQL 数据库             │
                │      (共享同一数据库实例)         │
                └─────────────────────────────────┘
```

### 2.2 为什么选择读写分离？

**优势**：
1. **保留现有功能**：Node.js 查询功能已稳定，无需重构
2. **职责清晰**：Node.js 专注读操作（高频），Django 专注写操作（低频）
3. **技术栈互补**：Node.js 轻量快速，Django ORM 强大安全
4. **渐进式迁移**：未来可逐步将所有功能迁移到 Django
5. **学习成本低**：前端只需增加新的 API 调用

**劣势**：
- 需要维护两套后端代码
- 需要配置 CORS 跨域

---

## 三、技术栈

### 3.1 Django 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.10+ | 运行环境 |
| Django | 5.0+ | Web 框架 |
| Django REST Framework | 3.14+ | REST API 框架 |
| mysqlclient | 2.2+ | MySQL 驱动 |
| django-cors-headers | 4.3+ | CORS 跨域支持 |

### 3.2 前端扩展

- 新增表单组件（新增/编辑记录）
- 新增操作按钮（编辑、删除）
- 新增 API 服务层（调用 Django API）

---

## 四、目录结构

```
DatabaseView/
├── server/                    # Node.js 后端（查询）
│   ├── index.js
│   ├── db/
│   ├── routes/
│   └── ...
├── src/                       # 前端
│   ├── app.js
│   ├── components/
│   ├── services/
│   │   ├── api.js            # Node.js API 调用
│   │   └── djangoApi.js      # Django API 调用（新增）
│   └── ...
├── django_api/                # Django 后端（增删改）【新增】
│   ├── manage.py
│   ├── config/                # Django 项目配置
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── crud_api/              # CRUD API 应用
│   │   ├── __init__.py
│   │   ├── models.py         # 动态模型（可选）
│   │   ├── views.py          # API 视图
│   │   ├── serializers.py    # 序列化器
│   │   └── urls.py
│   ├── requirements.txt       # Python 依赖
│   └── .env                   # 数据库配置
├── package.json
├── vite.config.js
├── CLAUDE.md
└── DJANGO_INTEGRATION_PLAN.md  # 本文档
```

---

## 五、Django API 设计

### 5.1 API 端点

| 方法 | 路径 | 功能 | 请求体 |
|------|------|------|--------|
| POST | `/api/tables/{table}/records` | 新增记录 | `{ "data": {...} }` |
| PUT | `/api/tables/{table}/records/{id}` | 更新记录 | `{ "data": {...} }` |
| DELETE | `/api/tables/{table}/records/{id}` | 删除记录 | - |
| GET | `/api/tables/{table}/schema` | 获取表结构 | - |

### 5.2 请求示例

**新增记录**：
```bash
POST http://localhost:8000/api/tables/users/records
Content-Type: application/json

{
  "data": {
    "name": "张三",
    "email": "zhangsan@example.com",
    "age": 25
  }
}
```

**更新记录**：
```bash
PUT http://localhost:8000/api/tables/users/records/123
Content-Type: application/json

{
  "data": {
    "name": "李四",
    "age": 26
  }
}
```

**删除记录**：
```bash
DELETE http://localhost:8000/api/tables/users/records/123
```

### 5.3 响应格式

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "id": 123,
    "name": "张三",
    "email": "zhangsan@example.com"
  }
}
```

---

## 六、实现步骤

### 阶段 1：Django 项目搭建（1-2 小时）

- [ ] 创建 Django 项目和应用
- [ ] 配置 MySQL 数据库连接
- [ ] 安装 Django REST Framework 和 CORS
- [ ] 配置 settings.py（数据库、CORS、静态文件）
- [ ] 创建基础 API 视图

### 阶段 2：CRUD API 实现（2-3 小时）

- [ ] 实现动态表操作（无需预定义模型）
- [ ] 实现 POST /api/tables/{table}/records（新增）
- [ ] 实现 PUT /api/tables/{table}/records/{id}（更新）
- [ ] 实现 DELETE /api/tables/{table}/records/{id}（删除）
- [ ] 实现 GET /api/tables/{table}/schema（获取表结构）
- [ ] 添加错误处理和参数验证

### 阶段 3：前端集成（2-3 小时）

- [ ] 创建 `src/services/djangoApi.js`
- [ ] 在表格中添加"操作"列（编辑、删除按钮）
- [ ] 创建新增/编辑记录的模态框组件
- [ ] 实现表单验证和提交
- [ ] 实现删除确认对话框
- [ ] 操作成功后刷新表格数据

### 阶段 4：开发环境配置（30 分钟）

- [ ] 更新 `package.json` 添加 Django 启动脚本
- [ ] 配置 Vite 代理 Django API（开发模式）
- [ ] 更新 CLAUDE.md 文档

### 阶段 5：测试与优化（1-2 小时）

- [ ] 测试新增、编辑、删除功能
- [ ] 测试不同数据类型字段
- [ ] 测试错误处理（网络错误、权限错误）
- [ ] 性能优化（批量操作、事务）
- [ ] 安全加固（SQL 注入防护、XSS 防护）

---

## 七、关键技术点

### 7.1 Django 动态表操作

由于表结构是动态的（用户可以连接任意数据库），不能预定义 Django Model。

**方案**：使用原生 SQL + Django 数据库连接

```python
from django.db import connection

def insert_record(table_name, data):
    with connection.cursor() as cursor:
        fields = ', '.join(data.keys())
        placeholders = ', '.join(['%s'] * len(data))
        sql = f"INSERT INTO `{table_name}` ({fields}) VALUES ({placeholders})"
        cursor.execute(sql, list(data.values()))
        return cursor.lastrowid
```

### 7.2 CORS 配置

Django 需要允许前端跨域请求：

```python
# settings.py
INSTALLED_APPS = [
    'corsheaders',
    ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite 开发服务器
    "http://localhost:3000",  # Node.js 生产服务器
]
```

### 7.3 前端 API 调用

```javascript
// src/services/djangoApi.js
const DJANGO_BASE_URL = 'http://localhost:8000/api';

export async function createRecord(tableName, data) {
  const resp = await fetch(`${DJANGO_BASE_URL}/tables/${tableName}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  return await resp.json();
}

export async function updateRecord(tableName, id, data) {
  const resp = await fetch(`${DJANGO_BASE_URL}/tables/${tableName}/records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  return await resp.json();
}

export async function deleteRecord(tableName, id) {
  const resp = await fetch(`${DJANGO_BASE_URL}/tables/${tableName}/records/${id}`, {
    method: 'DELETE'
  });
  return await resp.json();
}
```

### 7.4 前端表格操作列

在 `DataTable.js` 中添加操作列：

```javascript
// 表头增加"操作"列
tableHtml += '<th style="width:120px;min-width:120px;">操作</th>';

// 数据行增加操作按钮
data.forEach(row => {
  tableHtml += '<tr>';
  effectiveFields.forEach(field => {
    tableHtml += `<td>${row[field] || ''}</td>`;
  });
  tableHtml += `
    <td>
      <button class="btn-edit" data-id="${row.id}">编辑</button>
      <button class="btn-delete" data-id="${row.id}">删除</button>
    </td>
  `;
  tableHtml += '</tr>';
});
```

---

## 八、开发环境启动

### 8.1 启动命令

**开发模式**（同时启动 Node.js + Django + Vite）：
```bash
npm run dev:all
```

**package.json 配置**：
```json
{
  "scripts": {
    "start": "node server/index.js",
    "dev": "concurrently \"node server/index.js\" \"vite\"",
    "dev:all": "concurrently \"node server/index.js\" \"vite\" \"cd django_api && python manage.py runserver 8000\"",
    "build": "vite build",
    "django": "cd django_api && python manage.py runserver 8000"
  }
}
```

### 8.2 端口分配

| 服务 | 端口 | 用途 |
|------|------|------|
| Node.js | 3000 | 查询 API + 生产静态文件服务 |
| Django | 8000 | 增删改 API |
| Vite | 5173 | 开发服务器（HMR） |

---

## 九、安全考虑

### 9.1 SQL 注入防护

- ✅ 使用参数化查询（`cursor.execute(sql, params)`）
- ✅ 验证表名和字段名（白名单）
- ❌ 禁止直接拼接 SQL 字符串

### 9.2 权限控制

- 当前版本：无权限控制（演示用途）
- 生产环境建议：
  - 添加用户认证（JWT Token）
  - 添加操作日志
  - 限制可操作的表（白名单）

### 9.3 数据验证

- 前端验证：字段类型、必填项、长度限制
- 后端验证：Django Serializer 验证
- 数据库约束：NOT NULL、UNIQUE、FOREIGN KEY

---

## 十、未来扩展

### 10.1 短期（1-2 周）

- [ ] 批量删除功能
- [ ] 数据导入（CSV/Excel）
- [ ] 数据导出（CSV/Excel）
- [ ] 操作历史记录

### 10.2 中期（1-2 月）

- [ ] 用户认证和权限管理
- [ ] 多数据库支持（PostgreSQL、SQLite）
- [ ] 复杂查询构建器（WHERE、JOIN）
- [ ] 数据可视化图表（基于查询结果）

### 10.3 长期（3-6 月）

- [ ] 完全迁移到 Django（替代 Node.js）
- [ ] 前端改用 Vue 3 或 React
- [ ] 仪表板功能（类 FineBI）
- [ ] 多租户支持

---

## 十一、风险与注意事项

### 11.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 两套后端维护成本高 | 中 | 统一错误处理、日志格式 |
| CORS 配置错误 | 高 | 详细测试跨域请求 |
| SQL 注入漏洞 | 高 | 严格使用参数化查询 |
| 数据库连接池耗尽 | 中 | 配置合理的连接池大小 |

### 11.2 开发注意事项

1. **数据库连接配置**：Node.js 和 Django 共用同一数据库，确保连接参数一致
2. **主键字段**：假设所有表都有 `id` 主键（自增），如果不是需要动态获取主键字段名
3. **字段类型处理**：日期、时间、JSON 等特殊类型需要特殊处理
4. **事务处理**：更新操作需要考虑事务回滚
5. **并发控制**：多用户同时编辑同一记录的冲突处理

---

## 十二、总结

本方案采用**读写分离架构**，在保留现有 Node.js 查询功能的基础上，增加 Django 后端实现数据库的增删改操作。

**核心优势**：
- ✅ 保留现有稳定功能
- ✅ 职责清晰，易于维护
- ✅ 渐进式开发，风险可控
- ✅ 技术栈互补，发挥各自优势

**实施建议**：
1. 先完成 Django 基础搭建和单表 CRUD
2. 前端先实现一个表的完整操作流程
3. 测试通过后再推广到所有表
4. 逐步完善错误处理和用户体验

**预计工作量**：6-8 小时（熟悉 Django 的情况下）

---

## 附录：参考资料

- [Django 官方文档](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [django-cors-headers](https://github.com/adamchainz/django-cors-headers)
- [MySQL Python 驱动](https://github.com/PyMySQL/mysqlclient)
