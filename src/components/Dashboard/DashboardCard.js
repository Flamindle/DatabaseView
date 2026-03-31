/**
 * 仪表板单卡片组件
 * 每张卡片持有独立的 Chart.js 实例
 */
import { Chart, registerables } from 'chart.js';
import { doQueryDashboard } from '../../services/api.js';
import { aggregateDashboardData } from './DashboardUtils.js';

Chart.register(...registerables);

let cardCounter = 0;

export class DashboardCard {
  /**
   * 创建卡片实例
   * @param {Object} config - 卡片配置
   * @param {Object} callbacks - 回调 { onDelete, onEdit, onChartTypeChange }
   */
  constructor(config, callbacks = {}) {
    this.id = config.id;
    this.config = config;
    this.callbacks = callbacks;
    this.chart = null;
    this.$el = null;

    this._createDOM();
    this._renderChart();
  }

  static create(config, callbacks) {
    return new DashboardCard(config, callbacks);
  }

  _createDOM() {
    const el = document.createElement('div');
    el.className = 'dashboard-card';
    el.dataset.cardId = this.id;

    el.innerHTML = `
      <div class="card-header">
        <div class="card-drag-handle" title="拖拽排序">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <circle cx="9" cy="6" r="1.5"/>
            <circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/>
            <circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/>
            <circle cx="15" cy="18" r="1.5"/>
          </svg>
        </div>
        <span class="card-title">${this.config.title || '未命名图表'}</span>
        <div class="card-actions">
          <button type="button" class="card-action-btn" data-type="bar" title="柱状图">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <rect x="3" y="12" width="4" height="9"/>
              <rect x="10" y="6" width="4" height="15"/>
              <rect x="17" y="3" width="4" height="18"/>
            </svg>
          </button>
          <button type="button" class="card-action-btn" data-type="line" title="折线图">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </button>
          <button type="button" class="card-action-btn" data-type="pie" title="饼图">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 2a10 10 0 0 1 10 10H12V2z"/>
            </svg>
          </button>
          <button type="button" class="card-action-btn card-edit-btn" title="编辑">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button type="button" class="card-action-btn card-delete-btn" title="删除">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="card-body">
        <canvas id="cardChart_${this.id}"></canvas>
        <div class="card-loading" id="cardLoading_${this.id}" style="display:none;">
          <span>加载中...</span>
        </div>
        <div class="card-error" id="cardError_${this.id}" style="display:none;"></div>
      </div>
    `;

    this.$el = el;
    this._bindCardEvents();
  }

  _bindCardEvents() {
    // 图表类型切换
    this.$el.querySelectorAll('.card-action-btn[data-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.setChartType(type);
        if (this.callbacks.onChartTypeChange) {
          this.callbacks.onChartTypeChange(this.id, type);
        }
      });
    });

    // 编辑
    const editBtn = this.$el.querySelector('.card-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        if (this.callbacks.onEdit) {
          this.callbacks.onEdit(this.id);
        }
      });
    }

    // 删除
    const deleteBtn = this.$el.querySelector('.card-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('确定要删除这张卡片吗？')) {
          if (this.callbacks.onDelete) {
            this.callbacks.onDelete(this.id);
          }
        }
      });
    }
  }

  async _renderChart() {
    const canvas = document.getElementById(`cardChart_${this.id}`);
    const loading = document.getElementById(`cardLoading_${this.id}`);
    const errorEl = document.getElementById(`cardError_${this.id}`);

    if (!canvas) return;

    loading.style.display = 'flex';
    canvas.style.display = 'none';
    errorEl.style.display = 'none';

    try {
      const result = await doQueryDashboard({
        tableName: this.config.tableName,
        dimensions: this.config.dimensions,
        metrics: this.config.metrics,
        page: 1,
        pageSize: 500
      });

      loading.style.display = 'none';

      if (!result.success || !result.data || result.data.length === 0) {
        errorEl.textContent = '无数据';
        errorEl.style.display = 'flex';
        return;
      }

      const { labels, datasets } = aggregateDashboardData(
        result.data,
        this.config.dimensions,
        this.config.metrics
      );

      canvas.style.display = 'block';
      this._drawChart(canvas, labels, datasets);
    } catch (err) {
      loading.style.display = 'none';
      errorEl.textContent = '加载失败：' + err.message;
      errorEl.style.display = 'flex';
    }
  }

  _drawChart(canvas, labels, datasets) {
    if (this.chart) {
      this.chart.destroy();
    }

    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a',
      '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c'
    ];

    const type = this.config.chartType || 'bar';

    const chartDatasets = datasets.map((ds, i) => {
      const color = colors[i % colors.length];
      if (type === 'bar') {
        return { label: ds.name, data: ds.values, backgroundColor: color, borderRadius: 4 };
      } else if (type === 'line') {
        return { label: ds.name, data: ds.values, borderColor: color, backgroundColor: color + '33', fill: true, tension: 0.3 };
      } else {
        return { label: ds.name, data: ds.values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' };
      }
    });

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: type === 'pie' || datasets.length > 1, position: 'right' },
        tooltip: { trigger: type === 'pie' ? 'item' : 'axis' }
      }
    };

    if (type !== 'pie') {
      options.scales = { x: { ticks: { maxRotation: 45 } }, y: { beginAtZero: true } };
    }

    this.chart = new Chart(canvas, { type, data: { labels, datasets: chartDatasets }, options });
  }

  setChartType(type) {
    this.config.chartType = type;
    this._renderChart();
  }

  update(newConfig) {
    this.config = { ...this.config, ...newConfig };
    const titleEl = this.$el.querySelector('.card-title');
    if (titleEl) titleEl.textContent = this.config.title || '未命名图表';
    this._renderChart();
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (this.$el) {
      this.$el.remove();
      this.$el = null;
    }
  }
}
