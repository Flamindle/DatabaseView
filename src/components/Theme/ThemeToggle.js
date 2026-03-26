/**
 * 主题切换组件
 */
const THEMES = [
  { key: 'light', label: '浅色', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { key: 'dark', label: '深色', color: 'linear-gradient(135deg, #2c3e50, #4ca1af)' },
  { key: 'green', label: '护眼', color: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { key: 'pink', label: '粉色', color: 'linear-gradient(135deg, #ec4899, #f472b6)' }
];

let currentIndex = 0;

function init() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  updateButton(btn);

  btn.addEventListener('click', () => {
    THEMES.forEach(t => document.documentElement.removeAttribute('data-theme'));
    currentIndex = (currentIndex + 1) % THEMES.length;
    const theme = THEMES[currentIndex];
    document.documentElement.setAttribute('data-theme', theme.key);
    updateButton(btn);
    localStorage.setItem('dbview-theme', theme.key);
  });

  const saved = localStorage.getItem('dbview-theme');
  if (saved) {
    const idx = THEMES.findIndex(t => t.key === saved);
    if (idx >= 0) {
      currentIndex = idx;
      document.documentElement.setAttribute('data-theme', saved);
    }
  }
  updateButton(btn);
}

function updateButton(btn) {
  const theme = THEMES[currentIndex];
  btn.textContent = theme.label;
  btn.style.background = theme.color;
}

export { init };
