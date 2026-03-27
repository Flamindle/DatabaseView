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
  console.log('[ChartView] init 被调用', { container, options });
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
          <!-- 快速测试按钮 -->
          <button type="button" id="quickTestBtn" style="margin-left: auto; padding: 6px 12px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
            快速测试
          </button>
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

  // 绑定快速测试按钮
  const quickTestBtn = document.getElementById('quickTestBtn');
  if (quickTestBtn) {
    quickTestBtn.addEventListener('click', function() {
      console.log('[ChartView] 快速测试按钮点击');
      performQuickTest();
    });
  }

  bindChartEvents();

  // 初始化后自动执行测试
  setTimeout(function() {
    log('[ChartView] 初始化完成，自动执行测试');
    performQuickTest();
  }, 500);
}

/**
 * 快速测试图表渲染
 */
function performQuickTest() {
  // 在页面上显示调试信息
  var debugInfo = document.createElement('div');
  debugInfo.id = 'debugInfo';
  debugInfo.style.cssText = 'position:fixed;top:10px;right:10px;background:#000;color:#0f0;padding:10px;font-size:12px;z-index:99999;max-width:400px;overflow:auto;';
  debugInfo.innerHTML = '<b>调试信息：</b><br>';
  document.body.appendChild(debugInfo);

  function log(msg) {
    console.log(msg);
    debugInfo.innerHTML += msg + '<br>';
  }

  log('[ChartView] performQuickTest 执行中...');

  // 获取第一个文本字段和第一个数值字段
  const fieldItems = document.querySelectorAll('.field-item');
  log('找到字段数量: ' + fieldItems.length);

  let textField = null;
  let numberField = null;

  fieldItems.forEach(function(item) {
    const type = item.dataset.type;
    const name = item.dataset.field;
    log('检查字段: ' + name + ' (类型: ' + type + ')');
    if (type === 'text' && !textField) {
      textField = name;
      log('设为维度: ' + name);
    }
    if ((type === 'number' || type === 'date') && !numberField) {
      numberField = name;
      log('设为指标: ' + name);
    }
  });

  if (!textField || !numberField) {
    log('错误: 需要至少一个文本字段和一个数值字段');
    log('textField=' + textField + ', numberField=' + numberField);
    return;
  }

  // 清除现有字段
  const dimContainer = document.getElementById('dimensionFields');
  const metContainer = document.getElementById('metricFields');

  if (dimContainer) dimContainer.innerHTML = '';
  if (metContainer) metContainer.innerHTML = '';

  // 添加测试字段
  addFieldToZone(dimContainer, { name: textField, type: 'text' });
  addFieldToZone(metContainer, { name: numberField, type: 'number' });

  log('字段已添加到区域');

  // 触发更新
  updateChart();

  log('[完成] 快速测试完成');
}

/**
 * 绑定图表事件
 */
function bindChartEvents() {
  console.log('[ChartView] bindChartEvents 被调用');

  // 全局拖放调试 - 捕获所有 drop 事件
  document.addEventListener('drop', (e) => {
    console.log('[ChartView] 📌 全局 drop 事件捕获!', e.target);
    e.preventDefault(); // 阻止默认行为
  }, true);

  document.addEventListener('dragover', (e) => {
    e.preventDefault(); // 重要！允许 drop
  }, true);

  // 图表类型切换
  document.querySelectorAll('.chart-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentChartType = btn.dataset.type;
      updateChart();
    });
  });

  // 字段拖拽
  document.querySelectorAll('.field-item').forEach(field => {
    field.setAttribute('draggable', 'true');
    field.addEventListener('dragstart', handleDragStart);
    field.addEventListener('dragend', handleDragEnd);
  });

  // 拖放区域 - 同时绑定 zone 和 dropped-fields
  ['dimensionZone', 'dimensionFields', 'metricZone', 'metricFields'].forEach(id => {
    const zone = document.getElementById(id);
    if (zone) {
      console.log('[ChartView] 绑定拖放事件到:', id);
      zone.addEventListener('dragover', handleDragOver);
      zone.addEventListener('drop', handleDrop);
      zone.addEventListener('dragleave', handleDragLeave);
    } else {
      console.log('[ChartView] 未找到拖放区域:', id);
    }
  });

  // 暴露手动测试函数到全局
  window.__chartTest = function(dimensionField, metricField) {
    console.log('[ChartView] 手动测试:', dimensionField, metricField);
    const dimContainer = document.getElementById('dimensionFields');
    const metContainer = document.getElementById('metricFields');
    if (dimContainer && dimensionField) {
      addFieldToZone(dimContainer, { name: dimensionField, type: 'text' });
    }
    if (metContainer && metricField) {
      addFieldToZone(metContainer, { name: metricField, type: 'number' });
    }
    updateChart();
  };
}

let draggedField = null;

function handleDragStart(e) {
  console.log('[ChartView] handleDragStart 被调用');
  // 获取 field-item 元素（可能点击的是子元素）
  const fieldEl = e.target.closest('.field-item');
  if (!fieldEl) {
    console.log('[ChartView] 未找到 field-item 元素');
    return;
  }

  draggedField = {
    name: fieldEl.dataset.field,
    type: fieldEl.dataset.type
  };
  console.log('[ChartView] 开始拖拽字段:', draggedField);
  fieldEl.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedField.name);
}

function handleDragEnd(e) {
  const fieldEl = e.target.closest('.field-item');
  if (fieldEl) {
    fieldEl.classList.remove('dragging');
  }
  document.querySelectorAll('.drop-zone-hover').forEach(el => el.classList.remove('drop-zone-hover'));
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  // 添加高亮到最近的 drop zone
  const zone = e.target.closest('.dimension-zone, .metric-zone, .dropped-fields');
  if (zone) {
    zone.classList.add('drop-zone-hover');
  }
}

function handleDragLeave(e) {
  const zone = e.target.closest('.dimension-zone, .metric-zone, .dropped-fields');
  if (zone && !zone.contains(e.relatedTarget)) {
    zone.classList.remove('drop-zone-hover');
  }
}

function handleDrop(e) {
  console.log('[ChartView] handleDrop 被调用');
  e.preventDefault();

  // 移除所有高亮
  document.querySelectorAll('.drop-zone-hover').forEach(el => el.classList.remove('drop-zone-hover'));

  if (!draggedField) {
    console.log('[ChartView] draggedField 为空');
    return;
  }

  console.log('[ChartView] 拖放的字段:', draggedField);

  // 找到最近的 drop zone
  const zone = e.target.closest('.dimension-zone, .metric-zone, .dropped-fields');
  if (!zone) {
    console.log('[ChartView] 没有找到 drop zone');
    return;
  }

  console.log('[ChartView] 找到 zone:', zone.id || zone.className);

  let container;

  if (zone.classList.contains('dimension-zone')) {
    // 拖放到维度区域
    container = zone.querySelector('.dropped-fields');
  } else if (zone.classList.contains('metric-zone')) {
    // 拖放到指标区域
    container = zone.querySelector('.dropped-fields');
  } else if (zone.classList.contains('dropped-fields')) {
    // 直接拖到 dropped-fields 元素上
    container = zone;
  }

  console.log('[ChartView] container:', container);

  if (container) {
    addFieldToZone(container, draggedField);
  }

  draggedField = null;
  updateChart();
}

/**
 * 添加字段到区域
 */
function addFieldToZone(container, field) {
  console.log('[ChartView] addFieldToZone 被调用', { field, container: container.id });

  // 检查是否已存在
  if (container.querySelector(`[data-field="${field.name}"]`)) {
    console.log('[ChartView] 字段已存在，跳过');
    return;
  }

  const fieldEl = document.createElement('div');
  fieldEl.className = 'dropped-field';
  fieldEl.dataset.field = field.name;
  fieldEl.dataset.type = field.type;
  fieldEl.innerHTML = `
    <span class="field-name">${field.name}</span>
    <button type="button" class="remove-field" title="移除">×</button>
  `;

  // 移除按钮事件
  fieldEl.querySelector('.remove-field').addEventListener('click', () => {
    fieldEl.remove();
    updateChart();
  });

  container.appendChild(fieldEl);
  container.classList.add('has-field');
  console.log('[ChartView] 字段已添加到', container.id);
}

/**
 * 更新图表
 */
function updateChart() {
  console.log('[ChartView] updateChart 被调用');
  const dimensionEl = document.getElementById('dimensionFields');
  const metricEl = document.getElementById('metricFields');

  if (!dimensionEl || !metricEl) {
    console.log('[ChartView] dimensionEl 或 metricEl 不存在');
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

  console.log('[ChartView] 当前配置 - 维度:', dimensions, '指标:', metrics);

  // 触发更新
  const event = new CustomEvent('chartConfigChange', {
    detail: { dimensions, metrics, chartType: currentChartType }
  });
  console.log('[ChartView] 派发 chartConfigChange 事件');
  document.dispatchEvent(event);
}

/**
 * 渲染图表
 */
function renderChart(data, chartOptions) {
  console.log('[ChartView] renderChart 被调用', data);
  const { labels, values, chartType } = data;
  const canvas = document.getElementById('dataChartCanvas');
  const placeholder = document.getElementById('chartPlaceholder');

  console.log('[ChartView] canvas 元素:', canvas, 'placeholder:', placeholder);

  if (!labels || labels.length === 0 || !values || values.length === 0) {
    console.log('[ChartView] 数据为空，显示占位符');
    placeholder.style.display = 'flex';
    canvas.style.display = 'none';
    return;
  }

  console.log('[ChartView] 数据有效，labels:', labels, 'values:', values);
  placeholder.style.display = 'none';
  canvas.style.display = 'block';

  // 销毁旧图表
  if (currentChart) {
    currentChart.destroy();
  }

  const themeColors = getThemeColors();
  const chartConfig = getChartConfig(chartType || currentChartType, labels, values, themeColors);

  currentChart = new Chart(canvas, chartConfig);
}

/**
 * 获取图表配置
 */
function getChartConfig(type, labels, values, colors) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: type === 'pie',
        position: 'right'
      },
      tooltip: {
        trigger: 'item'
      }
    }
  };

  switch (type) {
    case 'pie':
      return {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: baseOptions
      };

    case 'line':
      return {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: '数值',
            data: values,
            borderColor: colors[0],
            backgroundColor: colors[0] + '33',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          ...baseOptions,
          scales: {
            y: { beginAtZero: true }
          }
        }
      };

    case 'bar':
    default:
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: '数值',
            data: values,
            backgroundColor: colors,
            borderRadius: 4
          }]
        },
        options: {
          ...baseOptions,
          scales: {
            y: { beginAtZero: true }
          }
        }
      };
  }
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
  console.log('[ChartView] setFields 被调用，字段数量:', fields?.length);
  const container = document.getElementById('fieldList');
  if (!container) {
    console.log('[ChartView] fieldList 容器不存在');
    return;
  }

  container.innerHTML = fields.map(f => `
    <div class="field-item ${f.type}" data-field="${f.name}" data-type='${f.type}'>
      <span class="field-icon">${getFieldIcon(f.type)}</span>
      <span class="field-name">${f.name}</span>
      <span class="field-type">${getFieldTypeLabel(f.type)}</span>
    </div>
  `).join('');

  console.log('[ChartView] 字段渲染完成，绑定拖拽事件');

  // 重新绑定拖拽事件
  container.querySelectorAll('.field-item').forEach(field => {
    field.setAttribute('draggable', 'true');
    field.addEventListener('dragstart', handleDragStart);
    field.addEventListener('dragend', handleDragEnd);
  });

  console.log('[ChartView] 字段列表:', fields.map(f => f.name + '(' + f.type + ')').join(', '));
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
