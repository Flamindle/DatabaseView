# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个极简的 MySQL 数据库查看工具（MySQL Viewer），用于连接 MySQL 服务器并浏览表数据。

## 常用命令

```bash
npm install   # 安装依赖
npm start     # 启动服务器
```

启动后访问 http://localhost:3000

## 技术栈

- **后端**：Node.js + Express ^4.18.2
- **数据库驱动**：mysql2 ^3.6.5
- **前端**：原生 HTML/CSS/JavaScript（无框架）

## 架构

项目仅有两个核心文件：
- `server.js` - Express 后端服务器（监听 3000 端口）
- `index.html` - 前端页面（含 HTML/CSS/JS）

后端提供 4 个 API 接口：
| 路由 | 方法 | 功能 |
|------|------|------|
| `/get-databases` | POST | 获取非系统数据库列表 |
| `/connect` | POST | 连接指定数据库，返回表列表 |
| `/query-table` | POST | 查询表数据，支持字段排序和时区格式化 |
| `/disconnect` | POST | 断开连接 |

## 已实现功能

- MySQL 数据库连接
- 表列表浏览
- 数据查询和分页展示
- 点击表头字段排序（ASC/DESC）
- 时间字段自动转换为中国时区（东八区 `YYYY-MM-DD HH:mm:ss`）

## 注意事项

- 仅为演示用途，**未实现** SQL 注入防护和权限控制
- 生产环境使用需补充安全措施
