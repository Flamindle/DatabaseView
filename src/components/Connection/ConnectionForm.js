/**
 * 连接表单组件
 */
import { getDatabases, connectDb } from '../../services/api.js';
import { saveConfig, loadConfig } from '../../utils/storage.js';
import { setState } from '../../store/state.js';

let elements = {};
let onDatabaseConnected = null;
let onTablesLoaded = null;

/**
 * 初始化连接表单
 * @param {HTMLElement} container - 挂载容器
 * @param {Object} callbacks - 回调函数
 */
function init(container, callbacks = {}) {
  onDatabaseConnected = callbacks.onDatabaseConnected;
  onTablesLoaded = callbacks.onTablesLoaded;

  // 创建表单 HTML
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
        <div style="display:flex;gap:8px;align-items:center">
          <button type="button" class="btn-secondary" id="getDbBtn">获取列表</button>
          <select id="database" disabled>
            <option value="">请先获取数据库</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-primary" id="connectBtn" disabled>连接</button>
        <button type="button" class="btn-secondary" id="disconnectBtn" disabled>断开</button>
      </div>
    </div>
    <div id="message" class="message hidden"></div>
  `;

  // 获取元素引用
  elements = {
    host: document.getElementById('host'),
    port: document.getElementById('port'),
    user: document.getElementById('user'),
    password: document.getElementById('password'),
    database: document.getElementById('database'),
    getDbBtn: document.getElementById('getDbBtn'),
    connectBtn: document.getElementById('connectBtn'),
    disconnectBtn: document.getElementById('disconnectBtn'),
    message: document.getElementById('message')
  };

  // 恢复保存的配置
  restoreConfig();

  // 绑定事件
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
  elements.connectBtn.addEventListener('click', handleConnect);
}

function showMessage(text, isSuccess = true) {
  elements.message.textContent = text;
  elements.message.className = `message ${isSuccess ? 'success' : 'error'}`;
}

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

  // 保存配置
  saveConfig(params);

  const result = await getDatabases(params);

  if (result.success) {
    showMessage(result.message);
    // 填充数据库下拉框
    elements.database.innerHTML = '<option value="">请选择数据库</option>';
    result.databases.forEach(db => {
      const option = document.createElement('option');
      option.value = db;
      option.textContent = db;
      elements.database.appendChild(option);
    });
    // 启用下拉框和连接按钮
    elements.database.disabled = false;
    elements.connectBtn.disabled = false;

    setState('databases', result.databases);
  } else {
    showMessage(result.message, false);
  }
}

async function handleConnect() {
  const params = {
    host: elements.host.value.trim(),
    port: elements.port.value.trim(),
    user: elements.user.value.trim(),
    password: elements.password.value.trim(),
    database: elements.database.value.trim()
  };

  if (!params.database) {
    showMessage('请选择数据库', false);
    return;
  }

  // 保存配置
  saveConfig(params);

  const result = await connectDb(params);

  if (result.success) {
    showMessage(result.message);
    // 更新状态
    setState('connection', {
      host: params.host,
      port: params.port,
      user: params.user,
      password: params.password,
      database: params.database,
      connected: true
    });

    if (onTablesLoaded) {
      onTablesLoaded(result.tables);
    }
  } else {
    showMessage(result.message, false);
  }
}

function enableDisconnect(enable = true) {
  elements.connectBtn.disabled = enable;
  elements.disconnectBtn.disabled = !enable;
  elements.getDbBtn.disabled = enable;
}

export { init, enableDisconnect, showMessage };
