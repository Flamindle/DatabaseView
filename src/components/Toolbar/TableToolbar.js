/**
 * 表格工具栏组件
 * 负责：表选择下拉框 + 查询按钮
 */
import { saveConfig, loadConfig } from '../../utils/storage.js';

let callbacks = { onQuery: () => {} };
let $tableSelect = null;
let $queryBtn = null;

/**
 * 初始化工具栏
 * @param {HTMLElement} container - 挂载容器
 * @param {Object} cbs - 回调
 */
function init(container, cbs) {
  callbacks = { ...callbacks, ...cbs };

  container.innerHTML = `
    <div class="table-selector" id="tableSection">
      <label>选择数据表</label>
      <select id="toolbarTableSelect">
        <option value="">请选择表</option>
      </select>
      <button type="button" class="btn-primary" id="queryBtn" disabled>查询</button>
    </div>
  `;

  $tableSelect = document.getElementById('toolbarTableSelect');
  $queryBtn = document.getElementById('queryBtn');

  $tableSelect.addEventListener('change', () => {
    const tableName = $tableSelect.value;
    const cfg = loadConfig();
    if (tableName && cfg) {
      saveConfig({ ...cfg, tableName });
    }
  });

  $queryBtn.addEventListener('click', () => {
    const tableName = $tableSelect.value;
    if (!tableName) return;
    callbacks.onQuery(tableName);
  });
}

/**
 * 填充表下拉列表
 * 由 ConnectionForm 连接成功后调用
 * @param {string[]} tables - 表名数组
 */
function populateTables(tables) {
  // 直接从 DOM 获取元素，避免闭包捕获时机问题
  const tableSelect = document.getElementById('toolbarTableSelect');
  const queryBtn = document.getElementById('queryBtn');
  if (!tableSelect) return;
  tableSelect.innerHTML = '<option value="">请选择表</option>';
  tables.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    tableSelect.appendChild(opt);
  });
  tableSelect.disabled = false;
  if (queryBtn) queryBtn.disabled = false;
}

export { init, populateTables };
