const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 托管静态文件

// 1. 测试数据库连接并获取表列表
app.post('/connect', async (req, res) => {
  const { host, port, user, password, database } = req.body;

  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database,
      connectTimeout: 5000 // 连接超时时间5秒
    });

    // 查询数据库中的所有表
    const [tables] = await connection.execute(
      'SHOW TABLES'
    );

    // 格式化表名
    const tableList = tables.map(item => {
      const key = `Tables_in_${database}`;
      return item[key];
    });

    // 保存连接信息（简单存储，实际生产环境需优化）
    req.app.set('dbConnection', connection);

    res.json({
      success: true,
      message: '数据库连接成功',
      tables: tableList
    });
  } catch (error) {
    res.json({
      success: false,
      message: `连接失败：${error.message}`
    });
  }
});

// 2. 查询指定表的记录
app.post('/query-table', async (req, res) => {
  const { tableName } = req.body;
  const connection = req.app.get('dbConnection');

  if (!connection) {
    return res.json({
      success: false,
      message: '请先连接数据库'
    });
  }

  try {
    // 查询表数据
    const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
    // 查询表结构
    const [fields] = await connection.execute(`DESCRIBE ${tableName}`);

    res.json({
      success: true,
      fields: fields.map(f => f.Field), // 字段名列表
      data: rows
    });
  } catch (error) {
    res.json({
      success: false,
      message: `查询失败：${error.message}`
    });
  }
});

// 3. 关闭数据库连接
app.post('/disconnect', async (req, res) => {
  const connection = req.app.get('dbConnection');
  if (connection) {
    await connection.end();
    req.app.set('dbConnection', null);
  }
  res.json({ success: true, message: '已断开数据库连接' });
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});