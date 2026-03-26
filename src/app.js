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
import './components/Theme/ThemeToggle.css';

import { init as initConnection } from './components/Connection/ConnectionForm.js';
import { init as initToolbar } from './components/Toolbar/TableToolbar.js';
import { init as initColumnManager } from './components/Table/ColumnManager.js';
import { init as initTheme } from './components/Theme/ThemeToggle.js';
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
  sortOrder: 'ASC',
  pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 }
};

// DOM 挂载点
const $conn = document.getElementById('connectionContainer');
const $toolbar = document.getElementById('toolbarContainer');
const $colMgr = document.getElementById('columnManagerContainer');
const $data = document.getElementById('dataContainer');

// 初始化主题切换
initTheme();


// ============================================================
// 分页点击（document 事件委托，防止 HMR 后失效）
// ============================================================
let paginationHandlerActive = false;

function ensurePaginationHandler() {
  if (paginationHandlerActive) return;
  paginationHandlerActive = true;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#paginationContainer button[data-page]');
    if (!btn || btn.classList.contains('disabled')) return;
    const newPage = parseInt(btn.dataset.page);
    if (!isNaN(newPage) && state.currentTable) {
      doQuery(state.currentTable, state.sortField, state.sortOrder, newPage);
    }
  });
}

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
async function doQuery(tableName, sortField = '', sortOrder = 'ASC', page = 1) {
  if (!tableName) return;

  state.pagination.page = page;

  try {
    const resp = await fetch('http://localhost:3000/query-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableName,
        sortField,
        sortOrder,
        page,
        pageSize: state.pagination.pageSize
      })
    });
    const result = await resp.json();

    if (result.success) {
      const tip = sortField ? `，按${sortField}${sortOrder === 'ASC' ? '升序' : '降序'}` : '';
      showMsg(`查询成功，第 ${result.pagination.page}/${result.pagination.totalPages} 页，共 ${result.pagination.total} 条记录${tip}`);
      state.lastQueryResult = { fields: result.fields, data: result.data };
      state.columnsConfig = result.fields.map(name => ({ key: name, visible: true }));
      state.sortField = sortField;
      state.sortOrder = sortOrder;
      state.pagination = result.pagination;
      renderTable();
      renderPagination();
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
      doQuery(state.currentTable, sf, so, 1); // 排序从第1页开始
    },
    onColumnsChange: (config) => {
      state.columnsConfig = config;
      renderTable();
    }
  });
}

// ============================================================
// 渲染分页控件
// ============================================================
function renderPagination() {
  const { page, pageSize, total, totalPages } = state.pagination;
  const container = document.getElementById('paginationContainer');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  // 生成分页按钮
  const pages = [];
  pages.push({ label: '«', page: 1, title: '首页', disabled: page <= 1 });
  pages.push({ label: '‹', page: page - 1, title: '上一页', disabled: page <= 1 });

  // 中间页码，最多显示 5 个
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, page + 2);
  if (end - start < 4) {
    if (start === 1) end = Math.min(totalPages, start + 4);
    else if (end === totalPages) start = Math.max(1, end - 4);
  }
  for (let i = start; i <= end; i++) {
    pages.push({ label: i, page: i, active: i === page });
  }

  pages.push({ label: '›', page: page + 1, title: '下一页', disabled: page >= totalPages });
  pages.push({ label: '»', page: totalPages, title: '末页', disabled: page >= totalPages });

  let html = `<div class="pagination-info">第 ${page}/${totalPages} 页，共 ${total} 条，每页 ${pageSize} 条</div>`;
  html += '<div class="pagination-buttons">';
  pages.forEach(p => {
    const cls = p.active ? 'active' : (p.disabled ? 'disabled' : '');
    html += `<button type="button" data-page="${p.page}" class="${cls}" title="${p.title || ''}">${p.label}</button>`;
  });
  html += '</div>';
  container.innerHTML = html;
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

// 确保分页事件处理器已绑定
ensurePaginationHandler();
