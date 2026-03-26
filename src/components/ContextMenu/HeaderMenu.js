/**
 * 右键菜单组件
 */

let headerMenuEl = null;

/**
 * 获取或创建右键菜单元素
 */
function getHeaderMenuElement() {
  if (!headerMenuEl) {
    headerMenuEl = document.createElement('div');
    headerMenuEl.className = 'header-context-menu hidden';
    headerMenuEl.innerHTML = `
      <div data-action="hide">隐藏此字段</div>
      <div data-action="only">仅保留此字段</div>
      <div data-action="reset">重置字段显示</div>
    `;
    document.body.appendChild(headerMenuEl);

    // 点击其他位置隐藏菜单
    document.addEventListener('click', () => {
      if (headerMenuEl) {
        headerMenuEl.classList.add('hidden');
      }
    });
  }
  return headerMenuEl;
}

/**
 * 显示表头右键菜单
 * @param {number} x - 鼠标 X 坐标
 * @param {number} y - 鼠标 Y 坐标
 * @param {string} fieldName - 字段名
 * @param {Array} columnsConfig - 字段配置引用
 * @param {Function} onChange - 配置变化回调
 */
function showHeaderContextMenu(x, y, fieldName, columnsConfig, onChange) {
  const menu = getHeaderMenuElement();
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.remove('hidden');

  // 移除旧的事件监听（防止重复绑定）
  const newMenu = menu.cloneNode(true);
  menu.parentNode.replaceChild(newMenu, menu);
  headerMenuEl = newMenu;

  newMenu.addEventListener('click', (e) => {
    const action = e.target.getAttribute('data-action');
    if (!action) return;

    newMenu.classList.add('hidden');

    if (!columnsConfig || !columnsConfig.length) return;

    if (action === 'hide') {
      columnsConfig.forEach(col => {
        if (col.key === fieldName) col.visible = false;
      });
    } else if (action === 'only') {
      columnsConfig.forEach(col => {
        col.visible = (col.key === fieldName);
      });
    } else if (action === 'reset') {
      columnsConfig.forEach(col => {
        col.visible = true;
      });
    }

    if (onChange) onChange();
  });
}

export { showHeaderContextMenu };
