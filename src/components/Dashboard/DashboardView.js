/**
 * 仪表板主组件
 * 网格布局 + 多图表卡片
 */
import './DashboardView.css';
import { saveDashboard, loadDashboard } from '../../utils/storage.js';
import { DashboardCard } from './DashboardCard.js';
import { openCardModal } from './DashboardCardModal.js';

let dashboardContainer = null;
let dashboardCards = [];  // 当前渲染的卡片实例列表
let callbacks = {
  onCardAdd: null,
  onCardDelete: null,
  onCardUpdate: null
};

/**
 * 初始化仪表板视图
 * @param {HTMLElement} container - 挂载容器
 * @param {Object} cbs - 回调函数
 */
function init(container, cbs = {}) {
  callbacks = { ...callbacks, ...cbs };
  dashboardContainer = container;
  renderDashboard();
}

/**
 * 渲染仪表板
 */
function renderDashboard() {
  if (!dashboardContainer) return;

  const saved = loadDashboard();
  const cards = saved?.cards || [];

  dashboardContainer.innerHTML = `
    <div class="dashboard-header">
      <h3>仪表板</h3>
      <div class="dashboard-actions">
        <button type="button" class="btn-add-card" id="addCardBtn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8M8 12h8"/>
          </svg>
          添加卡片
        </button>
      </div>
    </div>
    <div class="dashboard-grid" id="dashboardGrid">
      ${cards.length === 0 ? '<div class="dashboard-empty">暂无卡片，点击"添加卡片"开始创建</div>' : ''}
    </div>
  `;

  // 绑定添加按钮
  document.getElementById('addCardBtn').addEventListener('click', handleAddCard);

  // 渲染已有卡片
  dashboardCards = [];
  cards.forEach(cardConfig => {
    renderCard(cardConfig);
  });

  // 初始化拖拽排序
  initDragSort();
}

/**
 * 渲染单张卡片
 */
function renderCard(cardConfig) {
  const grid = document.getElementById('dashboardGrid');
  if (!grid) return;

  // 移除空状态提示
  const empty = grid.querySelector('.dashboard-empty');
  if (empty) empty.remove();

  const cardInstance = DashboardCard.create(cardConfig, {
    onDelete: handleCardDelete,
    onEdit: handleCardEdit,
    onChartTypeChange: handleCardChartTypeChange
  });

  grid.appendChild(cardInstance.$el);
  dashboardCards.push(cardInstance);
}

/**
 * 添加新卡片
 */
function handleAddCard() {
  openCardModal(null, (newConfig) => {
    const saved = loadDashboard() || { cards: [] };
    const card = {
      id: 'card_' + Date.now(),
      ...newConfig
    };
    saved.cards.push(card);
    saveDashboard(saved);
    renderCard(card);
  });
}

/**
 * 删除卡片
 */
function handleCardDelete(cardId) {
  const saved = loadDashboard();
  if (!saved) return;

  saved.cards = saved.cards.filter(c => c.id !== cardId);
  saveDashboard(saved);

  // 从 DOM 移除
  const instance = dashboardCards.find(c => c.id === cardId);
  if (instance && instance.$el) {
    instance.$el.remove();
  }
  dashboardCards = dashboardCards.filter(c => c.id !== cardId);

  // 如果没有卡片了，显示空状态
  const grid = document.getElementById('dashboardGrid');
  if (grid && dashboardCards.length === 0) {
    grid.innerHTML = '<div class="dashboard-empty">暂无卡片，点击"添加卡片"开始创建</div>';
  }
}

/**
 * 编辑卡片
 */
function handleCardEdit(cardId) {
  const saved = loadDashboard();
  if (!saved) return;
  const cardConfig = saved.cards.find(c => c.id === cardId);
  if (!cardConfig) return;

  openCardModal(cardConfig, (updatedConfig) => {
    // 更新存储
    const idx = saved.cards.findIndex(c => c.id === cardId);
    if (idx >= 0) {
      saved.cards[idx] = { ...saved.cards[idx], ...updatedConfig };
      saveDashboard(saved);
    }

    // 重新渲染该卡片
    const instance = dashboardCards.find(c => c.id === cardId);
    if (instance) {
      const newCard = { ...instance.config, ...updatedConfig };
      instance.update(newCard);
    }
  });
}

/**
 * 图表类型切换
 */
function handleCardChartTypeChange(cardId, chartType) {
  const saved = loadDashboard();
  if (!saved) return;

  const idx = saved.cards.findIndex(c => c.id === cardId);
  if (idx >= 0) {
    saved.cards[idx].chartType = chartType;
    saveDashboard(saved);
  }

  const instance = dashboardCards.find(c => c.id === cardId);
  if (instance) {
    instance.setChartType(chartType);
  }
}

// ============================================================
// 拖拽排序
// ============================================================
let dragState = null;

function initDragSort() {
  const grid = document.getElementById('dashboardGrid');
  if (!grid) return;

  grid.addEventListener('mousedown', onGridMouseDown);
}

function onGridMouseDown(e) {
  const handle = e.target.closest('.card-drag-handle');
  if (!handle) return;

  const cardEl = handle.closest('.dashboard-card');
  if (!cardEl) return;

  e.preventDefault();

  // 创建 ghost
  const ghost = cardEl.cloneNode(true);
  ghost.classList.add('card-ghost');
  ghost.style.cssText = `position:fixed;pointer-events:none;z-index:9999;width:${cardEl.offsetWidth}px;top:${e.clientY - 60}px;left:${e.clientX - cardEl.offsetWidth / 2}px;opacity:0.85;`;
  document.body.appendChild(ghost);

  cardEl.classList.add('card-dragging');

  dragState = {
    ghost,
    sourceEl: cardEl,
    sourceId: cardEl.dataset.cardId
  };

  document.addEventListener('mousemove', onGridMouseMove);
  document.addEventListener('mouseup', onGridMouseUp);
}

function onGridMouseMove(e) {
  if (!dragState) return;

  const { ghost } = dragState;
  ghost.style.top = (e.clientY - 60) + 'px';
  ghost.style.left = (e.clientX - ghost.offsetWidth / 2) + 'px';

  // 高亮目标位置
  highlightDropTarget(e.clientX, e.clientY);
}

function highlightDropTarget(x, y) {
  // 清除所有高亮
  document.querySelectorAll('.card-drop-target').forEach(el => el.classList.remove('card-drop-target'));

  if (!dragState) return;

  const { sourceEl } = dragState;
  const cards = Array.from(document.querySelectorAll('.dashboard-card:not(.card-dragging)'));

  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    if (y >= rect.top && y <= rect.bottom) {
      if (y < midY) {
        card.classList.add('card-drop-target');
        dragState.targetBefore = card;
      } else {
        // 插入到当前卡片之后
        card.classList.add('card-drop-target');
        dragState.targetBefore = card.nextElementSibling;
      }
      return;
    }
  }

  dragState.targetBefore = null;
}

function onGridMouseUp(e) {
  if (!dragState) return;

  document.removeEventListener('mousemove', onGridMouseMove);
  document.removeEventListener('mouseup', onGridMouseUp);

  const { ghost, sourceEl, sourceId, targetBefore } = dragState;

  ghost.remove();
  sourceEl.classList.remove('card-dragging');
  document.querySelectorAll('.card-drop-target').forEach(el => el.classList.remove('card-drop-target'));

  // 如果有目标位置，交换卡片顺序
  if (targetBefore && targetBefore !== sourceEl) {
    const grid = document.getElementById('dashboardGrid');
    grid.insertBefore(sourceEl, targetBefore);
    // 移动卡片数据顺序
    updateCardOrder();
  }

  dragState = null;
}

function updateCardOrder() {
  const saved = loadDashboard();
  if (!saved) return;

  const grid = document.getElementById('dashboardGrid');
  const cardEls = Array.from(grid.querySelectorAll('.dashboard-card'));
  const newOrder = cardEls.map(el => el.dataset.cardId).filter(Boolean);

  const reordered = newOrder
    .map(id => saved.cards.find(c => c.id === id))
    .filter(Boolean);

  saved.cards = reordered;
  saveDashboard(saved);
}

/**
 * 销毁仪表板
 */
function destroy() {
  if (dashboardContainer) {
    dashboardContainer.innerHTML = '';
  }
  dashboardCards = [];
  dragState = null;
}

export { init, renderDashboard, destroy };
