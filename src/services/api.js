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

/**
 * 仪表板专用查询
 * 自动连接数据库并查询指定表
 * @param {Object} params - {tableName, dimensions, metrics, page, pageSize}
 */
async function doQueryDashboard(params) {
  try {
    // 先连接数据库
    const dbConfig = JSON.parse(localStorage.getItem('mysql_viewer_config') || '{}');
    if (!dbConfig.database) {
      return { success: false, message: '未连接数据库' };
    }

    const connectResp = await fetch(`${API_BASE}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbConfig)
    });
    const connectResult = await connectResp.json();
    if (!connectResult.success) {
      return { success: false, message: '连接数据库失败：' + connectResult.message };
    }

    // 查询数据
    const queryResp = await fetch(`${API_BASE}/query-table`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableName: params.tableName,
        page: params.page || 1,
        pageSize: params.pageSize || 500
      })
    });
    const queryResult = await queryResp.json();

    return queryResult;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export { getDatabases, connectDb, queryTable, disconnect, doQueryDashboard };
