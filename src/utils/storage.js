/**
 * localStorage 封装模块
 * 管理连接配置和字段配置的持久化
 */

// 连接配置的存储键名
const STORAGE_KEY = 'mysql_viewer_config';

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

export { saveConfig, loadConfig, STORAGE_KEY };
