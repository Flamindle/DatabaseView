/**
 * 连接表单组件
 * 支持 MySQL / SQLite 数据库切换
 */
import { getDatabases, connectDb } from '../../services/api.js';
import { saveConfig, loadConfig } from '../../utils/storage.js';

let elements = {};
let onTablesLoaded = null;
let currentDbType = 'mysql';

/**
 * 初始化连接表单
 */
function init(container, callbacks = {}) {
  onTablesLoaded = callbacks.onTablesLoaded;

  container.innerHTML = `
    <div class="connection-form">
      <!-- 数据库类型切换 Tab -->
      <div class="db-type-tabs">
        <button type="button" class="tab-btn active" data-type="mysql">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
          </svg>
          MySQL
        </button>
        <button type="button" class="tab-btn" data-type="sqlite">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 15l5-5 4 4 5-5 4 4"/>
          </svg>
          SQLite
        </button>
      </div>

      <!-- MySQL 表单 -->
      <div class="mysql-fields" id="mysqlFields">
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
      </div>

      <!-- SQLite 表单 -->
      <div class="sqlite-fields" id="sqliteFields" style="display:none;">
        <div class="form-group" style="flex:1;">
          <label>数据库文件</label>
          <div class="sqlite-path-row">
            <input type="text" id="sqlitePath" placeholder="例如：C:/data/test.db 或 /home/user/test.db">
            <button type="button" class="btn-secondary" id="sqliteBrowseBtn">选择文件</button>
          </div>
          <div id="sqliteFileName" class="sqlite-file-name"></div>
        </div>
        <!-- SQLite 拖拽区域（点击或拖放文件） -->
        <div class="sqlite-drop-zone" id="sqliteDropZone" style="margin-top:8px;">
          <div style="font-size:13px;color:var(--text-muted);">
            将 .db / .sqlite / .sqlite3 文件拖拽到此处
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">或点击上方按钮选择文件</div>
        </div>
        <input type="file" id="sqliteFileInput" accept=".db,.sqlite,.sqlite3" style="display:none;">
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
    sqliteFields: document.getElementById('sqliteFields'),
    sqlitePath: document.getElementById('sqlitePath'),
    sqliteBrowseBtn: document.getElementById('sqliteBrowseBtn'),
    sqliteFileName: document.getElementById('sqliteFileName'),
    sqliteDropZone: document.getElementById('sqliteDropZone'),
    sqliteFileInput: document.getElementById('sqliteFileInput'),
    connectBtn: document.getElementById('connectBtn'),
    disconnectBtn: document.getElementById('disconnectBtn'),
    debugBtn: document.getElementById('debugBtn'),
    message: document.getElementById('message')
  };

  // 读取保存的数据库类型
  const savedType = localStorage.getItem('dbType') || 'mysql';
  switchDbType(savedType);

  restoreConfig();
  bindEvents();
}

// ============================================================
// 数据库类型切换
// ============================================================
function switchDbType(type) {
  currentDbType = type;
  localStorage.setItem('dbType', type);

  // 切换 Tab 高亮
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  // 切换表单显示
  document.getElementById('mysqlFields').style.display = type === 'mysql' ? 'flex' : 'none';
  elements.sqliteFields.style.display = type === 'sqlite' ? 'flex' : 'none';

  // 清空另一个表单的状态
  if (type === 'mysql') {
    elements.sqlitePath.value = '';
    elements.sqliteFileName.textContent = '';
    elements.connectBtn.disabled = !elements.database.value;
  } else {
    elements.database.selectedIndex = 0;
    elements.database.disabled = true;
    elements.connectBtn.disabled = !elements.sqlitePath.value;
  }
}

// ============================================================
// 事件绑定
// ============================================================
function bindEvents() {
  // Tab 切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchDbType(btn.dataset.type));
  });

  // MySQL 事件
  elements.getDbBtn.addEventListener('click', handleGetDatabases);
  elements.database.addEventListener('change', () => {
    elements.connectBtn.disabled = !elements.database.value;
    saveCurrentConfig();
  });
  elements.connectBtn.addEventListener('click', handleConnect);

  // SQLite 事件
  elements.sqliteBrowseBtn.addEventListener('click', () => elements.sqliteFileInput.click());
  elements.sqliteFileInput.addEventListener('change', handleSqliteFileSelect);
  elements.sqlitePath.addEventListener('input', () => {
    elements.sqliteFileName.textContent = elements.sqlitePath.value ? elements.sqlitePath.value.split(/[/\\]/).pop() : '';
    elements.connectBtn.disabled = !elements.sqlitePath.value;
  });

  // SQLite 拖拽
  elements.sqliteDropZone.addEventListener('dragover', e => {
    e.preventDefault();
    elements.sqliteDropZone.classList.add('dragover');
  });
  elements.sqliteDropZone.addEventListener('dragleave', () => {
    elements.sqliteDropZone.classList.remove('dragover');
  });
  elements.sqliteDropZone.addEventListener('drop', e => {
    e.preventDefault();
    elements.sqliteDropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleSqliteFile(file);
  });

  // 调试
  elements.debugBtn.addEventListener('click', toggleDebugPanel);
}

function handleSqliteFileSelect(e) {
  const file = e.target.files[0];
  if (file) handleSqliteFile(file);
}

function handleSqliteFile(file) {
  const path = file.path || file.name;
  elements.sqlitePath.value = path;
  elements.sqliteFileName.textContent = file.name;
  elements.connectBtn.disabled = false;
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
// 获取数据库列表（MySQL）
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
  if (currentDbType === 'mysql') {
    await handleMysqlConnect();
  } else {
    await handleSqliteConnect();
  }
}

async function handleMysqlConnect() {
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

async function handleSqliteConnect() {
  const dbPath = elements.sqlitePath.value.trim();
  if (!dbPath) {
    showMessage('请选择 SQLite 数据库文件', false);
    return;
  }

  const params = {
    dbType: 'sqlite',
    dbPath
  };

  const result = await connectDb(params);

  if (result.success) {
    showMessage(result.message);
    elements.connectBtn.disabled = true;
    elements.disconnectBtn.disabled = false;
    window.dispatchEvent(new CustomEvent('dbTablesLoaded', {
      detail: { tables: result.tables, dbType: 'sqlite' }
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
