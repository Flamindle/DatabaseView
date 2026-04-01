/**
 * SQLite 数据库连接管理
 * 使用 sql.js（纯 WebAssembly，无需 C++ 编译）
 */
const fs = require('fs');
const initSqlJs = require('sql.js');

let db = null;
let currentDbPath = null; // 记录当前数据库来源：路径字符串 或 '(binary)'
let SQL = null; // sql.js 初始化后的 SQLite 对象

// 初始化 SQL 对象
async function ensureSql() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

/**
 * 打开 SQLite 数据库文件
 * @param {string} filePath - 数据库文件路径
 */
async function openDb(filePath) {
  await ensureSql();
  if (db) {
    db.close();
    db = null;
  }
  const fileBuffer = fs.readFileSync(filePath);
  db = new SQL.Database(fileBuffer);
  currentDbPath = filePath;
  return db;
}

/**
 * 从二进制数据打开数据库（用于拖拽上传）
 * @param {Buffer} buffer - 数据库文件二进制数据
 */
async function openDbFromBuffer(buffer) {
  await ensureSql();
  if (db) {
    db.close();
    db = null;
  }
  db = new SQL.Database(buffer);
  currentDbPath = '(binary)';
  return db;
}

/**
 * 执行 SQL 查询
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数数组
 * @returns {Promise<Array>} 查询结果
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) {
      return reject(new Error('未打开数据库'));
    }
    try {
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      resolve(rows);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 获取所有表名
 * @returns {Promise<Array>} 表列表
 */
function getTables() {
  return query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
}

/**
 * 获取表字段信息
 * @param {string} tableName - 表名
 * @returns {Promise<Array>} 字段列表
 */
function getTableInfo(tableName) {
  return query(`PRAGMA table_info("${tableName}")`);
}

/**
 * 关闭数据库连接
 */
function closeDb() {
  if (db) {
    db.close();
    db = null;
    currentDbPath = null;
  }
}

/**
 * 获取当前连接状态
 */
function isConnected() {
  return db !== null;
}

/**
 * 获取当前数据库来源描述
 */
function getDbSource() {
  return currentDbPath;
}

module.exports = {
  openDb,
  openDbFromBuffer,
  query,
  getTables,
  getTableInfo,
  closeDb,
  isConnected,
  getDbSource
};
