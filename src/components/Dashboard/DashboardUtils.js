/**
 * 仪表板数据聚合工具
 * 将原始行数据按维度分组，每个指标一个 dataset
 */

/**
 * 聚合数据用于图表渲染
 * @param {Array} data - 原始行数据
 * @param {string[]} dimensions - 维度字段数组
 * @param {string[]} metrics - 指标字段数组
 * @returns {{ labels: string[], datasets: Array<{name: string, values: number[]}> }}
 */
export function aggregateDashboardData(data, dimensions, metrics) {
  if (!data || data.length === 0) {
    return { labels: [], datasets: [] };
  }

  if (!dimensions || !dimensions.length || !metrics || !metrics.length) {
    return { labels: [], datasets: [] };
  }

  // 标签列表（按出现顺序去重）
  const labelSet = [];
  const labelMap = new Map();

  // 初始化指标数据集
  const datasets = metrics.map(name => ({ name, values: [] }));

  // 第一遍：收集所有标签
  data.forEach(row => {
    const label = dimensions.map(d => {
      const v = row[d];
      return v == null ? '' : String(v);
    }).join(' / ');

    if (!labelMap.has(label)) {
      labelMap.set(label, labelSet.length);
      labelSet.push(label);
    }
  });

  // 第二遍：填值（每个标签一行，不存在的组合填0）
  labelSet.forEach((_, labelIdx) => {
    datasets.forEach(ds => {
      ds.values.push(0);
    });
  });

  data.forEach(row => {
    const label = dimensions.map(d => {
      const v = row[d];
      return v == null ? '' : String(v);
    }).join(' / ');

    const labelIdx = labelMap.get(label);

    metrics.forEach((metName, metIdx) => {
      const raw = row[metName];
      const val = parseFloat(raw);
      if (!isNaN(val)) {
        datasets[metIdx].values[labelIdx] = Math.round(val * 100) / 100;
      }
    });
  });

  return { labels: labelSet, datasets };
}

/**
 * 获取字段类型
 * @param {Array} data - 行数据
 * @param {string} fieldName - 字段名
 * @returns {'number'|'date'|'text'}
 */
export function getFieldType(data, fieldName) {
  if (!data || data.length === 0) return 'text';

  const sample = data.find(row => row[fieldName] != null);
  if (!sample) return 'text';

  const val = sample[fieldName];
  const type = typeof val;

  if (type === 'number' || !isNaN(parseFloat(val))) {
    return 'number';
  } else if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val))) {
    return 'date';
  }
  return 'text';
}
