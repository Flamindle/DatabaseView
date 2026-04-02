# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chart-drag-drop.spec.js >> 图表拖拽功能测试 >> 完整测试：SQLite → 图形模式 → 拖拽字段 → 渲染图表
- Location: tests\chart-drag-drop.spec.js:16:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#tableSection')
Expected: visible
Received: hidden
Timeout:  10000ms

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('#tableSection')
    14 × locator resolved to <div class="card" id="tableSection">…</div>
       - unexpected value "hidden"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e5]
      - heading "SQLite 数据库查看器" [level=1] [ref=e8]
    - generic [ref=e9]:
      - button "浅色" [ref=e10] [cursor=pointer]
      - button "返回主页" [ref=e11] [cursor=pointer]:
        - img [ref=e12]
        - text: 返回主页
  - generic [ref=e14]:
    - heading "选择数据库文件" [level=3] [ref=e15]
    - generic [ref=e16] [cursor=pointer]:
      - img [ref=e18]
      - generic [ref=e21]: 将 .db / .sqlite / .sqlite3 文件拖拽到此处
      - generic [ref=e22]: 或点击选择文件
    - generic [ref=e23]: "已选择: test.db (8.0 KB)"
```

# Test source

```ts
  1   | /**
  2   |  * 图表拖拽功能自动化测试
  3   |  *
  4   |  * 测试流程：
  5   |  * 1. 直接打开 SQLite 页面（绕过主页，简化流程）
  6   |  * 2. 上传测试数据库并查询
  7   |  * 3. 在同一页面打开图形模式
  8   |  * 4. 拖拽字段到维度和指标区域
  9   |  * 5. 验证图表正确显示
  10  |  */
  11  | 
  12  | const { test, expect } = require('@playwright/test');
  13  | const path = require('path');
  14  | 
  15  | test.describe('图表拖拽功能测试', () => {
  16  |   test('完整测试：SQLite → 图形模式 → 拖拽字段 → 渲染图表', async ({ page }) => {
  17  |     // ========================================
  18  |     // 第一步：打开 SQLite 页面并连接
  19  |     // ========================================
  20  |     await page.goto('http://localhost:5173/src/sqlite.html');
  21  |     await page.waitForLoadState('networkidle');
  22  | 
  23  |     // 等待拖拽区域可见
  24  |     const dropZone = page.locator('#sqliteDropZone');
  25  |     await expect(dropZone).toBeVisible();
  26  | 
  27  |     // 上传测试数据库
  28  |     const testDbPath = path.resolve(__dirname, 'fixtures/test.db');
  29  |     await page.locator('#fileInput').setInputFiles(testDbPath);
  30  | 
  31  |     // 等待表选择区域出现
  32  |     const tableSection = page.locator('#tableSection');
> 33  |     await expect(tableSection).toBeVisible({ timeout: 10000 });
      |                                ^ Error: expect(locator).toBeVisible() failed
  34  | 
  35  |     // 选择 sales_data 表
  36  |     await page.locator('#tableSelect').selectOption('sales_data');
  37  | 
  38  |     // 点击查询按钮
  39  |     await page.locator('#queryBtn').click();
  40  | 
  41  |     // 等待数据表格出现（表格渲染在 #dataContainer 里）
  42  |     await expect(page.locator('#dataContainer table')).toBeVisible({ timeout: 10000 });
  43  | 
  44  |     console.log('✅ SQLite 数据库连接成功，数据已加载');
  45  | 
  46  |     // ========================================
  47  |     // 第二步：打开图形模式页面，通过 evaluate 注入测试数据
  48  |     // ========================================
  49  |     await page.goto('http://localhost:5173/src/chart.html');
  50  |     await page.waitForLoadState('networkidle');
  51  |     await page.waitForTimeout(2000);
  52  | 
  53  |     // 通过 evaluate 直接注入测试数据到图形模式
  54  |     // 这样可以绕过 SQLite localStorage 恢复的问题
  55  |     await page.evaluate(() => {
  56  |       const testFields = [
  57  |         { name: 'id', type: 'number' },
  58  |         { name: '月份', type: 'text' },
  59  |         { name: '产品', type: 'text' },
  60  |         { name: '销售额', type: 'number' },
  61  |         { name: '数量', type: 'number' },
  62  |         { name: '利润', type: 'number' }
  63  |       ];
  64  |       // 注入到全局状态
  65  |       window.__testFields = testFields;
  66  |       // 调用 setFields 如果存在
  67  |       if (typeof window.setFields === 'function') {
  68  |         window.setFields(testFields);
  69  |       }
  70  |     });
  71  | 
  72  |     // 等待 chartView 加载（chartViewContainer 显示后）
  73  |     await page.waitForSelector('#chartViewContainer .field-list', { timeout: 10000 });
  74  | 
  75  |     // 如果 window.setFields 不可用，通过 click 事件触发
  76  |     const hasFields = await page.locator('.field-item').count();
  77  |     if (hasFields === 0) {
  78  |       // 手动触发 chartView 显示并设置字段
  79  |       await page.evaluate(() => {
  80  |         const fieldList = document.getElementById('fieldList');
  81  |         if (fieldList) {
  82  |           const testFields = [
  83  |             { name: 'id', type: 'number' },
  84  |             { name: '月份', type: 'text' },
  85  |             { name: '产品', type: 'text' },
  86  |             { name: '销售额', type: 'number' },
  87  |             { name: '数量', type: 'number' },
  88  |             { name: '利润', type: 'number' }
  89  |           ];
  90  |           const { setFields } = window;
  91  |           // 尝试通过 chartView 组件的 init 流程注入
  92  |           const chartContainer = document.getElementById('chartViewContainer');
  93  |           if (chartContainer && !chartContainer.querySelector('.field-item')) {
  94  |             // 手动创建字段列表
  95  |             fieldList.innerHTML = testFields.map(f => `
  96  |               <div class="field-item ${f.type}" data-field="${f.name}" data-type="${f.type}">
  97  |                 <span class="field-icon">${f.type === 'number' ? '📈' : (f.type === 'date' ? '📅' : '📝')}</span>
  98  |                 <span class="field-name">${f.name}</span>
  99  |                 <span class="field-type">${f.type === 'number' ? '数值' : (f.type === 'date' ? '日期' : '文本')}</span>
  100 |               </div>
  101 |             `).join('');
  102 |             // 重新绑定拖拽事件
  103 |             const { onFieldMouseDown } = window;
  104 |           }
  105 |         }
  106 |       });
  107 |     }
  108 | 
  109 |     // 确保字段列表已加载
  110 |     await page.waitForSelector('.field-item.number', { timeout: 10000 });
  111 |     await expect(page.locator('#fieldList')).toBeVisible();
  112 | 
  113 |     // ========================================
  114 |     // 第三步：调用 setFields 设置字段列表
  115 |     // ========================================
  116 |     const chartJsLoaded = await page.evaluate(() => {
  117 |       return typeof window.__chartSetFields === 'function';
  118 |     });
  119 | 
  120 |     if (chartJsLoaded) {
  121 |       await page.evaluate(() => {
  122 |         window.__chartSetFields([
  123 |           { name: 'id', type: 'number' },
  124 |           { name: '月份', type: 'text' },
  125 |           { name: '产品', type: 'text' },
  126 |           { name: '销售额', type: 'number' },
  127 |           { name: '数量', type: 'number' },
  128 |           { name: '利润', type: 'number' }
  129 |         ]);
  130 |       });
  131 |       await page.waitForTimeout(500);
  132 | 
  133 |       // 添加数值字段到指标区域
```