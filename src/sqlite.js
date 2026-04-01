/**
 * SQLite 数据库查看器 - 独立页面
 * 通过拖拽/选择文件连接本地 SQLite 数据库
 */
import './styles/global.css';
import './styles/sqlite.css';
import { init as initTheme } from './components/Theme/ThemeToggle.js';

const API_BASE = 'http://localhost:3000';

// ============================================================
// 状态
// ============================================================
const state = {
  currentTable: '',
  selectedFile: null,
  pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
  sortField: '',
  sortOrder: 'ASC'
};

// ============================================================
// 页面初始化
// ============================================================
function init() {
  // 初始化主题
  initTheme();

  // 返回按钮
  document.getElementById('backBtn').addEventListener('click', () => {
    window.close();
    window.location.href = '/';
  });

  // 绑定文件选择事件
  bindFileEvents();

  // 绑定查询事件
  bindQueryEvents();
}

// ============================================================
// 文件选择（拖拽 + 点击）
// ============================================================
function bindFileEvents() {
  const dropZone = document.getElementById('sqliteDropZone');
  const fileInput = document.getElementById('fileInput');

  // 点击选择文件
  dropZone.addEventListener('click', () => fileInput.click());

  // 拖拽悬停
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  // 拖拽放下
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // input change
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) handleFile(file);
  });
}

/**
 * 处理选择的文件
 */
function handleFile(file) {
  state.selectedFile = file;
  document.getElementById('fileNameDisplay').textContent =
    `已选择: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  console.log('[SQLite] 选择文件:', file.name);

  // 自动连接
  connectWithBinary(file);
}

// ============================================================
// 连接数据库（二进制方式）
// ============================================================
async function connectWithBinary(file) {
  console.log('[SQLite] 开始连接:', file.name);
  showMsg('正在连接...');

  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const resp = await fetch(`${API_BASE}/connect-binary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: uint8Array
    });

    const result = await resp.json();

    if (result.success) {
      showMsg(`连接成功，共 ${result.tables.length} 个表`);
      fillTableSelect(result.tables);
      document.getElementById('tableSection').style.display = '';
      document.getElementById('connectionSection').querySelector('h3').textContent =
        `已连接: ${file.name}`;
      // 隐藏拖拽区
      document.getElementById('sqliteDropZone').style.display = 'none';
    } else {
      showMsg(result.message, false);
    }
  } catch (err) {
    showMsg('连接失败：' + err.message, false);
  }
}

// ============================================================
// 填充表下拉框
// ============================================================
function fillTableSelect(tables) {
  const $select = document.getElementById('tableSelect');
  $select.innerHTML = '<option value="">请选择表</option>';
  tables.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    $select.appendChild(opt);
  });
}

// ============================================================
// 绑定查询相关事件
// ============================================================
function bindQueryEvents() {
  document.getElementById('tableSelect').addEventListener('change', (e) => {
    document.getElementById('queryBtn').disabled = !e.target.value;
  });

  document.getElementById('queryBtn').addEventListener('click', () => {
    const tableName = document.getElementById('tableSelect').value;
    if (!tableName) return;
    state.currentTable = tableName;
    state.pagination.page = 1;
    doQuery(tableName, '', 'ASC', 1);
  });

  // 分页点击（事件委托）
  document.getElementById('paginationContainer').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]');
    if (!btn || btn.disabled) return;
    const page = parseInt(btn.dataset.page);
    if (!isNaN(page)) {
      doQuery(state.currentTable, state.sortField, state.sortOrder, page);
    }
  });

  // 表头排序点击（事件委托）
  document.getElementById('dataContainer').addEventListener('click', (e) => {
    const th = e.target.closest('th[data-field]');
    if (!th) return;
    const field = th.dataset.field;
    const newOrder = (state.sortField === field && state.sortOrder === 'ASC') ? 'DESC' : 'ASC';
    state.sortField = field;
    state.sortOrder = newOrder;
    doQuery(state.currentTable, field, newOrder, 1);
  });
}

// ============================================================
// 执行查询
// ============================================================
async function doQuery(tableName, sortField = '', sortOrder = 'ASC', page = 1) {
  if (!tableName) return;

  state.pagination.page = page;
  showMsg('查询中...');

  try {
    const resp = await fetch(`${API_BASE}/query-table`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableName,
        sortField,
        sortOrder,
        page,
        pageSize: state.pagination.pageSize,
        dbType: 'sqlite'
      })
    });

    const result = await resp.json();

    if (result.success) {
      const tip = sortField ? `，按 ${sortField} ${sortOrder === 'ASC' ? '升序' : '降序'}` : '';
      showMsg(`查询成功，共 ${result.pagination.total} 条记录${tip}`);
      state.pagination = result.pagination;
      state.sortField = sortField;
      state.sortOrder = sortOrder;
      renderTable(result.fields, result.data);
      renderPagination();
      document.getElementById('dataSection').style.display = '';
      document.getElementById('dataInfo').textContent =
        `第 ${result.pagination.page}/${result.pagination.totalPages} 页，共 ${result.pagination.total} 条记录`;
    } else {
      showMsg(result.message, false);
    }
  } catch (err) {
    showMsg('查询失败：' + err.message, false);
  }
}

// ============================================================
// 渲染表格
// ============================================================
function renderTable(fields, data) {
  const $container = document.getElementById('dataContainer');

  let html = '<table><thead><tr>';
  fields.forEach(f => {
    const sortIcon = (state.sortField === f)
      ? (state.sortOrder === 'ASC' ? ' ↑' : ' ↓')
      : '';
    html += `<th data-field="${f}" style="cursor:pointer;user-select:none;">${f}${sortIcon}</th>`;
  });
  html += '</tr></thead><tbody>';

  if (data.length === 0) {
    html += '<tr><td colspan="' + fields.length + '" style="text-align:center;color:var(--text-muted);padding:24px;">暂无数据</td></tr>';
  } else {
    data.forEach(row => {
      html += '<tr>';
      fields.forEach(f => {
        const val = row[f];
        html += `<td>${val !== null ? val : '<span style="color:var(--text-muted);">NULL</span>'}</td>`;
      });
      html += '</tr>';
    });
  }

  html += '</tbody></table>';
  $container.innerHTML = html;
}

// ============================================================
// 渲染分页
// ============================================================
function renderPagination() {
  const { page, total, totalPages } = state.pagination;
  const $container = document.getElementById('paginationContainer');

  if (totalPages <= 1) {
    $container.innerHTML = '';
    return;
  }

  let html = '';
  const pages = [];
  pages.push({ label: '«', page: 1, disabled: page <= 1 });
  pages.push({ label: '‹', page: page - 1, disabled: page <= 1 });

  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, page + 2);
  if (end - start < 4) {
    if (start === 1) end = Math.min(totalPages, start + 4);
    else if (end === totalPages) start = Math.max(1, end - 4);
  }
  for (let i = start; i <= end; i++) pages.push({ label: i, page: i, active: i === page });

  pages.push({ label: '›', page: page + 1, disabled: page >= totalPages });
  pages.push({ label: '»', page: totalPages, disabled: page >= totalPages });

  html += `<span style="font-size:13px;color:var(--text-muted);margin-right:auto;">第 ${page}/${totalPages} 页，共 ${total} 条</span>`;
  html += '<div style="display:flex;gap:4px;">';
  pages.forEach(p => {
    const cls = p.active ? 'active' : (p.disabled ? 'disabled' : '');
    html += `<button type="button" data-page="${p.page}" class="${cls}" ${p.disabled ? 'disabled' : ''}>${p.label}</button>`;
  });
  html += '</div>';

  $container.innerHTML = html;
}

// ============================================================
// 消息提示
// ============================================================
let msgTimer = null;
function showMsg(text, isSuccess = true) {
  const el = document.getElementById('message');
  if (!el) return;
  el.textContent = text;
  el.className = `message ${isSuccess ? 'success' : 'error'}`;
  el.style.display = 'block';
  if (msgTimer) clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// ============================================================
// 启动
// ============================================================
document.addEventListener('DOMContentLoaded', init);
