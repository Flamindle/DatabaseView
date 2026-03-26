/**
 * 数据库路由
 * 处理 /get-databases 和 /connect 接口
 */
const express = require('express');
const router = express.Router();
const { getTempConnection, getConnection } = require('../db/mysql');

/**
 * POST /get-databases
 * 获取 MySQL 服务器上的所有非系统数据库列表
 */
router.post('/get-databases', async (req, res, next) => {
  try {
    const { host, port, user, password } = req.body;

    const tempConn = await getTempConnection({ host, port, user, password });

    tempConn.query('SHOW DATABASES', (err, databases) => {
      if (err) {
        tempConn.end();
        return res.json({
          success: false,
          message: '获取数据库列表失败：' + err.message
        });
      }

      // 格式化数据库列表（排除系统数据库）
      const dbList = databases
        .map(item => item.Database)
        .filter(db => !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(db));

      tempConn.end();
      res.json({
        success: true,
        message: '获取数据库列表成功',
        databases: dbList
      });
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message
    });
  }
});

/**
 * POST /connect
 * 连接指定数据库，返回表列表
 */
router.post('/connect', async (req, res, next) => {
  try {
    const { host, port, user, password, database } = req.body;

    const conn = await getConnection({ host, port, user, password, database });

    conn.query('SHOW TABLES', (err, tables) => {
      if (err) {
        conn.end();
        return res.json({
          success: false,
          message: '获取表列表失败：' + err.message
        });
      }

      const tableList = tables.map(item => item[`Tables_in_${database}`]);
      console.log(`连接成功：${host}:${port}/${database}`);

      res.json({
        success: true,
        message: '连接数据库成功',
        tables: tableList
      });
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
