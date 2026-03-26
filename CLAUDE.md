# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MySQL 数据库查看工具，逐步演化为轻量级 BI 工具（类 FineBI）。

## 常用命令

```bash
npm install   # 安装依赖
npm start     # 仅启动后端（端口 3000）
npm run dev   # 同时启动后端 + Vite 开发服务器（推荐）
npm run build # 构建生产版本（输出到 dist/）
npm run preview # 预览生产构建
```

- **开发模式**：`npm run dev` 后端在 3000 端口，Vite 前端在 5173 端口
- **生产模式**：`npm run build` 后，`npm start` 仅启动后端服务，静态文件从 `dist/` 目录提供

## 技术栈

- **后端**：Node.js + Express ^4.18.2 + mysql2 ^3.6.5
- **前端**：原生 JS（ES6 模块）+ Vite 8.x
- **构建工具**：Vite（开发服务器 + 生产构建）

## 目录结构

```
DatabaseView/
├── server/                    # 后端（Express）
│   ├── index.js              # 服务入口
│   ├── db/mysql.js           # MySQL 连接管理
│   ├── routes/              # API 路由
│   │   ├── database.js      # /get-databases, /connect
│   │   └── query.js         # /query-table, /disconnect
│   ├── middleware/           # 中间件
│   └── utils/               # 工具函数
│       └── formatter.js     # 时间格式化
├── src/                      # 前端源码（Vite 构建）
│   ├── app.js               # 主入口
│   ├── services/api.js      # API 调用封装
│   ├── store/state.js       # 简单状态管理
│   ├── utils/storage.js     # localStorage 封装
│   ├── components/          # UI 组件
│   │   ├── Connection/      # 连接表单
│   │   ├── Table/           # 表格 + 字段管理
│   │   ├── Toolbar/         # 表选择器 + 查询
│   │   ├── FieldPanel/      # 自定义字段面板
│   │   └── ContextMenu/     # 右键菜单
│   └── styles/              # 全局样式
├── dist/                     # 生产构建输出
├── package.json
└── vite.config.js
```

## 后端 API

| 路由 | 方法 | 功能 |
|------|------|------|
| `/get-databases` | POST | 获取非系统数据库列表 |
| `/connect` | POST | 连接指定数据库，返回表列表 |
| `/query-table` | POST | 查询表数据，支持排序和时区格式化 |
| `/disconnect` | POST | 断开连接 |

## 已实现功能

- MySQL 数据库连接和连接持久化（localStorage）
- 表列表浏览
- 数据查询（支持字段排序）
- **字段管理**：自定义显隐（按钮面板）、拖拽调整顺序、右键菜单（隐藏/仅保留/重置）
- **列宽调整**：鼠标拖拽改变列宽
- 时间字段自动转换为中国时区
- 首列固定 + 横向滚动 + 表头固定
- 页面刷新自动恢复上次的数据库/表/数据

## 功能路线图

- [x] 阶段 1：基础设施重构（Vite 模块化）
- [ ] 阶段 2：查询增强（自定义 SQL、分页、字段搜索）
- [ ] 阶段 3：轻量级可视化（柱状图、饼图、折线图）
- [ ] 阶段 4：过滤与聚合（字段过滤器、聚合计算）
- [ ] 阶段 5：仪表板（多图表卡片、拖拽布局）
- [ ] 阶段 6：协作与导出（保存/加载、数据导出）

## 注意事项

- 仅为演示用途，**未实现** SQL 注入防护和权限控制
- 生产环境使用需补充安全措施
