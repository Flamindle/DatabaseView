/**
 * 图形模式页面入口
 * 独立页面：完整的拖拽式数据可视化功能
 */
import './styles/global.css';
import './components/Chart/ChartView.css';
import { init as initTheme } from './components/Theme/ThemeToggle.js';
import { init as initConnection } from './components/Connection/ConnectionForm.js';
import { init as initChartView, setFields, renderChart } from './components/Chart/ChartView.js';
import { loadConfig, saveConfig } from './utils/storage.js';
import { doQueryDashboard } from './services/api.js';

// ============================================================
// 全局状态
// ============================================================
const state = {
  connection: null,
  currentTable: '',
  lastQueryResult: null,
  chartViewReady: false
};

// ============================================================
// 页面初始化
// ============================================================
async function init() {
  // 初始化主题
  initTheme();

  // 返回按钮
  document.getElementById('backBtn').addEventListener('click', () => {
    window.close();
    // 如果 window.close 失败（浏览器阻止），则跳转
    window.location.href = '/';
  });

  // 连接表单
  const $conn = document.getElementById('connectionForm');
  initConnection($conn, {
    onTablesLoaded(tables) {
      state.connection = loadConfig() || {};
      updateDatasourceInfo();
      showChartView();
    }
  });

  // 初始化图表视图（隐藏，等连接成功后再显示）
  const $chartView = document.getElementById('chartViewContainer');
  initChartView($chartView, {
    onReady: () => {
      state.chartViewReady = true;
    }
  });

  // 尝试从 localStorage 恢复连接
  await tryRestoreConnection();

  // 绑定图表配置变化事件
  document.addEventListener('chartConfigChange', handleChartConfigChange);
}

// ============================================================
// 尝试自动恢复连接
// ============================================================
async function tryRestoreConnection() {
  const cfg = loadConfig();
  if (!cfg) return;

  // SQLite 自动恢复
  if (cfg.dbType === 'sqlite' && cfg.dbPath) {
    await connectAndLoad();
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
        await connectAndLoad();
      }
    }
  } catch (e) {
    console.error('恢复连接失败', e);
  }
}

// ============================================================
// 连接数据库并加载数据
// ============================================================
async function connectAndLoad() {
  const cfg = loadConfig();
  if (!cfg || !cfg.database) return;

  try {
    const connResp = await fetch('http://localhost:3000/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
    const connResult = await connResp.json();
    if (!connResult.success) return;

    // 隐藏连接区域
    document.getElementById('connectionSection').style.display = 'none';
    updateDatasourceInfo();

    // 如果有上次查询的表，加载该表的数据
    if (cfg.tableName) {
      state.currentTable = cfg.tableName;
      await loadTableData(cfg.tableName);
    }
  } catch (e) {
    console.error('连接失败', e);
  }
}

// ============================================================
// 加载表数据并分析字段
// ============================================================
async function loadTableData(tableName) {
  if (!tableName) return;

  try {
    const result = await doQueryDashboard({
      tableName,
      page: 1,
      pageSize: 500
    });

    if (result.success && result.data && result.data.length > 0) {
      state.lastQueryResult = { fields: result.fields, data: result.data };
      const fieldConfigs = analyzeFields(result.fields, result.data);
      setFields(fieldConfigs);
      showMessage(`已加载 ${tableName}，共 ${result.data.length} 条记录`);
    } else {
      showMessage('该表无数据', false);
    }
  } catch (err) {
    showMessage('加载数据失败：' + err.message, false);
  }
}

// ============================================================
// 分析字段类型
// ============================================================
function analyzeFields(fields, data) {
  if (!data || data.length === 0) {
    return fields.map(name => ({ name, type: 'text' }));
  }

  return fields.map(name => {
    const sample = data.find(row => row[name] != null);
    if (!sample) return { name, type: 'text' };

    const val = sample[name];
    const type = typeof val;

    if (type === 'number' || !isNaN(parseFloat(val))) {
      return { name, type: 'number' };
    } else if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val))) {
      return { name, type: 'date' };
    }

    return { name, type: 'text' };
  });
}

// ============================================================
// 处理图表配置变化
// ============================================================
function handleChartConfigChange(e) {
  const { dimensions, metrics, chartType } = e.detail;

  if (!state.lastQueryResult) return;

  const { data } = state.lastQueryResult;
  const aggregated = aggregateData(data, dimensions, metrics);

  if (aggregated.labels.length > 0) {
    renderChart({
      labels: aggregated.labels,
      datasets: aggregated.datasets,
      chartType: chartType || 'bar'
    });
  }
}

// ============================================================
// 聚合数据
// ============================================================
function aggregateData(data, dimensions, metrics) {
  const dimNames = dimensions.map(d => typeof d === 'object' ? d.name : d);
  const metNames = metrics.map(m => typeof m === 'object' ? m.name : m);

  if (!dimNames.length || !metNames.length) {
    return { labels: [], datasets: [] };
  }

  const labels = [];
  const datasets = metNames.map(name => ({ name, values: [] }));

  data.forEach(row => {
    const label = dimNames.map(d => {
      const v = row[d];
      return v == null ? '' : String(v);
    }).join(' / ');

    if (labels.length === 0 || labels[labels.length - 1] !== label) {
      labels.push(label);
    }

    metNames.forEach((metName, idx) => {
      const raw = row[metName];
      const val = parseFloat(raw);
      datasets[idx].values.push(isNaN(val) ? 0 : Math.round(val * 100) / 100);
    });
  });

  return { labels, datasets };
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
// 显示图表视图
// ============================================================
function showChartView() {
  document.getElementById('chartViewContainer').style.display = '';
}

// ============================================================
// 消息提示
// ============================================================
function showMessage(text, isSuccess = true) {
  const msgEl = document.getElementById('message');
  if (msgEl) {
    msgEl.textContent = text;
    msgEl.className = `message ${isSuccess ? 'success' : 'error'}`;
    msgEl.style.display = 'block';
    setTimeout(() => { msgEl.style.display = 'none'; }, 3000);
  }
}

// ============================================================
// 启动
// ============================================================
document.addEventListener('DOMContentLoaded', init);
