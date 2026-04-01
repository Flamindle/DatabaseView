/**
 * 仪表板页面入口
 * 独立页面：多图表仪表板功能
 */
import './styles/global.css';
import './components/Dashboard/DashboardView.css';
import './components/Dashboard/DashboardCardModal.css';
import { init as initTheme } from './components/Theme/ThemeToggle.js';
import { init as initConnection } from './components/Connection/ConnectionForm.js';
import { init as initDashboard, destroy as destroyDashboard } from './components/Dashboard/DashboardView.js';
import { loadConfig } from './utils/storage.js';

// ============================================================
// 页面初始化
// ============================================================
async function init() {
  // 初始化主题
  initTheme();

  // 返回按钮
  document.getElementById('backBtn').addEventListener('click', () => {
    window.close();
    window.location.href = '/';
  });

  // 连接表单
  const $conn = document.getElementById('connectionForm');
  initConnection($conn, {
    onTablesLoaded(tables) {
      // 连接成功，隐藏连接区域，显示仪表板
      document.getElementById('connectionSection').style.display = 'none';
      updateDatasourceInfo();
      showDashboard();
    }
  });

  // 尝试从 localStorage 恢复连接
  await tryRestoreConnection();
}

// ============================================================
// 尝试自动恢复连接
// ============================================================
async function tryRestoreConnection() {
  const cfg = loadConfig();
  if (!cfg) return;

  // SQLite 自动恢复
  if (cfg.dbType === 'sqlite' && cfg.dbPath) {
    await connectAndShow();
    return;
  }

  // MySQL 自动恢复
  if (!cfg.host) return;

  try {
    const dbResp = await fetch('http://localhost:3000/get-databases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password || '' })
    });
    const dbResult = await dbResp.json();
    if (!dbResult.success) return;

    const databaseSelect = document.getElementById('database');
    if (databaseSelect) {
      databaseSelect.innerHTML = '<option value="">请选择数据库</option>';
      dbResult.databases.forEach(db => {
        const opt = document.createElement('option');
        opt.value = db;
        opt.textContent = db;
        databaseSelect.appendChild(opt);
      });
      databaseSelect.disabled = false;

      if (cfg.database && dbResult.databases.includes(cfg.database)) {
        databaseSelect.value = cfg.database;
        await connectAndShow();
      }
    }
  } catch (e) {
    console.error('恢复连接失败', e);
  }
}

// ============================================================
// 连接数据库并显示仪表板
// ============================================================
async function connectAndShow() {
  const cfg = loadConfig();
  if (!cfg) return;

  if (cfg.dbType === 'sqlite') {
    if (!cfg.dbPath) return;
  } else {
    if (!cfg.database) return;
  }

  try {
    const connResp = await fetch('http://localhost:3000/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
    const connResult = await connResp.json();
    if (!connResult.success) return;

    document.getElementById('connectionSection').style.display = 'none';
    updateDatasourceInfo();
    showDashboard();
  } catch (e) {
    console.error('连接失败', e);
  }
}

// ============================================================
// 显示数据源信息
// ============================================================
function updateDatasourceInfo() {
  const cfg = loadConfig();
  const info = document.getElementById('datasourceInfo');
  if (!cfg) return;

  if (cfg.dbType === 'sqlite' && cfg.dbPath) {
    const fileName = cfg.dbPath.split(/[/\\]/).pop();
    info.textContent = `SQLite: ${fileName}`;
    info.className = 'datasource-info connected';
  } else if (cfg.database) {
    info.textContent = `${cfg.host}/${cfg.database}`;
    info.className = 'datasource-info connected';
  } else {
    info.textContent = '未连接数据库';
    info.className = 'datasource-info';
  }
}

// ============================================================
// 显示仪表板
// ============================================================
function showDashboard() {
  const $container = document.getElementById('dashboardContainer');
  $container.style.display = '';
  initDashboard($container);
}

// ============================================================
// 启动
// ============================================================
document.addEventListener('DOMContentLoaded', init);
