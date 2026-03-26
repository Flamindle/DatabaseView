/**
 * 应用主入口
 * 整合所有组件，统一管理状态
 */
import './styles/global.css';
import './components/Connection/ConnectionForm.css';
import './components/Table/DataTable.css';
import './components/Toolbar/TableToolbar.css';
import './components/FieldPanel/FieldPanel.css';
import './components/ContextMenu/ContextMenu.css';

import { init as initConnection } from './components/Connection/ConnectionForm.js';
import { init as initToolbar } from './components/Toolbar/TableToolbar.js';
import { init as initColumnManager } from './components/Table/ColumnManager.js';
import { buildTable } from './components/Table/DataTable.js';
import { loadConfig, saveConfig } from './utils/storage.js';

// ============================================================
// 全局状态
// ============================================================
const state = {
  connection: { host: '', port: '3306', user: 'root', password: '', database: '', connected: false },
  tables: [],
  currentTable: '',
  lastQueryResult: null,
  columnsConfig: [],
  sortField: '',
  sortOrder: 'ASC'
};

// DOM 挂载点
const $conn = document.getElementById('connectionContainer');
const $toolbar = document.getElementById('toolbarContainer');
const $colMgr = document.getElementById('columnManagerContainer');
const $data = document.getElementById('dataContainer');

// ============================================================
// 消息提示
// ============================================================
function showMsg(text, isSuccess = true) {
  const msgEl = document.getElementById('message');
  if (msgEl) {
    msgEl.textContent = text;
    msgEl.className = `message ${isSuccess ? 'success' : 'error'}`;
  }
}

// ============================================================
// 查询数据
// ============================================================
async function doQuery(tableName, sortField = '', sortOrder = 'ASC') {
  if (!tableName) return;

  try {
    const resp = await fetch('http://localhost:3000/query-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName, sortField, sortOrder })
    });
    const result = await resp.json();

    if (result.success) {
      const tip = sortField ? `，按${sortField}${sortOrder === 'ASC' ? '升序' : '降序'}` : '';
      showMsg(`查询成功，共 ${result.data.length} 条记录${tip}`);
      state.lastQueryResult = { fields: result.fields, data: result.data };
      state.columnsConfig = result.fields.map(name => ({ key: name, visible: true }));
      state.sortField = sortField;
      state.sortOrder = sortOrder;
      renderTable();
    } else {
      showMsg(result.message, false);
      $data.innerHTML = '';
    }
  } catch (err) {
    showMsg(`查询请求失败：${err.message}`, false);
    $data.innerHTML = '';
  }
}

// ============================================================
// 渲染表格
// ============================================================
function renderTable() {
  if (!state.lastQueryResult) return;
  const { fields, data } = state.lastQueryResult;
  buildTable($data, fields, data, state.columnsConfig, {
    onSortChange: (sf, so) => {
      state.sortField = sf;
      state.sortOrder = so;
      doQuery(state.currentTable, sf, so);
    },
    onColumnsChange: (config) => {
      state.columnsConfig = config;
      renderTable();
    }
  });
}

// ============================================================
// 视图模式
// ============================================================
function onViewModeFull() {
  state.columnsConfig.forEach(c => { c.visible = true; });
  renderTable();
}

function onViewModeCustom() {
  // 面板由 ColumnManager 内部渲染，内部回调会触发 onColumnsConfigChange
}

function onColumnsConfigChange(config) {
  state.columnsConfig = config;
  renderTable();
}

function getColumnsConfig() {
  return state.columnsConfig;
}

// ============================================================
// 组件初始化（每个只执行一次）
// ============================================================

// 连接表单
initConnection($conn, {
  onTablesLoaded(tables) {
    state.tables = tables;
    state.connection.connected = true;

    // 填充表列表
    const tableSelect = document.getElementById('tableSelect');
    const queryBtn = document.getElementById('queryBtn');
    if (tableSelect) {
      tableSelect.innerHTML = '<option value="">请选择表</option>';
      tables.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        tableSelect.appendChild(opt);
      });
      tableSelect.disabled = false;
      if (queryBtn) queryBtn.disabled = false;

      // 恢复上次的表
      const cfg = loadConfig();
      if (cfg && cfg.tableName && tables.includes(cfg.tableName)) {
        tableSelect.value = cfg.tableName;
      }
    }
  }
});

// 工具栏
initToolbar($toolbar, {
  onQuery(tableName) {
    if (!tableName) return;
    state.currentTable = tableName;
    state.sortField = '';
    state.sortOrder = 'ASC';
    const cfg = loadConfig() || {};
    saveConfig({ ...cfg, tableName });
    doQuery(tableName, '', 'ASC');
  }
});

// 列管理器
initColumnManager($colMgr, {
  onViewModeFull,
  onViewModeCustom,
  getColumnsConfig,
  onColumnsConfigChange
});

// ============================================================
// 页面加载时自动恢复状态
// ============================================================
(async function restoreState() {
  const cfg = loadConfig();
  if (!cfg || !cfg.host) return;

  try {
    const dbResp = await fetch('http://localhost:3000/get-databases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password || '' })
    });
    const dbResult = await dbResp.json();
    if (!dbResult.success) return;

    // 填充数据库下拉框
    const databaseSelect = document.getElementById('database');
    if (databaseSelect) {
      databaseSelect.innerHTML = '<option value="">请选择数据库</option>';
      dbResult.databases.forEach(db => {
        const opt = document.createElement('option');
        opt.value = db;
        opt.textContent = db;
        databaseSelect.appendChild(opt);
      });
      databaseSelect.disabled = false;
      const connectBtn = document.getElementById('connectBtn');
      if (connectBtn) connectBtn.disabled = false;

      if (cfg.database && dbResult.databases.includes(cfg.database)) {
        databaseSelect.value = cfg.database;
      } else {
        return;
      }
    }

    // 自动连接
    const connResp = await fetch('http://localhost:3000/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password || '', database: cfg.database })
    });
    const connResult = await connResp.json();
    if (!connResult.success) return;

    // 填充表列表
    const tableSelect = document.getElementById('tableSelect');
    const queryBtn = document.getElementById('queryBtn');
    if (tableSelect) {
      tableSelect.innerHTML = '<option value="">请选择表</option>';
      connResult.tables.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        tableSelect.appendChild(opt);
      });
      tableSelect.disabled = false;
      if (queryBtn) queryBtn.disabled = false;

      if (cfg.tableName && connResult.tables.includes(cfg.tableName)) {
        tableSelect.value = cfg.tableName;
        setTimeout(() => doQuery(cfg.tableName, '', 'ASC'), 100);
      }
    }

  } catch (e) {
    // 静默失败
  }
})();
