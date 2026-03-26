/**
 * 简单状态管理模块
 * 基于发布-订阅模式的响应式状态
 */

// 状态存储
const state = {
  // 连接状态
  connection: {
    host: '',
    port: '3306',
    user: 'root',
    password: '',
    database: '',
    connected: false
  },
  // 数据库列表
  databases: [],
  // 表列表
  tables: [],
  // 当前选择的表
  currentTable: '',
  // 上一次查询结果
  lastQueryResult: null,
  // 字段配置：[{key, visible}]
  columnsConfig: [],
  // 当前视图模式：full / custom
  viewMode: 'full',
  // 当前排序
  sortField: '',
  sortOrder: 'ASC'
};

// 订阅者列表
const subscribers = [];

/**
 * 订阅状态变化
 * @param {Function} callback - 回调函数，接收 (key, newValue, oldValue)
 * @returns {Function} 取消订阅函数
 */
function subscribe(callback) {
  subscribers.push(callback);
  return () => {
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  };
}

/**
 * 更新状态
 * @param {string} key - 状态键名（支持点号分隔，如 'connection.host'）
 * @param {*} value - 新值
 */
function setState(key, value) {
  const keys = key.split('.');
  const lastKey = keys.pop();
  let target = state;

  for (const k of keys) {
    target = target[k];
  }

  const oldValue = target[lastKey];
  target[lastKey] = value;

  // 通知所有订阅者
  subscribers.forEach(cb => cb(key, value, oldValue));
}

/**
 * 获取状态
 * @param {string} key - 状态键名（支持点号分隔）
 * @returns {*} 状态值
 */
function getState(key) {
  const keys = key.split('.');
  let target = state;
  for (const k of keys) {
    target = target[k];
  }
  return target;
}

export { state, subscribe, setState, getState };
