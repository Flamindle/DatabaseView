/**
 * 数据表格组件
 */
import { showHeaderContextMenu } from '../ContextMenu/HeaderMenu.js';

let currentSortField = '';
let currentSortOrder = 'ASC';
let columnsConfig = [];
let onSortChange = null;

/**
 * 构建表格 HTML 并绑定事件
 * @param {HTMLElement} container - 挂载容器
 * @param {Array} fields - 字段名数组
 * @param {Array} data - 数据数组
 * @param {Array} config - 字段配置 [{key, visible}]
 * @param {Object} callbacks - 回调函数
 */
function buildTable(container, fields, data, config, callbacks = {}) {
  columnsConfig = config;
  onSortChange = callbacks.onSortChange;

  // 按配置过滤字段
  let effectiveFields = fields;
  if (config && config.length) {
    const visibleOrderKeys = config
      .filter(col => col.visible !== false && fields.includes(col.key))
      .map(col => col.key);
    effectiveFields = visibleOrderKeys;
  }

  const isWideTable = effectiveFields.length > 5;
  let tableHtml = `<div class="table-wrapper"><table>`;

  // 表头
  tableHtml += '<tr>';
  effectiveFields.forEach(field => {
    const sortClass = field === currentSortField ? currentSortOrder.toLowerCase() : '';
    tableHtml += `<th class="${sortClass}" data-field="${field}" draggable="true">
      <span class="th-text">${field}</span>
      <span class="col-resizer"></span>
    </th>`;
  });
  // 操作列
  tableHtml += '<th class="action-column">操作</th>';
  tableHtml += '</tr>';

  // 数据行
  data.forEach(row => {
    tableHtml += '<tr>';
    effectiveFields.forEach(field => {
      tableHtml += `<td>${row[field] ?? ''}</td>`;
    });
    // 操作按钮
    const recordId = row.id ?? row.ID ?? Object.values(row)[0] ?? '';
    const recordName = row.name ?? row.title ?? row.username ?? `#${recordId}`;
    const recordData = encodeURIComponent(JSON.stringify(row));
    tableHtml += `<td class="action-cell">
      <button type="button" class="btn-edit" data-id="${recordId}" data-record="${recordData}" data-name="${recordName}" title="编辑">编辑</button>
      <button type="button" class="btn-delete" data-id="${recordId}" data-name="${recordName}" title="删除">删除</button>
    </td>`;
    tableHtml += '</tr>';
  });
  tableHtml += '</table></div>';

  // 添加字段数量提示
  const countClass = isWideTable ? 'column-count warning' : 'column-count';
  const countTip = isWideTable
    ? `⚠️ 表格字段较多（${effectiveFields.length}个），可横向滚动查看更多`
    : `共 ${effectiveFields.length} 个字段，${data.length} 条记录`;
  container.innerHTML = `<div class="${countClass}">${countTip}</div>` + tableHtml;

  const table = container.querySelector('table');
  if (!table) return;

  // 绑定表头事件
  let dragStartKey = null;
  table.querySelectorAll('th[data-field]').forEach(th => {
    const fieldName = th.dataset.field;

    // 点击排序
    th.addEventListener('click', (e) => {
      if (e.target.classList.contains('col-resizer')) return;
      if (fieldName === currentSortField) {
        currentSortOrder = currentSortOrder === 'ASC' ? 'DESC' : 'ASC';
      } else {
        currentSortField = fieldName;
        currentSortOrder = 'ASC';
      }
      if (callbacks.onSortChange) {
        callbacks.onSortChange(currentSortField, currentSortOrder);
      }
    });

    // 右键菜单
    th.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showHeaderContextMenu(e.pageX, e.pageY, fieldName, columnsConfig, () => {
        if (callbacks.onColumnsChange) {
          callbacks.onColumnsChange(columnsConfig);
        }
      });
    });

    // 拖拽调整顺序
    th.addEventListener('dragstart', (e) => {
      dragStartKey = fieldName;
      e.dataTransfer.effectAllowed = 'move';
      th.classList.add('drag-source');
    });

    th.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      th.classList.add('drag-over');
    });

    th.addEventListener('dragleave', () => {
      th.classList.remove('drag-over');
    });

    th.addEventListener('drop', (e) => {
      e.preventDefault();
      th.classList.remove('drag-over');
      const targetKey = fieldName;
      if (!dragStartKey || dragStartKey === targetKey || !columnsConfig || !columnsConfig.length) return;

      const fromIndex = columnsConfig.findIndex(c => c.key === dragStartKey);
      const toIndex = columnsConfig.findIndex(c => c.key === targetKey);
      if (fromIndex === -1 || toIndex === -1) return;

      const [moved] = columnsConfig.splice(fromIndex, 1);
      columnsConfig.splice(toIndex, 0, moved);

      dragStartKey = null;
      if (callbacks.onColumnsChange) {
        callbacks.onColumnsChange(columnsConfig);
      }
    });

    th.addEventListener('dragend', () => {
      th.classList.remove('drag-source');
    });
  });

  // 启用列宽拖拽
  enableColumnResize(table);
}

function enableColumnResize(table) {
  if (!table) return;
  const ths = table.querySelectorAll('th');
  ths.forEach((th, index) => {
    const resizer = th.querySelector('.col-resizer');
    if (!resizer) return;

    let startX = 0;
    let startWidth = 0;

    const onMouseDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.pageX;
      startWidth = th.offsetWidth;

      const onMouseMove = (moveEvent) => {
        const delta = moveEvent.pageX - startX;
        const newWidth = Math.max(startWidth + delta, 60);
        setColumnWidth(table, index, newWidth);
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    resizer.addEventListener('mousedown', onMouseDown);
  });
}

function setColumnWidth(table, colIndex, width) {
  const px = width + 'px';
  const rows = table.querySelectorAll('tr');
  rows.forEach(row => {
    const cell = row.children[colIndex];
    if (cell) {
      cell.style.width = px;
      cell.style.minWidth = px;
      cell.style.maxWidth = px;
    }
  });
}

function resetSort() {
  currentSortField = '';
  currentSortOrder = 'ASC';
}

function setColumnsConfig(config) {
  columnsConfig = config;
}

export { buildTable, resetSort, setColumnsConfig };
