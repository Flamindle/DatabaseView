# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MySQL 数据库查看工具，逐步演化为轻量级 BI 工具（类 FineBI）。

采用**读写分离架构**：
- Node.js 后端（端口 3000）：查询功能
- Django 后端（端口 9000）：增删改功能
- 前端（端口 5173）：统一界面

---

## 常用命令

```bash
# Node.js + 前端
npm install       # 安装依赖
npm start         # 仅启动后端（端口 3000）
npm run dev       # 同时启动后端 + Vite 开发服务器（推荐）
npm run build     # 构建生产版本（输出到 dist/）
npm run preview   # 预览生产构建

# Django 后端（增删改 API）
cd django_api
pip install -r requirements.txt  # 安装 Python 依赖
python manage.py runserver 9000  # 启动 Django 服务（端口 9000）

# 同时启动所有服务
npm run dev:all   # 启动 Node.js + Vite + Django
npm run django    # 仅启动 Django API（端口 9000）
```

---

## 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端 | 原生 JS + Vite | 8.x | 用户界面 |
| Node.js 后端 | Express + mysql2 | ^4.18 / ^3.6 | 查询功能 |
| Django 后端 | Django + DRF | 4.2.x / 3.14 | 增删改功能 |
| 数据库 | MySQL | 5.7+ / 8.0 | 数据存储 |

---

## 端口分配

| 服务 | 端口 | 用途 |
|------|------|------|
| Node.js | 3000 | 查询 API + 生产静态文件 |
| Django | 9000 | 增删改 API |
| Vite | 5173 | 开发服务器（HMR） |

---

## 目录结构

```
DatabaseView/
├── server/                    # Node.js 后端（查询）
│   ├── index.js              # 服务入口
│   ├── db/mysql.js           # MySQL 连接管理
│   └── routes/              # API 路由
│       ├── database.js      # /get-databases, /connect
│       └── query.js         # /query-table, /disconnect
├── django_api/                # Django 后端（增删改）
│   ├── manage.py             # Django 管理脚本
│   ├── config/               # Django 项目配置
│   │   ├── settings.py      # 配置（数据库、CORS）
│   │   └── urls.py          # 主路由
│   ├── crud_api/             # CRUD API 应用
│   │   ├── views.py         # API 视图
│   │   ├── urls.py          # API 路由
│   │   └── utils.py         # 工具函数
│   ├── .env                 # 环境配置
│   └── requirements.txt     # Python 依赖
├── src/                      # 前端源码（Vite 构建）
│   ├── app.js               # 主入口
│   ├── services/
│   │   ├── api.js          # Node.js API 调用（查询）
│   │   └── djangoApi.js    # Django API 调用（增删改）
│   ├── components/          # UI 组件
│   │   ├── Table/           # 表格 + 字段管理
│   │   │   ├── DataTable.js
│   │   │   ├── DataTable.css
│   │   │   └── ColumnManager.js
│   │   ├── Connection/      # 连接表单
│   │   ├── Toolbar/        # 表选择器 + 查询
│   │   ├── FieldPanel/     # 自定义字段面板
│   │   ├── ContextMenu/    # 右键菜单
│   │   ├── CrudModal/      # 新增/编辑模态框
│   │   └── Theme/          # 主题切换
│   └── styles/              # 全局样式（主题变量）
├── dist/                     # 生产构建输出
└── package.json
```

---

## 后端 API

### Node.js API（查询）

| 路由 | 方法 | 功能 |
|------|------|------|
| `/get-databases` | POST | 获取非系统数据库列表 |
| `/connect` | POST | 连接指定数据库，返回表列表 |
| `/query-table` | POST | 查询表数据，支持分页、排序 |
| `/disconnect` | POST | 断开连接 |

### Django API（增删改）

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/tables/{table}/records` | POST | 新增记录 |
| `/api/tables/{table}/records/{id}` | PUT | 更新记录 |
| `/api/tables/{table}/records/{id}` | DELETE | 删除记录 |
| `/api/tables/{table}/records` | GET | 获取表结构 |
| `/api/tables/{table}/records/batch` | POST | 批量删除 |

**请求头**：通过 `X-Database-Name` 指定要操作的数据库名

**请求示例**：
```bash
# 新增记录
POST http://localhost:9000/api/tables/users/records
X-Database-Name: mydb
Content-Type: application/json
{"data": {"name": "张三", "email": "zhangsan@example.com"}}

# 更新记录
PUT http://localhost:9000/api/tables/users/records/1
X-Database-Name: mydb
Content-Type: application/json
{"data": {"name": "李四"}}

# 删除记录
DELETE http://localhost:9000/api/tables/users/records/1
X-Database-Name: mydb
```

**响应格式**：
```json
{"success": true, "message": "操作成功", "data": {...}}
```

---

## 已实现功能

### 查询功能（Node.js）
- MySQL 数据库连接和连接持久化（localStorage）
- 表列表浏览 + 数据查询（分页、排序）
- **字段管理**：自定义显隐、拖拽调整顺序、右键菜单
- **列宽调整**：鼠标拖拽改变列宽
- 时间字段自动转换为中国时区
- 首列固定 + 横向滚动 + 表头固定
- 页面刷新自动恢复上次的数据库/表/数据

### 增删改功能（Django）
- **新增记录**：通过模态框表单新增
- **编辑记录**：点击编辑按钮修改
- **删除记录**：确认后删除
- 表单自动根据字段类型渲染（文本、数字、日期、日期时间、复选框等）

### 界面功能
- **四套主题**：浅色、深色、护眼、粉色
- **视图模式**：全字段、自定义字段

---

## Django 动态表操作

由于表结构是动态的（用户可连接任意数据库），不预定义 Django Model，使用原生 SQL：

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

---

## 功能路线图

- [x] 阶段 1：基础设施重构（Vite 模块化）
- [x] 阶段 2：查询增强（自定义 SQL、分页）
- [x] 阶段 3：增删改功能（Django 集成）
- [ ] 阶段 4：数据可视化（柱状图、饼图、折线图）
- [ ] 阶段 5：仪表板（多图表卡片、拖拽布局）
- [ ] 阶段 6：协作与导出（数据导入/导出）

---

## 安全说明

- **SQL 注入防护**：Django API 使用参数化查询
- **CORS 配置**：Django 已允许 `localhost:5173` 和 `localhost:3000`
- **表名/字段名验证**：使用正则白名单验证
- **主键假设**：默认使用 `id` 自增主键

仅为演示用途，生产环境需补充用户认证和权限控制。

---

## 参考资料

- [Django 官方文档](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [django-cors-headers](https://github.com/adamchainz/django-cors-headers)
