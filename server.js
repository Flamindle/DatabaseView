const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 数据库连接对象
let conn = null;
// 临时连接（用于获取数据库列表）
let tempConn = null;

// 新增：时间格式化函数（中国时区）
/**
 * 将UTC时间转换为中国时区（东八区）的YYYY-MM-DD HH:mm:ss格式
 * @param {String/Date} time - 原始时间（ISO格式字符串/Date对象）
 * @returns {String} 格式化后的时间字符串
 */
function formatChinaTime(time) {
  if (!time) return '';

  // 转为Date对象
  const date = new Date(time);

  // 使用中国时区格式化（东八区）
  // 方法1：手动计算东八区时间
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // 拼接为目标格式：YYYY-MM-DD HH:mm:ss
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 1. 获取MySQL服务器上的所有数据库列表
app.post('/get-databases', (req, res) => {
  const { host, port, user, password } = req.body;

  // 关闭旧的临时连接
  if (tempConn) tempConn.end();

  // 创建临时连接（不指定database，仅连接服务器）
  tempConn = mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password,
    connectTimeout: 5000
  });

  tempConn.connect((err) => {
    if (err) {
      console.error('获取数据库列表失败：', err.message);
      return res.json({
        success: false,
        message: '连接服务器失败：' + err.message
      });
    }

    // 查询所有数据库
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

      res.json({
        success: true,
        message: '获取数据库列表成功',
        databases: dbList
      });
    });
  });
});

// 2. 连接指定数据库
app.post('/connect', (req, res) => {
  const { host, port, user, password, database } = req.body;

  // 关闭旧连接
  if (conn) conn.end();

  // 创建连接（指定具体数据库）
  conn = mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password,
    database
  });

  conn.connect((err) => {
    if (err) {
      console.error('连接数据库失败：', err.message);
      return res.json({
        success: false,
        message: '连接数据库失败：' + err.message
      });
    }

    // 查询该数据库下的表列表
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
  });
});

// 3. 查询表数据（修改：格式化时间字段为中国时区）
app.post('/query-table', (req, res) => {
  const { tableName, sortField, sortOrder } = req.body;

  if (!conn) {
    return res.json({ success: false, message: '未连接数据库' });
  }

  // 构建排序语句
  let orderBy = '';
  if (sortField && sortField.trim()) {
    const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
    orderBy = ` ORDER BY \`${sortField.trim()}\` ${order}`;
  }

  // 最终SQL（纯字符串，无占位符）
  const sql = `SELECT * FROM \`${tableName.trim()}\` ${orderBy}`;
  console.log('执行的SQL：', sql);

  // 执行查询
  conn.query(sql, (err, rows, fields) => {
    if (err) {
      console.error('查询失败：', err.message);
      return res.json({ success: false, message: '查询失败：' + err.message });
    }

    // 获取字段信息
    const fieldInfo = fields.map(field => ({
      name: field.name,
      type: field.type
    }));

    // 遍历数据行，格式化所有时间类型字段
    const formattedRows = rows.map(row => {
      const newRow = {};

      // 遍历所有字段
      fieldInfo.forEach(field => {
        const fieldName = field.name;
        const fieldType = field.type;
        const value = row[fieldName];

        // 判断是否为时间类型字段并格式化
        if (value && (fieldType === 12 || fieldType === 7 || fieldType === 10 || fieldType === 11)) {
          // MySQL类型编号：
          // 7: timestamp, 10: date, 11: time, 12: datetime
          newRow[fieldName] = formatChinaTime(value);
        } else {
          newRow[fieldName] = value;
        }
      });

      return newRow;
    });

    // 提取字段名
    const fieldNames = fieldInfo.map(f => f.name);

    res.json({
      success: true,
      fields: fieldNames,
      data: formattedRows // 返回格式化后的数据
    });
  });
});

// 4. 断开连接
app.post('/disconnect', (req, res) => {
  if (conn) conn.end();
  if (tempConn) tempConn.end();
  conn = null;
  tempConn = null;
  res.json({ success: true, message: '已断开所有连接' });
});

// 启动服务
app.listen(3000, () => {
  console.log('服务运行在 http://localhost:3000');
});