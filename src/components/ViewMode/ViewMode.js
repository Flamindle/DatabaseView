/**
 * 视图模式切换组件
 * 表格模式 / 图形模式 切换
 */
import './ViewMode.css';

let currentMode = 'table';  // 'table' | 'chart'
let callbacks = {
  onModeChange: () => {}
};

/**
 * 初始化视图模式切换器
 */
function init(container, cbs = {}) {
  callbacks = { ...callbacks, ...cbs };
  createModeSwitcher(container);
}

/**
 * 创建模式切换器 DOM
 */
function createModeSwitcher(container) {
  console.log('[ViewMode] createModeSwitcher 被调用', { container });
  const switcher = document.createElement('div');
  switcher.id = 'viewModeSwitcher';
  switcher.className = 'view-mode-switcher';
  switcher.innerHTML = `
    <div class="mode-btn-group">
      <button type="button" class="mode-btn active" data-mode="table" id="tableModeBtn">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M3 15h18M9 3v18"/>
        </svg>
        <span>表格模式</span>
      </button>
      <button type="button" class="mode-btn" data-mode="chart" id="chartModeBtn">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 15l5-5 4 4 5-5 4 4"/>
        </svg>
        <span>图形模式</span>
      </button>
    </div>
  `;

  // 插入到连接表单卡片之后
  const dataCard = document.getElementById('dataCard');
  if (dataCard && dataCard.parentNode) {
    dataCard.parentNode.insertBefore(switcher, dataCard);
  } else {
    container.appendChild(switcher);
  }

  // 绑定事件
  bindModeEvents();
}

/**
 * 绑定模式切换事件
 */
function bindModeEvents() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('[ViewMode] 按钮点击事件触发', btn.dataset.mode);
      const mode = btn.dataset.mode;
      if (mode === currentMode) {
        console.log('[ViewMode] 模式相同，跳过');
        return;
      }

      // 更新按钮状态
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentMode = mode;
      console.log('[ViewMode] 调用 onModeChange', mode);
      callbacks.onModeChange(mode);
    });
  });
}

/**
 * 获取当前模式
 */
function getMode() {
  return currentMode;
}

/**
 * 设置模式
 */
function setMode(mode) {
  if (mode === currentMode) return;

  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  callbacks.onModeChange(mode);
}

/**
 * 切换到表格模式
 */
function showTableMode() {
  setMode('table');
}

/**
 * 切换到图形模式
 */
function showChartMode() {
  setMode('chart');
}

export {
  init,
  getMode,
  setMode,
  showTableMode,
  showChartMode
};
