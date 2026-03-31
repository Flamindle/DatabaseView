/**
 * 仪表板卡片配置模态框
 */
import { doQueryDashboard } from '../../services/api.js';
import { getFieldType } from './DashboardUtils.js';
import './DashboardCardModal.css';

let modal = null;
let currentStep = 1;
let formData = {};

const STEPS = ['选择数据源', '选择维度', '选择指标', '图表设置'];

/**
 * 打开卡片配置模态框
 * @param {Object|null} existingConfig - 已有配置（编辑模式）或 null（新建模式）
 * @param {Function} onConfirm - 确认回调，接收完整配置
 */
export function openCardModal(existingConfig, onConfirm) {
  formData = existingConfig ? { ...existingConfig } : {
    title: '',
    tableName: '',
    dimensions: [],
    metrics: [],
    chartType: 'bar'
  };
  currentStep = 1;
  createModal(onConfirm);
}

/**
 * 创建模态框 DOM
 */
function createModal(onConfirm) {
  // 移除已有模态框
  if (modal) {
    modal.remove();
  }

  modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box" id="dashboardModalBox">
      <div class="modal-header">
        <h3 id="modalTitle">添加卡片</h3>
        <button type="button" class="modal-close" id="modalCloseBtn">&times;</button>
      </div>
      <div class="modal-steps" id="modalSteps">
        ${STEPS.map((s, i) => `<div class="step-dot ${i === 0 ? 'active' : ''}" data-step="${i + 1}">${i + 1}</div>`).join('')}
        ${STEPS.map((s, i) => `<div class="step-label ${i === 0 ? 'active' : ''}" data-step="${i + 1}">${s}</div>`).join('')}
      </div>
      <div class="modal-body" id="modalBody"></div>
      <div class="modal-footer">
        <button type="button" class="btn-secondary" id="modalPrevBtn" style="display:none;">上一步</button>
        <button type="button" class="btn-primary" id="modalNextBtn">下一步</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 绑定事件
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.getElementById('modalPrevBtn').addEventListener('click', () => navigateStep(-1, onConfirm));
  document.getElementById('modalNextBtn').addEventListener('click', () => navigateStep(1, onConfirm));

  renderStep(onConfirm);
}

function closeModal() {
  if (modal) {
    modal.remove();
    modal = null;
  }
}

function navigateStep(dir, onConfirm) {
  const next = currentStep + dir;

  if (next < 1 || next > STEPS.length) return;

  // 最后一步：提交
  if (currentStep === STEPS.length && dir === 1) {
    if (!formData.title || !formData.tableName || formData.dimensions.length === 0 || formData.metrics.length === 0) {
      alert('请填写完整信息');
      return;
    }
    onConfirm({ ...formData });
    closeModal();
    return;
  }

  currentStep = next;
  renderStep(onConfirm);
}

function renderStep(onConfirm) {
  const body = document.getElementById('modalBody');
  const prevBtn = document.getElementById('modalPrevBtn');
  const nextBtn = document.getElementById('modalNextBtn');
  const title = document.getElementById('modalTitle');

  // 更新步骤指示器
  document.querySelectorAll('.step-dot, .step-label').forEach(el => {
    const step = parseInt(el.dataset.step);
    el.classList.toggle('active', step === currentStep);
  });

  prevBtn.style.display = currentStep > 1 ? '' : 'none';

  if (currentStep === STEPS.length) {
    nextBtn.textContent = '确认添加';
  } else {
    nextBtn.textContent = '下一步';
  }

  title.textContent = currentStep === 1 && formData.tableName ? '编辑卡片' : '添加卡片';

  switch (currentStep) {
    case 1: renderStep1(body, onConfirm); break;
    case 2: renderStep2(body, onConfirm); break;
    case 3: renderStep3(body, onConfirm); break;
    case 4: renderStep4(body, onConfirm); break;
  }
}

// ============================================================
// Step 1: 选择数据源表
// ============================================================
async function renderStep1(body, onConfirm) {
  body.innerHTML = `
    <div class="form-group">
      <label>卡片标题</label>
      <input type="text" id="cardTitleInput" value="${formData.title || ''}" placeholder="例如：销售趋势">
    </div>
    <div class="form-group">
      <label>数据源表</label>
      <select id="tableSelect">
        <option value="">请选择数据表</option>
      </select>
    </div>
  `;

  const titleInput = document.getElementById('cardTitleInput');
  const tableSelect = document.getElementById('tableSelect');

  // 填充表列表（从 window 全局状态获取，或让用户输入）
  // 这里暂时使用 select，让用户从已连接数据库中选择
  try {
    const saved = localStorage.getItem('mysql_viewer_config');
    const dbConfig = saved ? JSON.parse(saved) : {};
    const resp = await fetch('http://localhost:3000/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbConfig)
    });
    const result = await resp.json();
    if (result.success && result.tables) {
      result.tables.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        if (t === formData.tableName) opt.selected = true;
        tableSelect.appendChild(opt);
      });
    }
  } catch (e) {
    tableSelect.innerHTML = '<option value="">请先连接数据库</option>';
  }

  titleInput.addEventListener('input', () => { formData.title = titleInput.value; });
  tableSelect.addEventListener('change', () => {
    formData.tableName = tableSelect.value;
    formData.dimensions = [];
    formData.metrics = [];
  });
}

// ============================================================
// Step 2: 选择维度字段
// ============================================================
async function renderStep2(body, onConfirm) {
  body.innerHTML = '<div class="step-loading">加载字段中...</div>';

  try {
    const resp = await fetch('http://localhost:3000/query-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName: formData.tableName, page: 1, pageSize: 5 })
    });
    const result = await resp.json();

    if (!result.success) {
      body.innerHTML = '<div class="step-error">加载字段失败：' + result.message + '</div>';
      return;
    }

    const fields = result.fields || [];
    const data = result.data || [];

    formData.dimensions = formData.dimensions || [];

    body.innerHTML = `
      <div class="form-group">
        <label>选择维度字段（至少选1个）</label>
        <div class="field-checklist" id="dimensionChecklist">
          ${fields.map(f => `
            <label class="field-checkbox">
              <input type="checkbox" value="${f}" ${formData.dimensions.includes(f) ? 'checked' : ''}>
              <span>${f}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    document.querySelectorAll('#dimensionChecklist input').forEach(cb => {
      cb.addEventListener('change', () => {
        formData.dimensions = Array.from(document.querySelectorAll('#dimensionChecklist input:checked')).map(c => c.value);
      });
    });
  } catch (e) {
    body.innerHTML = '<div class="step-error">加载字段失败：' + e.message + '</div>';
  }
}

// ============================================================
// Step 3: 选择指标字段
// ============================================================
async function renderStep3(body, onConfirm) {
  body.innerHTML = '<div class="step-loading">加载字段中...</div>';

  try {
    const resp = await fetch('http://localhost:3000/query-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName: formData.tableName, page: 1, pageSize: 5 })
    });
    const result = await resp.json();

    if (!result.success) {
      body.innerHTML = '<div class="step-error">加载字段失败：' + result.message + '</div>';
      return;
    }

    const fields = result.fields || [];
    const data = result.data || [];

    formData.metrics = formData.metrics || [];

    // 过滤出数值字段
    const numberFields = fields.filter(f => {
      return getFieldType(data, f) === 'number';
    });

    if (numberFields.length === 0) {
      body.innerHTML = '<div class="step-error">未找到数值类型字段</div>';
      return;
    }

    body.innerHTML = `
      <div class="form-group">
        <label>选择指标字段（至少选1个）</label>
        <div class="field-checklist" id="metricChecklist">
          ${numberFields.map(f => `
            <label class="field-checkbox">
              <input type="checkbox" value="${f}" ${formData.metrics.includes(f) ? 'checked' : ''}>
              <span>${f}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    document.querySelectorAll('#metricChecklist input').forEach(cb => {
      cb.addEventListener('change', () => {
        formData.metrics = Array.from(document.querySelectorAll('#metricChecklist input:checked')).map(c => c.value);
      });
    });
  } catch (e) {
    body.innerHTML = '<div class="step-error">加载字段失败：' + e.message + '</div>';
  }
}

// ============================================================
// Step 4: 图表设置
// ============================================================
function renderStep4(body, onConfirm) {
  body.innerHTML = `
    <div class="form-group">
      <label>图表类型</label>
      <div class="chart-type-picker" id="chartTypePicker">
        <button type="button" class="type-btn ${formData.chartType === 'bar' ? 'active' : ''}" data-type="bar">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <rect x="3" y="12" width="4" height="9"/>
            <rect x="10" y="6" width="4" height="15"/>
            <rect x="17" y="3" width="4" height="18"/>
          </svg>
          <span>柱状图</span>
        </button>
        <button type="button" class="type-btn ${formData.chartType === 'line' ? 'active' : ''}" data-type="line">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span>折线图</span>
        </button>
        <button type="button" class="type-btn ${formData.chartType === 'pie' ? 'active' : ''}" data-type="pie">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 2a10 10 0 0 1 10 10H12V2z"/>
          </svg>
          <span>饼图</span>
        </button>
      </div>
    </div>
    <div class="form-summary">
      <h4>配置摘要</h4>
      <div><strong>标题：</strong>${formData.title || '未命名'}</div>
      <div><strong>数据源：</strong>${formData.tableName}</div>
      <div><strong>维度：</strong>${formData.dimensions.join('，')}</div>
      <div><strong>指标：</strong>${formData.metrics.join('，')}</div>
    </div>
  `;

  document.querySelectorAll('#chartTypePicker .type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#chartTypePicker .type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      formData.chartType = btn.dataset.type;
    });
  });
}
