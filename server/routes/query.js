/**
 * 查询路由
 * 处理 /query-table 和 /disconnect 接口（MySQL + SQLite）
 */
const express = require('express');
const router = express.Router();
const mysqlDb = require('../db/mysql');
const sqliteDb = require('../db/sqlite');
const { formatChinaTime } = require('../utils/formatter');

/**
 * POST /query-table
 * 查询表数据，支持分页、排序和时间格式化
 */
router.post('/query-table', async (req, res) => {
  const { tableName, sortField, sortOrder, page = 1, pageSize = 100, dbType } = req.body;

  // ============================================================
  // SQLite 优先：只要 SQLite 已连接就走 SQLite
  // ============================================================
  if (sqliteDb.isConnected()) {
    try {
      const currentPage = Math.max(1, parseInt(page) || 1);
      const size = Math.min(1000, Math.max(1, parseInt(pageSize) || 50));
      const offset = (currentPage - 1) * size;

      // 查总数
      const countResult = await sqliteDb.query(`SELECT COUNT(*) as total FROM "${tableName}"`);
      const total = countResult[0].total;

      // 排序
      let orderBy = '';
      if (sortField && sortField.trim()) {
        const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
        orderBy = ` ORDER BY "${sortField.trim()}" ${order}`;
      }

      // 查询数据
      const sql = `SELECT * FROM "${tableName}"${orderBy} LIMIT ${size} OFFSET ${offset}`;
      const rows = await sqliteDb.query(sql);

      // 提取字段名
      const fields = rows.length > 0 ? Object.keys(rows[0]) : [];

      return res.json({
        success: true,
        fields,
        data: rows,
        pagination: {
          page: currentPage,
          pageSize: size,
          total,
          totalPages: Math.ceil(total / size)
        }
      });
    } catch (err) {
      return res.json({ success: false, message: 'SQLite 查询失败：' + err.message });
    }
  }

  // ============================================================
  // MySQL 模式
  // ============================================================
  const conn = mysqlDb.getConn();
  if (!conn) {
    return res.json({ success: false, message: '未连接数据库' });
  }

  // 构建排序语句
  let orderBy = '';
  if (sortField && sortField.trim()) {
    const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
    orderBy = ` ORDER BY \`${sortField.trim()}\` ${order}`;
  }

  // 解析分页参数
  const currentPage = Math.max(1, parseInt(page) || 1);
  const size = Math.min(1000, Math.max(1, parseInt(pageSize) || 50));
  const offset = (currentPage - 1) * size;

  // 先查总数
  conn.query(`SELECT COUNT(*) as total FROM \`${tableName.trim()}\``, (countErr, countResult) => {
    if (countErr) {
      return res.json({ success: false, message: '计数失败：' + countErr.message });
    }
    const total = countResult[0].total;

    // 带分页的查询
    const sql = `SELECT * FROM \`${tableName.trim()}\` ${orderBy} LIMIT ${size} OFFSET ${offset}`;

    conn.query(sql, (err, rows, fields) => {
      if (err) {
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

        fieldInfo.forEach(field => {
          const fieldName = field.name;
          const fieldType = field.type;
          const value = row[fieldName];

          // MySQL类型编号：7=timestamp, 10=date, 11=time, 12=datetime
          if (value && (fieldType === 12 || fieldType === 7 || fieldType === 10 || fieldType === 11)) {
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
        data: formattedRows,
        pagination: {
          page: currentPage,
          pageSize: size,
          total,
          totalPages: Math.ceil(total / size)
        }
      });
    });
  });
});

module.exports = router;
