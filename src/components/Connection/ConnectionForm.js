/**
 * 连接表单组件
 * 支持 MySQL 数据库连接
 */
import { getDatabases, connectDb } from '../../services/api.js';
import { saveConfig, loadConfig } from '../../utils/storage.js';

let elements = {};
let onTablesLoaded = null;

/**
 * 初始化连接表单
 */
function init(container, callbacks = {}) {
  onTablesLoaded = callbacks.onTablesLoaded;

  container.innerHTML = `
    <div class="connection-form">
      <div class="form-group">
        <label>主机地址</label>
        <input type="text" id="host" value="localhost" placeholder="例如：127.0.0.1">
      </div>
      <div class="form-group">
        <label>端口号</label>
        <input type="number" id="port" value="3306" placeholder="默认3306">
      </div>
      <div class="form-group">
        <label>用户名</label>
        <input type="text" id="user" value="root" placeholder="例如：root">
      </div>
      <div class="form-group">
        <label>密码</label>
        <input type="password" id="password" placeholder="数据库密码">
      </div>
      <div class="form-group">
        <label>数据库</label>
        <div class="db-select-row">
          <button type="button" class="btn-secondary" id="getDbBtn">获取列表</button>
          <select id="database" disabled>
            <option value="">请先获取数据库</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-primary" id="connectBtn" disabled>连接</button>
        <button type="button" class="btn-secondary" id="disconnectBtn" disabled>断开</button>
        <button type="button" class="btn-secondary" id="debugBtn" title="打开调试面板">调试</button>
      </div>
    </div>
    <div id="message" class="message hidden"></div>
    <div id="debugPanel" style="display:none;margin-top:16px;padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--border);">
      <div style="font-weight:600;margin-bottom:8px;">调试信息</div>
      <div id="debugContent" style="font-size:12px;font-family:monospace;white-space:pre-wrap;word-break:break-all;"></div>
    </div>
  `;

  elements = {
    host: document.getElementById('host'),
    port: document.getElementById('port'),
    user: document.getElementById('user'),
    password: document.getElementById('password'),
    database: document.getElementById('database'),
    getDbBtn: document.getElementById('getDbBtn'),
    connectBtn: document.getElementById('connectBtn'),
    disconnectBtn: document.getElementById('disconnectBtn'),
    debugBtn: document.getElementById('debugBtn'),
    message: document.getElementById('message')
  };

  restoreConfig();
  bindEvents();
}

function restoreConfig() {
  const config = loadConfig();
  if (config) {
    elements.host.value = config.host || 'localhost';
    elements.port.value = config.port || '3306';
    elements.user.value = config.user || 'root';
    elements.password.value = config.password || '';
  }
}

function bindEvents() {
  elements.getDbBtn.addEventListener('click', handleGetDatabases);
  elements.database.addEventListener('change', () => {
    elements.connectBtn.disabled = !elements.database.value;
    saveCurrentConfig();
  });
  elements.connectBtn.addEventListener('click', handleConnect);
  elements.debugBtn.addEventListener('click', toggleDebugPanel);
}

function saveCurrentConfig() {
  const config = {
    host: elements.host.value,
    port: elements.port.value,
    user: elements.user.value,
    password: elements.password.value,
    database: elements.database.value
  };
  saveConfig(config);
}

// ============================================================
// 调试面板
// ============================================================
let debugVisible = false;

function toggleDebugPanel() {
  debugVisible = !debugVisible;
  const panel = document.getElementById('debugPanel');
  if (panel) panel.style.display = debugVisible ? 'block' : 'none';
}

function showDebugInfo(info) {
  const content = document.getElementById('debugContent');
  if (content) content.textContent = typeof info === 'string' ? info : JSON.stringify(info, null, 2);
  if (!debugVisible) toggleDebugPanel();
}

function showMessage(text, isSuccess = true) {
  elements.message.textContent = text;
  elements.message.className = `message ${isSuccess ? 'success' : 'error'}`;
}

// ============================================================
// 获取数据库列表
// ============================================================
async function handleGetDatabases() {
  const params = {
    host: elements.host.value.trim(),
    port: elements.port.value.trim(),
    user: elements.user.value.trim(),
    password: elements.password.value.trim()
  };

  if (!params.host || !params.port || !params.user) {
    showMessage('请填写主机、端口、用户名', false);
    return;
  }

  saveCurrentConfig();
  const result = await getDatabases(params);

  if (result.success) {
    showMessage(result.message);
    elements.database.innerHTML = '<option value="">请选择数据库</option>';
    result.databases.forEach(db => {
      const opt = document.createElement('option');
      opt.value = db;
      opt.textContent = db;
      elements.database.appendChild(opt);
    });
    elements.database.disabled = false;
  } else {
    showMessage(result.message, false);
  }
}

// ============================================================
// 连接数据库
// ============================================================
async function handleConnect() {
  const database = elements.database.value.trim();
  if (!database) {
    showMessage('请选择数据库', false);
    return;
  }

  const params = {
    dbType: 'mysql',
    host: elements.host.value.trim(),
    port: elements.port.value.trim(),
    user: elements.user.value.trim(),
    password: elements.password.value.trim(),
    database
  };

  saveCurrentConfig();
  const result = await connectDb(params);

  if (result.success) {
    showMessage(result.message);
    elements.connectBtn.disabled = true;
    elements.disconnectBtn.disabled = false;
    window.dispatchEvent(new CustomEvent('dbTablesLoaded', {
      detail: { tables: result.tables, dbType: 'mysql' }
    }));
    if (onTablesLoaded) onTablesLoaded(result.tables);
  } else {
    showMessage(result.message, false);
  }
}

// ============================================================
// 启用断开按钮
// ============================================================
function enableDisconnect(enable = true) {
  elements.connectBtn.disabled = enable;
  elements.disconnectBtn.disabled = !enable;
}

export { init, enableDisconnect, showMessage, showDebugInfo };
