/**
 * MySQL 连接管理模块
 * 管理主连接（conn）和临时连接（tempConn）
 */
const mysql = require('mysql2');

// 主连接对象（连接指定数据库）
let conn = null;
// 临时连接对象（仅用于获取数据库列表）
let tempConn = null;

/**
 * 获取临时连接（用于获取数据库列表）
 * @param {Object} config - 连接配置 {host, port, user, password}
 * @returns {Promise} 连接成功返回连接对象，失败抛出错误
 */
function getTempConnection(config) {
  return new Promise((resolve, reject) => {
    // 关闭旧的临时连接
    if (tempConn) {
      try { tempConn.end(); } catch (e) {}
      tempConn = null;
    }

    tempConn = mysql.createConnection({
      host: config.host,
      port: parseInt(config.port),
      user: config.user,
      password: config.password,
      connectTimeout: 5000
    });

    tempConn.connect((err) => {
      if (err) {
        reject(new Error('连接服务器失败：' + err.message));
      } else {
        resolve(tempConn);
      }
    });
  });
}

/**
 * 获取主连接（连接指定数据库）
 * @param {Object} config - 连接配置 {host, port, user, password, database}
 * @returns {Promise} 连接成功返回 {connection, tables}，失败抛出错误
 */
function getConnection(config) {
  return new Promise((resolve, reject) => {
    // 关闭旧连接
    if (conn) {
      try { conn.end(); } catch (e) {}
      conn = null;
    }

    conn = mysql.createConnection({
      host: config.host,
      port: parseInt(config.port),
      user: config.user,
      password: config.password,
      database: config.database
    });

    conn.connect((err) => {
      if (err) {
        reject(new Error('连接数据库失败：' + err.message));
      } else {
        resolve(conn);
      }
    });
  });
}

/**
 * 获取主连接对象（供 query.js 使用）
 */
function getConn() {
  return conn;
}

/**
 * 断开所有连接
 */
function disconnectAll() {
  if (conn) {
    try { conn.end(); } catch (e) {}
    conn = null;
  }
  if (tempConn) {
    try { tempConn.end(); } catch (e) {}
    tempConn = null;
  }
}

module.exports = {
  getTempConnection,
  getConnection,
  getConn,
  disconnectAll
};
