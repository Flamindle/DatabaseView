/**
 * 数据库路由
 * 处理 /get-databases 和 /connect 接口（MySQL + SQLite）
 */
const express = require('express');
const router = express.Router();
const mysqlDb = require('../db/mysql');
const sqliteDb = require('../db/sqlite');

/**
 * POST /get-databases
 * 获取 MySQL 服务器上的所有非系统数据库列表
 */
router.post('/get-databases', async (req, res) => {
  try {
    const { host, port, user, password } = req.body;

    const tempConn = await mysqlDb.getTempConnection({ host, port, user, password });

    tempConn.query('SHOW DATABASES', (err, databases) => {
      if (err) {
        tempConn.end();
        return res.json({
          success: false,
          message: '获取数据库列表失败：' + err.message
        });
      }

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
 * 支持 MySQL 和 SQLite（路径方式）
 */
router.post('/connect', async (req, res) => {
  const { dbType } = req.body;

  // SQLite 模式：先断开 MySQL
  if (dbType === 'sqlite') {
    const { dbPath } = req.body;

    if (!dbPath) {
      return res.json({ success: false, message: '请提供数据库文件路径' });
    }

    try {
      // 连接新数据库前，先断开旧连接
      mysqlDb.disconnectAll();
      await sqliteDb.openDb(dbPath);
      const tables = await sqliteDb.getTables();
      const tableList = tables.map(r => r.name);
      console.log(`SQLite 连接成功：${dbPath}`);

      res.json({
        success: true,
        message: '连接 SQLite 数据库成功',
        tables: tableList
      });
    } catch (err) {
      res.json({
        success: false,
        message: '连接 SQLite 失败：' + err.message
      });
    }
    return;
  }

  // MySQL 模式：先断开 SQLite
  try {
    // 连接新数据库前，先断开旧连接
    sqliteDb.closeDb();
    mysqlDb.disconnectAll();

    const { host, port, user, password, database } = req.body;

    const conn = await mysqlDb.getConnection({ host, port, user, password, database });

    conn.query('SHOW TABLES', (err, tables) => {
      if (err) {
        conn.end();
        return res.json({
          success: false,
          message: '获取表列表失败：' + err.message
        });
      }

      const tableList = tables.map(item => item[`Tables_in_${database}`]);
      console.log(`MySQL 连接成功：${host}:${port}/${database}`);

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

/**
 * POST /connect-binary
 * 通过二进制数据连接 SQLite（用于拖拽上传）
 */
router.post('/connect-binary', async (req, res) => {
  try {
    // 连接新数据库前，先断开旧连接
    mysqlDb.disconnectAll();

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    console.log(`[SQLite] 收到二进制数据: ${buffer.length} 字节`);

    await sqliteDb.openDbFromBuffer(buffer);
    const tables = await sqliteDb.getTables();
    const tableList = tables.map(r => r.name);
    console.log(`SQLite 二进制连接成功，表列表:`, tableList);

    res.json({
      success: true,
      message: '连接 SQLite 数据库成功',
      tables: tableList
    });
  } catch (err) {
    console.error('[SQLite] 二进制连接失败:', err.message);
    res.json({ success: false, message: '连接 SQLite 失败：' + err.message });
  }
});

/**
 * POST /disconnect
 * 断开数据库连接
 */
router.post('/disconnect', (req, res) => {
  mysqlDb.disconnectAll();
  sqliteDb.closeDb();
  res.json({ success: true, message: '已断开所有连接' });
});

module.exports = router;
