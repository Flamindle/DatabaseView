/**
 * CRUD 模态框组件
 * 用于新增和编辑记录
 */
import { createRecord, updateRecord, getTableSchema } from '../../services/djangoApi.js';
import './CrudModal.css';

let callbacks = {
  onSuccess: () => {},
  onError: () => {}
};

/**
 * 初始化模态框
 */
function init(cbs) {
  callbacks = { ...callbacks, ...cbs };
  createModalDOM();
}

/**
 * 创建模态框 DOM 结构
 */
function createModalDOM() {
  if (document.getElementById('crudModal')) return;

  const modal = document.createElement('div');
  modal.id = 'crudModal';
  modal.className = 'crud-modal-overlay hidden';
  modal.innerHTML = `
    <div class="crud-modal">
      <div class="crud-modal-header">
        <h3 id="modalTitle">新增记录</h3>
        <button type="button" class="modal-close" id="modalClose">&times;</button>
      </div>
      <div class="crud-modal-body">
        <form id="crudForm">
          <div id="formFields"></div>
        </form>
      </div>
      <div class="crud-modal-footer">
        <button type="button" class="btn-secondary" id="modalCancel">取消</button>
        <button type="button" class="btn-primary" id="modalSubmit">提交</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // 绑定事件
  document.getElementById('modalClose').addEventListener('click', hide);
  document.getElementById('modalCancel').addEventListener('click', hide);
  document.getElementById('modalSubmit').addEventListener('click', handleSubmit);

  // 点击遮罩关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hide();
  });
}

/**
 * 显示新增记录模态框
 * @param {string} tableName - 表名
 * @param {Array} fields - 字段列表
 */
async function showAdd(tableName, fields) {
  const modal = document.getElementById('crudModal');
  if (!modal) return;

  // 获取表结构
  const schemaResult = await getTableSchema(tableName);
  const schema = schemaResult.success ? schemaResult.data.schema : [];

  document.getElementById('modalTitle').textContent = '新增记录';
  document.getElementById('modalSubmit').dataset.mode = 'add';
  document.getElementById('modalSubmit').dataset.tableName = tableName;
  document.getElementById('modalSubmit').dataset.recordId = '';

  renderFormFields(schema, fields);
  modal.classList.remove('hidden');
}

/**
 * 显示编辑记录模态框
 * @param {string} tableName - 表名
 * @param {number|string} recordId - 记录 ID
 * @param {Object} recordData - 当前记录数据
 */
async function showEdit(tableName, recordId, recordData) {
  console.log('[编辑] 打开编辑模态框', { tableName, recordId, recordData });

  const modal = document.getElementById('crudModal');
  if (!modal) {
    console.error('[编辑] 模态框元素不存在');
    return;
  }

  // 获取表结构
  const schemaResult = await getTableSchema(tableName);
  console.log('[编辑] 表结构请求结果:', schemaResult);
  const schema = schemaResult.success ? schemaResult.data.schema : [];

  document.getElementById('modalTitle').textContent = '编辑记录';
  document.getElementById('modalSubmit').dataset.mode = 'edit';
  document.getElementById('modalSubmit').dataset.tableName = tableName;
  document.getElementById('modalSubmit').dataset.recordId = recordId;

  console.log('[编辑] 渲染表单字段, schema:', schema, 'fields:', Object.keys(recordData));
  renderFormFields(schema, Object.keys(recordData), recordData);
  modal.classList.remove('hidden');
}

/**
 * 渲染表单字段
 */
function renderFormFields(schema, visibleFields, recordData = {}) {
  const container = document.getElementById('formFields');
  if (!container) return;

  // 获取字段类型映射
  const typeMap = {};
  if (schema && schema.length) {
    schema.forEach(col => {
      typeMap[col.name] = col.type;
    });
  }

  let html = '';
  visibleFields.forEach(field => {
    // 跳过 ID 字段（新增时）
    const isId = field.toLowerCase() === 'id';
    const value = recordData[field] ?? '';
    const type = typeMap[field] || 'varchar';

    html += `<div class="form-field">`;
    html += `<label for="field_${field}">${field}</label>`;

    // 根据字段类型选择输入框
    if (type.includes('text') || type.includes('blob')) {
      // 文本域
      html += `<textarea id="field_${field}" name="${field}" rows="3">${value}</textarea>`;
    } else if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
      // 数字输入框
      html += `<input type="number" id="field_${field}" name="${field}" value="${value}" ${isId ? 'readonly' : ''}>`;
    } else if (type.includes('date') && !type.includes('time')) {
      // 日期输入框
      html += `<input type="date" id="field_${field}" name="${field}" value="${value}">`;
    } else if (type.includes('time') && !type.includes('date')) {
      // 时间输入框
      html += `<input type="time" id="field_${field}" name="${field}" value="${value}">`;
    } else if (type.includes('datetime') || type.includes('timestamp')) {
      // 日期时间输入框
      html += `<input type="datetime-local" id="field_${field}" name="${field}" value="${value}">`;
    } else if (type.includes('bool')) {
      // 复选框
      html += `<input type="checkbox" id="field_${field}" name="${field}" ${value ? 'checked' : ''}> <span class="checkbox-label">是</span>`;
    } else {
      // 默认文本输入框
      html += `<input type="text" id="field_${field}" name="${field}" value="${value}" ${isId ? 'readonly' : ''}>`;
    }

    html += `</div>`;
  });

  container.innerHTML = html;
}

/**
 * 隐藏模态框
 */
function hide() {
  const modal = document.getElementById('crudModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * 处理表单提交
 */
async function handleSubmit() {
  const btn = document.getElementById('modalSubmit');
  const mode = btn.dataset.mode;
  const tableName = btn.dataset.tableName;
  const recordId = btn.dataset.recordId;

  // 收集表单数据
  const form = document.getElementById('crudForm');
  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    // 跳过 ID 字段
    if (key.toLowerCase() === 'id') continue;

    // 处理复选框
    const checkbox = document.getElementById(`field_${key}`);
    if (checkbox && checkbox.type === 'checkbox') {
      data[key] = checkbox.checked ? 1 : 0;
    } else if (checkbox && checkbox.type === 'number') {
      // 数字字段：如果为空，设为 null
      data[key] = value === '' ? null : Number(value);
    } else {
      // 其他字段：空字符串转为 null
      data[key] = value === '' ? null : value;
    }
  }

  // 禁用提交按钮，防止重复点击
  btn.disabled = true;
  btn.textContent = '提交中...';

  console.log('[提交] 发送的数据:', data);

  try {
    let result;
    if (mode === 'add') {
      result = await createRecord(tableName, data);
    } else {
      result = await updateRecord(tableName, recordId, data);
    }

    if (result.success) {
      hide();
      callbacks.onSuccess(result.message || '操作成功');
    } else {
      callbacks.onError(result.message || '操作失败');
    }
  } catch (err) {
    callbacks.onError(`请求失败: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = '提交';
  }
}

export { init, showAdd, showEdit, hide };
