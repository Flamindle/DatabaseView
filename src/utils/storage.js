/**
 * localStorage 封装模块
 * 管理连接配置和字段配置的持久化
 */

// 连接配置的存储键名
const STORAGE_KEY = 'mysql_viewer_config';
// 仪表板配置的存储键名
const DASHBOARD_KEY = 'mysql_viewer_dashboard';

/**
 * 保存连接信息到 localStorage
 * @param {Object} config - 连接配置
 */
function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * 从 localStorage 读取连接信息
 * @returns {Object|null} 连接配置或 null
 */
function loadConfig() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * 保存仪表板配置到 localStorage
 * @param {Object} config - 仪表板配置
 */
function saveDashboard(config) {
  localStorage.setItem(DASHBOARD_KEY, JSON.stringify({
    version: 1,
    ...config,
    updatedAt: Date.now()
  }));
}

/**
 * 从 localStorage 读取仪表板配置
 * @returns {Object|null} 仪表板配置或 null
 */
function loadDashboard() {
  const saved = localStorage.getItem(DASHBOARD_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * 清除仪表板配置
 */
function clearDashboard() {
  localStorage.removeItem(DASHBOARD_KEY);
}

export { saveConfig, loadConfig, saveDashboard, loadDashboard, clearDashboard, STORAGE_KEY, DASHBOARD_KEY };
