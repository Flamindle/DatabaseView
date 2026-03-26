/**
 * 字段管理器组件
 * 负责：视图模式切换按钮 + 自定义字段面板
 * 数据和回调由 app.js 通过 init() 传入
 */
import { queryTable } from '../../services/api.js';
import { saveConfig, loadConfig } from '../../utils/storage.js';

let callbacks = {
  onViewModeFull: () => {},
  onViewModeCustom: () => {},
  getColumnsConfig: () => [],
  onColumnsConfigChange: () => {}
};

let $tools = null;
let $panel = null;
let $btnFull = null;
let $btnCustom = null;

/**
 * 初始化字段管理器
 * @param {HTMLElement} container - 挂载容器
 * @param {Object} cbs - 回调函数
 */
function init(container, cbs) {
  callbacks = { ...callbacks, ...cbs };

  container.innerHTML = `
    <div class="table-tools" id="tblTools">
      <span>视图：</span>
      <button type="button" id="btnFull" class="active">全字段</button>
      <button type="button" id="btnCustom">自定义字段</button>
    </div>
    <div class="field-panel hidden" id="fpanel"></div>
  `;

  $tools = document.getElementById('tblTools');
  $panel = document.getElementById('fpanel');
  $btnFull = document.getElementById('btnFull');
  $btnCustom = document.getElementById('btnCustom');

  $btnFull.addEventListener('click', () => {
    $btnFull.classList.add('active');
    $btnCustom.classList.remove('active');
    $panel.classList.add('hidden');
    callbacks.onViewModeFull();
  });

  $btnCustom.addEventListener('click', () => {
    $btnCustom.classList.add('active');
    $btnFull.classList.remove('active');
    renderPanel();
  });
}

/** 渲染自定义字段面板 */
function renderPanel() {
  if (!$panel) return;
  const config = callbacks.getColumnsConfig();
  if (!config || !config.length) return;

  $panel.classList.remove('hidden');

  let html = '<div class="field-panel-header">';
  html += '<span>字段筛选：</span>';
  html += '<button type="button" class="panel-action-btn" data-action="check-all">全选</button>';
  html += '<button type="button" class="panel-action-btn" data-action="uncheck-all">全不选</button>';
  html += '</div>';
  html += '<div class="field-panel-list">';

  config.forEach(col => {
    const cls = col.visible !== false ? 'field-chip active' : 'field-chip inactive';
    html += `<button type="button" class="${cls}" data-key="${col.key}">${col.key}</button>`;
  });
  html += '</div>';
  $panel.innerHTML = html;

  // 字段按钮：切换显隐
  $panel.querySelectorAll('.field-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      const cfg = callbacks.getColumnsConfig();
      const col = cfg.find(c => c.key === key);
      if (col) {
        col.visible = !col.visible;
        callbacks.onColumnsConfigChange(cfg);
        renderPanel(); // 重新渲染面板（更新按钮样式）
      }
    });
  });

  // 全选 / 全不选
  $panel.querySelectorAll('.panel-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      const cfg = callbacks.getColumnsConfig();
      cfg.forEach(c => { c.visible = (action === 'check-all'); });
      callbacks.onColumnsConfigChange(cfg);
      renderPanel();
    });
  });
}

/** 显示工具栏 */
function show() {
  if ($tools) $tools.classList.remove('hidden');
}

/** 隐藏工具栏和面板 */
function hide() {
  if ($tools) $tools.classList.add('hidden');
  if ($panel) $panel.classList.add('hidden');
}

/** 重置视图模式到全字段 */
function reset() {
  if ($btnFull && $btnCustom) {
    $btnFull.classList.add('active');
    $btnCustom.classList.remove('active');
  }
  if ($panel) $panel.classList.add('hidden');
}

export { init, show, hide, reset };
