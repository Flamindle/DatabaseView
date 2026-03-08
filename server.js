const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 全局数据库连接
let dbConnection = null;

// 1. 连接数据库接口
app.post('/connect', async (req, res) => {
  const { host, port, user, password, database } = req.body;

  try {
    // 关闭旧连接
    if (dbConnection) {
      await dbConnection.end();
      dbConnection = null;
    }

    // 创建新连接
    dbConnection = await mysql.createConnection({
      host: host || 'localhost',
      port: parseInt(port) || 3306,
      user: user || 'root',
      password: password || '',
      database: database,
      connectTimeout: 5000
    });

    // 查询表列表（纯SQL，无占位符）
    const [tables] = await dbConnection.execute(`SHOW TABLES FROM \`${database}\``);
    const tableList = tables.map(item => {
      const key = `Tables_in_${database}`;
      return item[key] || '';
    }).filter(Boolean);

    console.log(`连接成功：${host}:${port}/${database}，表列表：`, tableList);
    res.json({
      success: true,
      message: '数据库连接成功',
      tables: tableList
    });
  } catch (error) {
    console.error('连接失败：', error.message);
    res.json({
      success: false,
      message: `连接失败：${error.message}`
    });
  }
});

// 2. 查询表数据接口（完全移除??占位符）
app.post('/query-table', async (req, res) => {
  const { tableName, sortField, sortOrder } = req.body;

  // 基础校验
  if (!dbConnection) {
    return res.json({ success: false, message: '未连接数据库' });
  }
  if (!tableName || tableName.trim() === '') {
    return res.json({ success: false, message: '表名不能为空' });
  }

  try {
    // 构建排序语句（安全拼接）
    let orderBy = '';
    // 校验排序字段和方向（防止SQL注入）
    if (sortField && /^[\w\u4e00-\u9fa5]+$/.test(sortField.trim())) {
      const safeOrder = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      orderBy = ` ORDER BY \`${sortField.trim()}\` ${safeOrder}`;
    }

    // 构建最终SQL（用反引号包裹表名，无任何占位符）
    const sql = `SELECT * FROM \`${tableName.trim()}\` ${orderBy}`;
    console.log('执行的SQL：', sql);

    // 执行查询（直接执行，无参数数组）
    const [rows] = await dbConnection.execute(sql);
    const [fields] = await dbConnection.execute(`DESCRIBE \`${tableName.trim()}\``);

    res.json({
      success: true,
      fields: fields.map(f => f.Field || ''),
      data: rows
    });
  } catch (error) {
    console.error('查询失败：', error.message);
    res.json({
      success: false,
      message: `查询失败：${error.message}`
    });
  }
});

// 3. 断开连接接口
app.post('/disconnect', async (req, res) => {
  try {
    if (dbConnection) {
      await dbConnection.end();
      dbConnection = null;
    }
    res.json({ success: true, message: '已断开数据库连接' });
  } catch (error) {
    res.json({ success: false, message: `断开失败：${error.message}` });
  }
});

// 启动服务
app.listen(3000, () => {
  console.log('服务启动成功：http://localhost:3000');
});