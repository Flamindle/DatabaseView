/**
 * Django CRUD API 服务
 * 用于数据库记录的增删改操作
 */
const DJANGO_BASE_URL = 'http://localhost:9000/api';
const STORAGE_KEY = 'mysql_viewer_config';

/**
 * 获取请求头
 */
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  // 从 localStorage 获取当前数据库连接配置
  const config = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  console.log('[Django API] 读取配置:', config);
  if (config.database) {
    headers['X-Database-Name'] = config.database;
  }
  if (config.host) {
    headers['X-DB-Host'] = config.host;
  }
  if (config.port) {
    headers['X-DB-Port'] = config.port;
  }
  if (config.user) {
    headers['X-DB-User'] = config.user;
  }
  if (config.password !== undefined) {
    headers['X-DB-Password'] = config.password || '';
  }
  return headers;
}

/**
 * 新增记录
 * @param {string} tableName - 表名
 * @param {Object} data - 要插入的数据
 * @returns {Promise<Object>}
 */
export async function createRecord(tableName, data) {
  try {
    const resp = await fetch(`${DJANGO_BASE_URL}/tables/${tableName}/records`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ data })
    });
    return await resp.json();
  } catch (err) {
    return { success: false, message: `请求失败: ${err.message}` };
  }
}

/**
 * 更新记录
 * @param {string} tableName - 表名
 * @param {number|string} id - 记录 ID
 * @param {Object} data - 要更新的数据
 * @returns {Promise<Object>}
 */
export async function updateRecord(tableName, id, data) {
  try {
    const resp = await fetch(`${DJANGO_BASE_URL}/tables/${tableName}/records/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ data })
    });
    return await resp.json();
  } catch (err) {
    return { success: false, message: `请求失败: ${err.message}` };
  }
}

/**
 * 删除记录
 * @param {string} tableName - 表名
 * @param {number|string} id - 记录 ID
 * @returns {Promise<Object>}
 */
export async function deleteRecord(tableName, id) {
  try {
    const resp = await fetch(`${DJANGO_BASE_URL}/tables/${tableName}/records/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await resp.json();
  } catch (err) {
    return { success: false, message: `请求失败: ${err.message}` };
  }
}

/**
 * 批量删除记录
 * @param {string} tableName - 表名
 * @param {Array} ids - 记录 ID 数组
 * @returns {Promise<Object>}
 */
export async function batchDeleteRecords(tableName, ids) {
  try {
    const resp = await fetch(`${DJANGO_BASE_URL}/tables/${tableName}/records/batch`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ids })
    });
    return await resp.json();
  } catch (err) {
    return { success: false, message: `请求失败: ${err.message}` };
  }
}

/**
 * 获取单条记录
 * @param {string} tableName - 表名
 * @param {number|string} id - 记录 ID
 * @returns {Promise<Object>}
 */
export async function getRecord(tableName, id) {
  try {
    const resp = await fetch(`${DJANGO_BASE_URL}/tables/${tableName}/records/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return await resp.json();
  } catch (err) {
    return { success: false, message: `请求失败: ${err.message}` };
  }
}

/**
 * 获取表结构
 * @param {string} tableName - 表名
 * @returns {Promise<Object>}
 */
export async function getTableSchema(tableName) {
  try {
    const resp = await fetch(`${DJANGO_BASE_URL}/tables/${tableName}/records`, {
      method: 'GET',
      headers: getHeaders()
    });
    return await resp.json();
  } catch (err) {
    return { success: false, message: `请求失败: ${err.message}` };
  }
}
