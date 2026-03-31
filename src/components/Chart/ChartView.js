/**
 * 图形模式视图
 * 基于 FineBI 理念：拖拽式字段映射 + 智能图表推荐
 */
import { Chart, registerables } from 'chart.js';
import './ChartView.css';

// 注册 Chart.js 组件
Chart.register(...registerables);

let currentChart = null;
let currentChartType = 'bar';

/**
 * 初始化图形模式视图
 */
let chartContainer = null;

function init(container, options = {}) {
  chartContainer = container;
  createChartViewDOM(container);
}

/**
 * 创建图形模式 DOM 结构
 */
function createChartViewDOM(container) {
  // 清空容器并添加图形视图
  container.innerHTML = `
    <div class="chart-view">
      <!-- 左侧字段面板 -->
      <div class="chart-field-panel">
        <div class="panel-header">
          <h4>可用字段</h4>
          <button type="button" class="refresh-btn" id="refreshFieldsBtn" title="刷新字段">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
          </button>
        </div>
        <div class="field-list" id="fieldList">
          <!-- 字段会动态生成 -->
        </div>

        <!-- 字段拖放说明 -->
        <div class="field-hint">
          <span class="hint-icon">💡</span>
          <span>拖拽字段到维度或指标区域</span>
        </div>
      </div>

      <!-- 右侧图表区域 -->
      <div class="chart-canvas-area">
        <!-- 图表类型选择 -->
        <div class="chart-type-bar">
          <span class="type-label">图表类型：</span>
          <div class="chart-type-buttons">
            <button type="button" class="chart-type-btn active" data-type="bar" title="柱状图">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <rect x="3" y="12" width="4" height="9"/>
                <rect x="10" y="6" width="4" height="15"/>
                <rect x="17" y="3" width="4" height="18"/>
              </svg>
              <span class="btn-text">柱状图</span>
            </button>
            <button type="button" class="chart-type-btn" data-type="pie" title="饼图">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
                <path d="M12 3v9l7 5"/>
              </svg>
              <span class="btn-text">饼图</span>
            </button>
            <button type="button" class="chart-type-btn" data-type="line" title="折线图">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <span class="btn-text">折线图</span>
            </button>
          </div>
        </div>

        <!-- 图表配置区域 -->
        <div class="chart-config-area">
          <!-- 维度区域 -->
          <div class="config-row">
            <div class="config-zone dimension-zone" id="dimensionZone">
              <div class="zone-label">
                <span class="zone-icon">📊</span>
                <span>维度（横轴/标签）</span>
              </div>
              <div class="dropped-fields" id="dimensionFields">
                <!-- 拖放的维度字段 -->
              </div>
            </div>
            <div class="config-zone metric-zone" id="metricZone">
              <div class="zone-label">
                <span class="zone-icon">📈</span>
                <span>指标（数值）</span>
              </div>
              <div class="dropped-fields" id="metricFields">
                <!-- 拖放的指标字段 -->
              </div>
            </div>
          </div>
        </div>

        <!-- 图表画布 -->
        <div class="chart-canvas" id="chartCanvas">
          <canvas id="dataChartCanvas"></canvas>
          <div class="chart-placeholder" id="chartPlaceholder">
            <div class="placeholder-icon">📊</div>
            <p>拖拽字段到上方区域生成图表</p>
            <p class="placeholder-hint">维度用于分类/标签，指标用于数值计算</p>
          </div>
        </div>
      </div>
    </div>
  `;

  bindChartEvents();
}

/**
 * 绑定图表事件
 */
function bindChartEvents() {
  // 图表类型切换
  document.querySelectorAll('.chart-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentChartType = btn.dataset.type;
      updateChart();
    });
  });
}

// ============================================================
// 原生拖拽：mousedown + mousemove + mouseup
// ============================================================
let ghostEl = null;
let ghostField = null;
let mouseMoveHandler = null;
let mouseUpHandler = null;

function onFieldMouseDown(e) {
  const fieldEl = e.target.closest('.field-item');
  if (!fieldEl) return;

  ghostField = {
    name: fieldEl.dataset.field,
    type: fieldEl.dataset.type
  };

  // 创建 ghost 元素
  ghostEl = document.createElement('div');
  ghostEl.className = 'drag-ghost';
  ghostEl.textContent = ghostField.name;
  ghostEl.style.cssText = `position:fixed;pointer-events:none;z-index:9999;top:${e.clientY - 20}px;left:${e.clientX - 60}px;`;
  document.body.appendChild(ghostEl);

  fieldEl.classList.add('dragging');

  // mousemove 绑定到 document，防止快速移动时丢失
  mouseMoveHandler = (e) => {
    if (!ghostEl) return;
    ghostEl.style.left = (e.clientX - 60) + 'px';
    ghostEl.style.top = (e.clientY - 20) + 'px';

    // 高亮悬停的 drop zone
    highlightDropZone(e.clientX, e.clientY);
  };

  // mouseup 绑定到 document
  mouseUpHandler = (e) => {
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler);
      mouseMoveHandler = null;
    }
    if (mouseUpHandler) {
      document.removeEventListener('mouseup', mouseUpHandler);
      mouseUpHandler = null;
    }

    // 移除 ghost
    if (ghostEl) {
      ghostEl.remove();
      ghostEl = null;
    }

    fieldEl.classList.remove('dragging');
    clearDropZoneHighlight();

    // 检测放置位置
    if (ghostField) {
      const targetContainer = findDropContainer(e.clientX, e.clientY);
      if (targetContainer) {
        // 指标区域只接受数值字段
        if (targetContainer.id === 'metricFields' && ghostField.type !== 'number') {
          ghostField = null;
          return;
        }
        addFieldToZone(targetContainer, ghostField);
        updateChart();
      }
    }

    ghostField = null;
  };

  document.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mouseup', mouseUpHandler);
}

/**
 * 根据鼠标位置高亮 drop zone
 */
function highlightDropZone(x, y) {
  clearDropZoneHighlight();

  const el = document.elementFromPoint(x, y);
  if (!el) return;

  const zone = el.closest('.dimension-zone, .metric-zone');
  if (zone) {
    zone.classList.add('drop-zone-hover');
  }
}

/**
 * 清除所有 drop zone 高亮
 */
function clearDropZoneHighlight() {
  document.querySelectorAll('.drop-zone-hover').forEach(el => el.classList.remove('drop-zone-hover'));
}

/**
 * 根据鼠标位置找到放置容器
 */
function findDropContainer(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;

  const zone = el.closest('.dimension-zone, .metric-zone');
  if (!zone) return null;

  return zone.querySelector('.dropped-fields');
}

/**
 * 添加字段到区域
 */
function addFieldToZone(container, field) {
  // 检查是否已存在
  if (container.querySelector(`[data-field="${field.name}"]`)) return;

  const fieldEl = document.createElement('div');
  fieldEl.className = 'dropped-field';
  fieldEl.dataset.field = field.name;
  fieldEl.dataset.type = field.type;
  fieldEl.innerHTML = `
    <span class="field-name">${field.name}</span>
    <button type="button" class="remove-field" title="移除">×</button>
  `;

  fieldEl.querySelector('.remove-field').addEventListener('click', () => {
    fieldEl.remove();
    updateChart();
  });

  container.appendChild(fieldEl);
  container.classList.add('has-field');
}

/**
 * 更新图表
 */
function updateChart() {
  const dimensionEl = document.getElementById('dimensionFields');
  const metricEl = document.getElementById('metricFields');

  if (!dimensionEl || !metricEl) {
      return;
  }

  const dimensions = Array.from(dimensionEl.querySelectorAll('.dropped-field')).map(f => ({
    name: f.dataset.field,
    type: f.dataset.type
  }));

  const metrics = Array.from(metricEl.querySelectorAll('.dropped-field')).map(f => ({
    name: f.dataset.field,
    type: f.dataset.type
  }));


  const event = new CustomEvent('chartConfigChange', {
    detail: { dimensions, metrics, chartType: currentChartType }
  });
  document.dispatchEvent(event);
}

/**
 * 渲染图表
 */
function renderChart(data, chartOptions) {
  const { labels, datasets, chartType } = data;
  const canvas = document.getElementById('dataChartCanvas');
  const placeholder = document.getElementById('chartPlaceholder');

  if (!labels || labels.length === 0 || !datasets || datasets.length === 0) {
    placeholder.style.display = 'flex';
    canvas.style.display = 'none';
    return;
  }

  placeholder.style.display = 'none';
  canvas.style.display = 'block';

  if (currentChart) {
    currentChart.destroy();
  }

  const themeColors = getThemeColors();
  const chartConfig = getChartConfig(chartType || currentChartType, labels, datasets, themeColors);

  currentChart = new Chart(canvas, chartConfig);
}

/**
 * 获取图表配置
 * @param {string} type - 图表类型 bar/pie/line
 * @param {string[]} labels - X轴标签（维度值）
 * @param {Array<{name:string, values:number[]}>} datasets - 多指标数据集
 * @param {string[]} colors - 主题色数组
 */
function getChartConfig(type, labels, datasets, colors) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: type === 'pie' || datasets.length > 1,
        position: 'right'
      },
      tooltip: {
        trigger: type === 'pie' ? 'item' : 'axis'
      }
    }
  };

  // 多指标dataset配置
  const chartDatasets = datasets.map((ds, i) => {
    const color = colors[i % colors.length];
    const base = { label: ds.name };

    if (type === 'bar') {
      return {
        ...base,
        data: ds.values,
        backgroundColor: color,
        borderRadius: 4
      };
    } else if (type === 'line') {
      return {
        ...base,
        data: ds.values,
        borderColor: color,
        backgroundColor: color + '33',
        fill: true,
        tension: 0.3
      };
    } else {
      // pie: 合并所有指标为一个dataset（饼图不支持多指标分组）
      return {
        label: '数值',
        data: ds.values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      };
    }
  });

  if (type === 'pie') {
    // 饼图：只取第一个指标的数据
    chartDatasets[0].data = datasets[0].values;
    chartDatasets[0].label = datasets[0].name;
  }

  const config = {
    type,
    data: { labels, datasets: chartDatasets },
    options: baseOptions
  };

  if (type !== 'pie') {
    config.options.scales = {
      x: { ticks: { maxRotation: 45 } },
      y: { beginAtZero: true }
    };
  }

  return config;
}

/**
 * 获取主题颜色
 */
function getThemeColors() {
  const isDark = document.body.classList.contains('dark-theme');
  const isSepia = document.body.classList.contains('sepia-theme');
  const isPink = document.body.classList.contains('pink-theme');

  if (isDark) return ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c'];
  if (isSepia) return ['#5b8a72', '#c17f59', '#8b7355', '#d4a574', '#7d9f85', '#b8860b'];
  if (isPink) return ['#f472b6', '#c084fc', '#fb7185', '#818cf8', '#e879f9', '#fb923c'];
  return ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
}

/**
 * 设置字段列表
 */
function setFields(fields) {
  const container = document.getElementById('fieldList');
  if (!container) {
      return;
  }

  container.innerHTML = fields.map(f => `
    <div class="field-item ${f.type}" data-field="${f.name}" data-type="${f.type}">
      <span class="field-icon">${getFieldIcon(f.type)}</span>
      <span class="field-name">${f.name}</span>
      <span class="field-type">${getFieldTypeLabel(f.type)}</span>
    </div>
  `).join('');

  // 绑定鼠标拖拽事件
  container.querySelectorAll('.field-item').forEach(field => {
    field.addEventListener('mousedown', onFieldMouseDown);
  });

}

function getFieldIcon(type) {
  if (type === 'number') return '📈';
  if (type === 'date') return '📅';
  return '📝';
}

function getFieldTypeLabel(type) {
  if (type === 'number') return '数值';
  if (type === 'date') return '日期';
  return '文本';
}

/**
 * 获取当前配置
 */
function getConfig() {
  const dimensionEl = document.getElementById('dimensionFields');
  const metricEl = document.getElementById('metricFields');

  return {
    dimensions: Array.from(dimensionEl.querySelectorAll('.dropped-field')).map(f => f.dataset.field),
    metrics: Array.from(metricEl.querySelectorAll('.dropped-field')).map(f => f.dataset.field),
    chartType: currentChartType
  };
}

/**
 * 清空配置（切换到表格模式时调用）
 */
function clearConfig() {
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }

  // 移除图形视图 DOM
  if (chartContainer) {
    chartContainer.innerHTML = '';
  }
  chartContainer = null;
}

export {
  init,
  setFields,
  renderChart,
  getConfig,
  clearConfig
};
