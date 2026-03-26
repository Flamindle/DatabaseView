/**
 * API 服务层
 * 封装所有后端 API 调用
 */

const API_BASE = 'http://localhost:3000';

/**
 * 通用请求封装
 */
async function request(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 获取数据库列表
 * @param {Object} params - {host, port, user, password}
 */
function getDatabases(params) {
  return request(`${API_BASE}/get-databases`, {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

/**
 * 连接数据库
 * @param {Object} params - {host, port, user, password, database}
 */
function connectDb(params) {
  return request(`${API_BASE}/connect`, {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

/**
 * 查询表数据
 * @param {Object} params - {tableName, sortField, sortOrder}
 */
function queryTable(params) {
  return request(`${API_BASE}/query-table`, {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

/**
 * 断开数据库连接
 */
function disconnect() {
  return request(`${API_BASE}/disconnect`, {
    method: 'POST'
  });
}

export { getDatabases, connectDb, queryTable, disconnect };
