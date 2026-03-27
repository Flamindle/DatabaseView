/**
 * 后端服务入口
 * 整合所有路由和中间件
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const databaseRouter = require('./routes/database');
const queryRouter = require('./routes/query');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = 3000;

// 支持 BigInt JSON 序列化（MySQL2 返回的 BigInt 字段）
BigInt.prototype.toJSON = function() { return this.toString(); };

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/', databaseRouter);
app.use('/', queryRouter);

// 静态文件服务（生产环境使用 dist 目录）
app.use(express.static(path.join(__dirname, '../dist')));
app.use(express.static(path.join(__dirname, '../public')));

// 错误处理中间件
app.use(errorHandler);

// 启动服务
app.listen(PORT, () => {
  console.log(`服务运行在 http://localhost:${PORT}`);
});
