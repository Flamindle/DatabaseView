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
import './components/CrudModal/CrudModal.css';
import './components/Auth/LoginModal.css';
import './components/ViewMode/ViewMode.css';

import { init as initConnection } from './components/Connection/ConnectionForm.js';
import { init as initToolbar, populateTables } from './components/Toolbar/TableToolbar.js';
import { init as initColumnManager } from './components/Table/ColumnManager.js';
import { init as initTheme } from './components/Theme/ThemeToggle.js';
import { init as initCrudModal, showAdd, showEdit } from './components/CrudModal/CrudModal.js';
import { init as initAuth, showLoginModal, handleLogout } from './components/Auth/LoginModal.js';
import { init as initViewMode } from './components/ViewMode/ViewMode.js';
import { buildTable, getSelectedIds } from './components/Table/DataTable.js';
import { loadConfig, saveConfig } from './utils/storage.js';
import { deleteRecord, batchDeleteRecords } from './services/djangoApi.js';

// ============================================================
// 全局状态
// ============================================================
const state = {
  connection: { host: '', port: '3306', user: 'root', password: '', database: '', connected: false },
  dbType: 'mysql',  // 'mysql' | 'sqlite'
  tables: [],
  currentTable: '',
  lastQueryResult: null,
  columnsConfig: [],
  sortField: '',
  sortOrder: 'ASC',
  pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
  isLoggedIn: false  // 登录状态
};

// DOM 挂载点
const $conn = document.getElementById('connectionContainer');
const $viewMode = document.getElementById('viewModeContainer');
const $toolbar = document.getElementById('toolbarContainer');
const $colMgr = document.getElementById('columnManagerContainer');
const $data = document.getElementById('dataContainer');

// 初始化主题切换
initTheme();

// ============================================================
// CRUD 操作成功/失败回调
// ============================================================
function onCrudSuccess(message) {
  showMsg(message, true);
  // 刷新表格数据
  if (state.currentTable) {
    doQuery(state.currentTable, state.sortField, state.sortOrder, state.pagination.page);
  }
}

function onCrudError(message) {
  showMsg(message, false);
}

// ============================================================
// 分页点击（document 事件委托）
// ============================================================
let paginationHandlerActive = false;

function ensurePaginationHandler() {
  if (paginationHandlerActive) return;
  paginationHandlerActive = true;

  document.addEventListener('click', (e) => {
    // 分页按钮
    const pageBtn = e.target.closest('#paginationContainer button[data-page]');
    if (pageBtn && !pageBtn.classList.contains('disabled')) {
      const newPage = parseInt(pageBtn.dataset.page);
      if (!isNaN(newPage) && state.currentTable) {
        doQuery(state.currentTable, state.sortField, state.sortOrder, newPage);
      }
      return;
    }

    // 表格操作按钮（编辑）
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      if (!state.isLoggedIn) {
        showMsg('请先登录后才能编辑记录', false);
        return;
      }
      console.log('[App] 点击了编辑按钮', editBtn.dataset);
      const recordId = editBtn.dataset.id;
      const recordData = JSON.parse(decodeURIComponent(editBtn.dataset.record || '{}'));
      console.log('[App] 解析的记录数据:', recordData);
      showEdit(state.currentTable, recordId, recordData);
      return;
    }

    // 表格操作按钮（删除）
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      if (!state.isLoggedIn) {
        showMsg('请先登录后才能删除记录', false);
        return;
      }
      const recordId = deleteBtn.dataset.id;
      const recordName = deleteBtn.dataset.name || `ID: ${recordId}`;
      if (confirm(`确定要删除这条记录吗？\n${recordName}`)) {
        handleDelete(recordId);
      }
      return;
    }

    // 新增记录按钮
    const addBtn = e.target.closest('#addRecordBtn');
    if (addBtn) {
      if (!state.isLoggedIn) {
        showMsg('请先登录后才能新增记录', false);
        return;
      }
      const fields = state.lastQueryResult ? state.lastQueryResult.fields : [];
      showAdd(state.currentTable, fields);
      return;
    }

    // 批量删除按钮
    const batchDeleteBtn = e.target.closest('#batchDeleteBtn');
    if (batchDeleteBtn) {
      if (!state.isLoggedIn) {
        showMsg('请先登录后才能删除记录', false);
        return;
      }
      const selectedIds = getSelectedIds();
      if (selectedIds.length === 0) {
        showMsg('请先选择要删除的记录', false);
        return;
      }
      if (confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？此操作不可恢复！`)) {
        handleBatchDelete(selectedIds);
      }
      return;
    }

    // 全表删除按钮
    const truncateBtn = e.target.closest('#truncateTableBtn');
    if (truncateBtn) {
      if (!state.isLoggedIn) {
        showMsg('请先登录后才能删除记录', false);
        return;
      }
      const total = state.pagination.total;
      if (confirm(`⚠️ 危险操作！\n\n确定要清空表 "${state.currentTable}" 的所有数据吗？\n共 ${total} 条记录将被永久删除！\n\n此操作不可恢复！`)) {
        if (confirm('再次确认：删除后数据将无法恢复，确定继续吗？')) {
          handleTruncateTable();
        }
      }
      return;
    }
  });
}

// ============================================================
// 处理删除
// ============================================================
async function handleDelete(recordId) {
  if (!state.currentTable) return;

  console.log('开始删除记录:', recordId, '表:', state.currentTable);

  try {
    const result = await deleteRecord(state.currentTable, recordId);
    console.log('删除结果:', result);
    if (result.success) {
      onCrudSuccess('删除成功');
    } else {
      onCrudError(result.message);
    }
  } catch (err) {
    console.error('删除请求失败:', err);
    onCrudError(`删除失败: ${err.message}`);
  }
}

// ============================================================
// 处理批量删除
// ============================================================
async function handleBatchDelete(ids) {
  if (!state.currentTable || ids.length === 0) return;

  console.log('开始批量删除:', ids, '表:', state.currentTable);

  try {
    const result = await batchDeleteRecords(state.currentTable, ids);
    console.log('批量删除结果:', result);
    if (result.success) {
      onCrudSuccess(`成功删除 ${ids.length} 条记录`);
    } else {
      onCrudError(result.message);
    }
  } catch (err) {
    console.error('批量删除请求失败:', err);
    onCrudError(`批量删除失败: ${err.message}`);
  }
}

// ============================================================
// 处理全表删除
// ============================================================
async function handleTruncateTable() {
  if (!state.currentTable) return;

  console.log('开始全表删除:', state.currentTable);

  try {
    // 获取所有记录的 ID
    const resp = await fetch('http://localhost:3000/query-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableName: state.currentTable,
        page: 1,
        pageSize: 10000,  // 获取所有记录
        dbType: state.dbType
      })
    });
    const result = await resp.json();

    if (!result.success) {
      onCrudError(result.message);
      return;
    }

    // 获取所有 ID
    const allIds = result.data.map(row => row.id ?? row.ID ?? row.Id).filter(id => id !== undefined);

    if (allIds.length === 0) {
      onCrudSuccess('表中没有数据');
      return;
    }

    // 批量删除所有记录
    const deleteResult = await batchDeleteRecords(state.currentTable, allIds);
    console.log('全表删除结果:', deleteResult);
    if (deleteResult.success) {
      onCrudSuccess(`已清空表 "${state.currentTable}"，共删除 ${allIds.length} 条记录`);
      // 刷新数据
      doQuery(state.currentTable, state.sortField, state.sortOrder, 1);
    } else {
      onCrudError(deleteResult.message);
    }
  } catch (err) {
    console.error('全表删除请求失败:', err);
    onCrudError(`全表删除失败: ${err.message}`);
  }
}

// ============================================================
// 消息提示
// ============================================================
let msgTimer = null;
function showMsg(text, isSuccess = true) {
  const msgEl = document.getElementById('message');
  if (msgEl) {
    msgEl.textContent = text;
    msgEl.className = `message ${isSuccess ? 'success' : 'error'}`;
    msgEl.style.display = 'block';
    if (msgTimer) clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { msgEl.style.display = 'none'; }, 4000);
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
        pageSize: state.pagination.pageSize,
        dbType: state.dbType
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

      // 触发数据加载事件，启用全表删除按钮
      window.dispatchEvent(new CustomEvent('dataLoaded'));
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
      doQuery(state.currentTable, sf, so, 1);
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

  // 按钮区域：新增 + 批量删除 + 全表删除
  let html = `<div class="action-buttons">`;
  html += `<button type="button" class="btn-primary" id="addRecordBtn">+ 新增</button>`;
  html += `<button type="button" class="btn-warning" id="batchDeleteBtn" disabled>批量删除</button>`;
  html += `<button type="button" class="btn-danger" id="truncateTableBtn" disabled>全表删除</button>`;
  html += `</div>`;

  if (totalPages > 1) {
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

    html += `<div class="pagination-info">第 ${page}/${totalPages} 页，共 ${total} 条</div>`;
    html += '<div class="pagination-buttons">';
    pages.forEach(p => {
      const cls = p.active ? 'active' : (p.disabled ? 'disabled' : '');
      html += `<button type="button" data-page="${p.page}" class="${cls}" title="${p.title || ''}">${p.label}</button>`;
    });
    html += '</div>';
  } else {
    // 少于1页，只显示总数和新增按钮
    html += `<div class="pagination-info">共 ${total} 条</div>`;
  }

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
  // 面板由 ColumnManager 内部渲染
}

function onColumnsConfigChange(config) {
  state.columnsConfig = config;
  renderTable();
}

function getColumnsConfig() {
  return state.columnsConfig;
}

// ============================================================
// 组件初始化
// ============================================================

// 连接表单（监听 dbTablesLoaded 事件，由 ConnectionForm 连接成功后触发）
initConnection($conn, {});

// 连接成功：监听 dbTablesLoaded 事件，填充工具栏表下拉框
// 注意：必须在 initConnection 调用前注册（同步执行）
window.addEventListener('dbTablesLoaded', (e) => {
  const { tables, dbType } = e.detail;
  state.tables = tables;
  state.dbType = dbType || 'mysql';
  state.connection.connected = true;
  state.currentTable = '';
  populateTables(tables);
  const cfg = loadConfig();
  if (cfg && cfg.tableName && tables.includes(cfg.tableName)) {
    const select = document.getElementById('toolbarTableSelect');
    if (select) select.value = cfg.tableName;
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

// CRUD 模态框
initCrudModal({
  onSuccess: onCrudSuccess,
  onError: onCrudError
});

// 登录模块
initAuth({
  onLoginSuccess: (userData) => {
    state.isLoggedIn = true;
    showMsg(`欢迎，${userData.username}！您已获得增删改权限`, true);
  },
  onLogoutSuccess: () => {
    state.isLoggedIn = false;
    showMsg('已退出登录', true);
  },
  onAuthChange: ({ isLoggedIn }) => {
    state.isLoggedIn = isLoggedIn;
  }
});

// 视图模式切换模块
initViewMode($viewMode);

// 登录按钮点击事件
document.getElementById('authBtn').addEventListener('click', () => {
  if (state.isLoggedIn) {
    if (confirm('确定要退出登录吗？')) {
      handleLogout();
    }
  } else {
    showLoginModal();
  }
});

// ============================================================
// 页面加载时自动恢复状态
// ============================================================
/**
 * 页面加载时自动恢复状态
 * 不再重复调用 /connect，而是依赖 ConnectionForm 的 dbTablesLoaded 事件
 * 只负责：如果已保存 tableName 则自动触发查询
 */
(function restoreState() {
  const cfg = loadConfig();
  if (!cfg || !cfg.tableName) return;

  // 等待 dbTablesLoaded 事件触发后，选中已保存的表并查询
  function tryRestore() {
    const tableSelect = document.getElementById('toolbarTableSelect');
    if (!tableSelect || tableSelect.options.length <= 1) {
      // 表还没加载完，稍后再试
      setTimeout(tryRestore, 200);
      return;
    }
    const tables = Array.from(tableSelect.options).map(o => o.value).filter(v => v);
    if (tables.includes(cfg.tableName)) {
      tableSelect.value = cfg.tableName;
      doQuery(cfg.tableName, '', 'ASC');
    }
  }

  // 延迟执行，确保组件已初始化
  setTimeout(tryRestore, 500);
})();

// 确保事件处理器已绑定
ensurePaginationHandler();

// 监听选中行变化，更新批量删除按钮状态
window.addEventListener('tableSelectionChange', () => {
  const selectedIds = getSelectedIds();
  const batchBtn = document.getElementById('batchDeleteBtn');
  if (batchBtn) {
    batchBtn.disabled = selectedIds.length === 0;
    batchBtn.textContent = selectedIds.length > 0 ? `批量删除 (${selectedIds.length})` : '批量删除';
  }
});

// 页面有数据时启用全表删除按钮
window.addEventListener('dataLoaded', () => {
  const truncateBtn = document.getElementById('truncateTableBtn');
  if (truncateBtn && state.pagination.total > 0) {
    truncateBtn.disabled = false;
  }
});
