/**
 * 查询路由
 * 处理 /query-table 和 /disconnect 接口
 */
const express = require('express');
const router = express.Router();
const { getConn, disconnectAll } = require('../db/mysql');
const { formatChinaTime } = require('../utils/formatter');

/**
 * POST /query-table
 * 查询表数据，支持分页、排序和时间格式化
 */
router.post('/query-table', (req, res) => {
  const { tableName, sortField, sortOrder, page = 1, pageSize = 100 } = req.body;
  const conn = getConn();

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
      console.error('计数失败：', countErr.message);
      return res.json({ success: false, message: '计数失败：' + countErr.message });
    }
    const total = countResult[0].total;

    // 带分页的查询
    const sql = `SELECT * FROM \`${tableName.trim()}\` ${orderBy} LIMIT ${size} OFFSET ${offset}`;
    console.log('执行的SQL：', sql);

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

        fieldInfo.forEach(field => {
          const fieldName = field.name;
          const fieldType = field.type;
          const value = row[fieldName];

          // 判断是否为时间类型字段并格式化
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

/**
 * POST /disconnect
 * 断开所有数据库连接
 */
router.post('/disconnect', (req, res) => {
  disconnectAll();
  res.json({ success: true, message: '已断开所有连接' });
});

module.exports = router;
