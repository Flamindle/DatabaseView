# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MySQL / SQLite 数据库查看工具，逐步演化为轻量级 BI 工具（类 FineBI）。

采用**多页面架构**：
- 主页（`/`）：表格模式，查询浏览数据
- 图形模式（`/src/chart.html`）：独立的拖拽式数据可视化页面
- 仪表板（`/src/dashboard.html`）：独立的多图表仪表板页面

采用**读写分离架构**：
- Node.js 后端（端口 3000）：查询功能
- Django 后端（端口 9000）：增删改 + 用户认证功能
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

# Django 后端（增删改 API + 认证）
cd django_api
pip install -r requirements.txt  # 安装 Python 依赖
python manage.py migrate         # 初始化数据库
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
| Node.js 后端 | Express + mysql2 + sqlite3 | ^4.18 / ^3.6 / ^5.1 | 查询功能 |
| Django 后端 | Django + DRF | 4.2.x / 3.14 | 增删改 + 认证 |
| 数据库 | MySQL / SQLite3 | 5.7+ / 8.0 / 3.x | 数据存储 |

---

## 端口分配

| 服务 | 端口 | 用途 |
|------|------|------|
| Node.js | 3000 | 查询 API + 生产静态文件 |
| Django | 9000 | 增删改 API + 用户认证 |
| Vite | 5173 | 开发服务器（HMR） |

---

## 目录结构

```
DatabaseView/
├── server/                    # Node.js 后端（查询）
│   ├── index.js              # 服务入口
│   ├── db/
│   │   ├── mysql.js         # MySQL 连接管理
│   │   └── sqlite.js        # SQLite 连接管理
│   └── routes/              # API 路由
│       ├── database.js      # /get-databases, /connect（支持 MySQL + SQLite）
│       └── query.js         # /query-table, /disconnect（支持 MySQL + SQLite）
├── django_api/               # Django 后端（增删改 + 认证）
│   ├── manage.py            # Django 管理脚本
│   ├── config/              # Django 项目配置
│   │   ├── settings.py     # 配置（数据库、CORS）
│   │   └── urls.py         # 主路由
│   ├── crud_api/           # CRUD API 应用
│   │   ├── views.py       # API 视图
│   │   ├── urls.py        # API 路由
│   │   └── utils.py       # 工具函数
│   ├── .env                # 环境配置
│   ├── requirements.txt    # Python 依赖
│   └── create_auth_user.py # 创建用户脚本
├── src/                     # 前端源码（Vite 多页面构建）
│   ├── app.js              # 主页入口（表格模式）
│   ├── chart.html          # 图形模式页面入口
│   ├── chart.js            # 图形模式 JS 逻辑
│   ├── dashboard.html       # 仪表板页面入口
│   ├── dashboard.js         # 仪表板 JS 逻辑
│   ├── services/
│   │   ├── api.js         # Node.js API 调用（查询）
│   │   └── djangoApi.js   # Django API 调用（增删改 + 认证）
│   ├── components/         # UI 组件
│   │   ├── Table/          # 表格 + 字段管理
│   │   │   ├── DataTable.js
│   │   │   ├── DataTable.css
│   │   │   └── ColumnManager.js
│   │   ├── Connection/     # 连接表单
│   │   ├── Toolbar/        # 表选择器 + 查询
│   │   ├── FieldPanel/     # 自定义字段面板
│   │   ├── ContextMenu/    # 右键菜单
│   │   ├── CrudModal/      # 新增/编辑模态框
│   │   ├── Auth/           # 登录模态框
│   │   ├── Chart/          # 数据可视化（Chart.js）
│   │   │   ├── ChartView.js
│   │   │   └── ChartView.css
│   │   ├── Dashboard/      # 仪表板
│   │   │   ├── DashboardView.js
│   │   │   ├── DashboardView.css
│   │   │   ├── DashboardCard.js
│   │   │   ├── DashboardCardModal.js
│   │   │   ├── DashboardCardModal.css
│   │   │   └── DashboardUtils.js
│   │   ├── ViewMode/       # 视图模式切换（标题行按钮）
│   │   │   ├── ViewMode.js
│   │   │   └── ViewMode.css
│   │   └── Theme/          # 主题切换
│   └── styles/             # 全局样式（主题变量）
├── dist/                    # 生产构建输出
│   ├── index.html          # 主页（表格模式）
│   ├── src/chart.html       # 图形模式
│   └── src/dashboard.html    # 仪表板
└── package.json
```

---

## 后端 API

### Node.js API（查询）

所有接口通过 `dbType` 参数（`mysql` | `sqlite`）区分数据库类型：

| 路由 | 方法 | 功能 |
|------|------|------|
| `/get-databases` | POST | 获取 MySQL 非系统数据库列表 |
| `/connect` | POST | 连接 MySQL 或 SQLite，返回表列表；参数 `{dbType:'sqlite', dbPath:'...'}` |
| `/query-table` | POST | 查询表数据，支持分页、排序；参数中包含 `dbType` 区分数据库 |
| `/disconnect` | POST | 断开所有连接 |

### Django API（增删改 + 认证）

#### 认证接口

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 用户登出 |
| `/api/auth/status` | GET | 查询登录状态 |

#### 数据操作

| 路由 | 方法 | 功能 | 需登录 |
|------|------|------|--------|
| `/api/tables/{table}/records` | GET | 获取表结构 | 否 |
| `/api/tables/{table}/records` | POST | 新增记录 | 是 |
| `/api/tables/{table}/records/{id}` | PUT | 更新记录 | 是 |
| `/api/tables/{table}/records/{id}` | DELETE | 删除记录 | 是 |
| `/api/tables/{table}/records/batch` | POST | 批量删除 | 是 |

**请求头**：
- `X-Database-Name`：数据库名
- `X-DB-Host`：数据库主机
- `X-DB-Port`：数据库端口
- `X-DB-User`：数据库用户名
- `X-DB-Password`：数据库密码

**请求示例**：
```bash
# 登录
POST http://localhost:9000/api/auth/login
Content-Type: application/json
{"username": "admin", "password": "admin123"}

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
- **双数据库支持**：连接表单左上角可切换 MySQL / SQLite
  - MySQL：主机/端口/用户名/密码 + 数据库下拉选择
  - SQLite：本地 .db 文件选择器（支持拖放或点击选择） 
- 连接配置持久化到 localStorage，刷新自动恢复
- 表列表浏览 + 数据查询（分页、排序）
- **字段管理**：自定义显隐、拖拽调整顺序、右键菜单
- **列宽调整**：鼠标拖拽改变列宽
- MySQL 时间字段自动转换为中国时区
- 首列固定 + 横向滚动 + 表头固定

### 用户认证（Django）
- **Session 认证**：使用 Cookie 存储 Session
- **登录接口**：POST `/api/auth/login`
- **登出接口**：POST `/api/auth/logout`
- **状态查询**：GET `/api/auth/status`
- **前端登录按钮**：右上角，点击弹出登录模态框
- **操作拦截**：未登录用户只能查看，不能增删改

### 增删改功能（Django）
- **新增记录**：通过模态框表单新增
- **编辑记录**：点击编辑按钮修改
- **删除记录**：确认后删除
- **批量删除**：支持多选删除
- 表单自动根据字段类型渲染（文本、数字、日期、日期时间、复选框等）
- Session Cookie 认证，确保登录状态

### 界面功能
- **四套主题**：浅色、深色、护眼、粉色
- **视图模式**：全字段、自定义字段

### 数据可视化（Chart.js）

采用**多页面架构**：表格模式在主页，图形模式和仪表板各自独立页面。

#### 图形模式（`/src/chart.html`）
- **独立页面**：`window.open('/src/chart.html')`，不会遮挡主页内容
- **拖拽式字段映射**：
  - 左侧显示可用字段（自动识别文本/数值/日期类型）
  - 拖拽字段到"维度"区域（用于分类/标签）
  - 拖拽字段到"指标"区域（用于数值计算，只接受数值字段）
- **图表类型**：支持柱状图、饼图、折线图
- **实时更新**：拖拽配置后自动聚合数据并渲染图表
- **自动恢复**：从 localStorage 读取上次连接和查询的表，自动加载数据
- **返回主页**：右上角"返回主页"按钮

#### 仪表板（`/src/dashboard.html`）
- **独立页面**：`window.open('/src/dashboard.html')`
- **多图表卡片**：网格布局，每张卡片独立配置数据源
- **添加卡片**：4步向导（选表→选维度→选指标→选图表类型）
- **卡片管理**：右上角切换图表类型、编辑、删除
- **拖拽排序**：鼠标拖拽卡片手柄重新排列
- **持久化**：卡片配置存入 localStorage，刷新不丢失
- **返回主页**：右上角"返回主页"按钮

---

## Django 用户认证说明

### 认证机制
- 使用前端连接的 MySQL 数据库中的 `auth_user` 表
- Session 数据存储在本地 SQLite 数据库
- 所有增删改操作需要登录状态

### 创建用户

```bash
cd django_api
python create_auth_user.py --database 你的数据库名 --password 你的数据库密码
```

参数说明：
| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--database` | 数据库名（必填） | - |
| `--host` | MySQL 主机 | localhost |
| `--port` | MySQL 端口 | 3306 |
| `--user` | MySQL 用户名 | root |
| `--password` | MySQL 密码（必填） | - |
| `--username` | 应用用户名 | admin |
| `--password-val` | 应用用户密码 | admin123 |

### auth_user 表结构

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

---

## 功能路线图

- [x] 阶段 1：基础设施重构（Vite 模块化）
- [x] 阶段 2：查询增强（自定义 SQL、分页）
- [x] 阶段 3：增删改功能（Django 集成）
- [x] 阶段 3.5：用户认证系统（auth_user 登录）
- [x] 阶段 4：数据可视化（独立页面，拖拽式图表配置，柱状图/饼图/折线图）
- [x] 阶段 5：仪表板（独立页面，多图表卡片，拖拽布局）
- [ ] 阶段 6：协作与导出（数据导入/导出）

---

## 安全说明

- **SQL 注入防护**：Django API 使用参数化查询
- **CORS 配置**：Django 已允许 `localhost:5173` 和 `localhost:3000`
- **表名/字段名验证**：使用正则白名单验证
- **用户认证**：Session Cookie 认证，增删改需登录
- **主键假设**：默认使用 `id` 自增主键

仅为演示用途，生产环境需补充更严格的权限控制。

---

## 参考资料

- [Django 官方文档](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [django-cors-headers](https://github.com/adamchainz/django-cors-headers)
- [Chart.js](https://www.chartjs.org/) - 数据可视化
