/**
 * 视图模式切换组件
 * 图形模式和仪表板跳转到独立页面
 */
import './ViewMode.css';

/**
 * 初始化视图模式切换器
 */
function init(container) {
  createModeSwitcher(container);
}

/**
 * 创建模式切换器 DOM
 */
function createModeSwitcher(container) {
  const switcher = document.createElement('div');
  switcher.className = 'view-mode-switcher';
  switcher.innerHTML = `
    <div class="mode-btn-group">
      <button type="button" class="mode-btn active" id="tableModeBtn" title="表格模式">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M3 15h18M9 3v18"/>
        </svg>
        <span>表格</span>
      </button>
      <button type="button" class="mode-btn" id="chartModeBtn" title="数据可视化">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 15l5-5 4 4 5-5 4 4"/>
        </svg>
        <span>图形</span>
      </button>
      <button type="button" class="mode-btn" id="dashboardModeBtn" title="仪表板">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="9" rx="1"/>
          <rect x="14" y="3" width="7" height="5" rx="1"/>
          <rect x="14" y="12" width="7" height="9" rx="1"/>
          <rect x="3" y="16" width="7" height="5" rx="1"/>
        </svg>
        <span>仪表板</span>
      </button>
    </div>
  `;

  container.appendChild(switcher);

  // 绑定事件
  bindModeEvents();
}

/**
 * 绑定模式切换事件
 */
function bindModeEvents() {
  // 图形模式 - 新页面
  document.getElementById('chartModeBtn').addEventListener('click', () => {
    window.open('/src/chart.html', '_blank', 'width=1400,height=900,resizable=yes,scrollbars=yes');
  });

  // 仪表板 - 新页面
  document.getElementById('dashboardModeBtn').addEventListener('click', () => {
    window.open('/src/dashboard.html', '_blank', 'width=1400,height=900,resizable=yes,scrollbars=yes');
  });
}

export {
  init
};
