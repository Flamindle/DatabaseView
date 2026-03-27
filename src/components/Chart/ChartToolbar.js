/**
 * 图表工具栏（图形模式下使用）
 */
import './ChartToolbar.css';

let callbacks = {
  onChartTypeChange: () => {}
};

/**
 * 初始化
 */
function init(container, cbs = {}) {
  callbacks = { ...callbacks, ...cbs };
}

/**
 * 隐藏工具栏（图形模式不需要）
 */
function hide() {
  // 图形模式不需要单独的图表工具栏
}

/**
 * 显示工具栏
 */
function show() {
  // 图形模式不需要单独的图表工具栏
}

export {
  init,
  hide,
  show
};
