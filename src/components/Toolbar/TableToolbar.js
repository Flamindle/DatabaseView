/**
 * 表格工具栏组件
 * 负责：表选择下拉框 + 查询按钮
 * 查询逻辑由 app.js 通过 init() 回调处理
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
      <select id="tableSelect">
        <option value="">请选择表</option>
      </select>
      <button type="button" class="btn-primary" id="queryBtn" disabled>查询</button>
    </div>
  `;

  $tableSelect = document.getElementById('tableSelect');
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

export { init };
