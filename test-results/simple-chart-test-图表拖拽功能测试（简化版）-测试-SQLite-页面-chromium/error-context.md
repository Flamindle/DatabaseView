# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: simple-chart-test.spec.js >> 图表拖拽功能测试（简化版） >> 测试 SQLite 页面
- Location: tests\simple-chart-test.spec.js:40:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#tableSelect')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#tableSelect')
    9 × locator resolved to <select id="tableSelect">…</select>
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
  1  | /**
  2  |  * 简化版图表拖拽测试
  3  |  * 假设开发服务器已经手动启动（npm run dev）
  4  |  */
  5  | 
  6  | const { test, expect } = require('@playwright/test');
  7  | const path = require('path');
  8  | 
  9  | test.describe('图表拖拽功能测试（简化版）', () => {
  10 |   test('直接测试图形模式页面', async ({ page }) => {
  11 |     // 1. 直接打开图形模式页面
  12 |     await page.goto('http://localhost:5173/src/chart.html');
  13 |     await page.waitForLoadState('domcontentloaded');
  14 |     await page.waitForTimeout(3000);
  15 | 
  16 |     // 截图查看初始状态
  17 |     await page.screenshot({ path: 'tests/screenshots/chart-initial.png' });
  18 | 
  19 |     // 2. 检查页面元素是否存在
  20 |     const connectionSection = page.locator('#connectionSection');
  21 |     await expect(connectionSection).toBeVisible();
  22 | 
  23 |     console.log('✅ 图形模式页面加载成功');
  24 | 
  25 |     // 3. 如果需要测试拖拽，需要先手动连接数据库
  26 |     // 这里只验证页面结构
  27 |     const fieldList = page.locator('#fieldList');
  28 |     const dimensionZone = page.locator('#dimensionZone');
  29 |     const metricZone = page.locator('#metricZone');
  30 |     const chartCanvas = page.locator('#dataChartCanvas');
  31 | 
  32 |     await expect(fieldList).toBeVisible();
  33 |     await expect(dimensionZone).toBeVisible();
  34 |     await expect(metricZone).toBeVisible();
  35 |     await expect(chartCanvas).toBeVisible();
  36 | 
  37 |     console.log('✅ 所有必要元素都存在');
  38 |   });
  39 | 
  40 |   test('测试 SQLite 页面', async ({ page }) => {
  41 |     // 1. 打开 SQLite 页面
  42 |     await page.goto('http://localhost:5173/src/sqlite.html');
  43 |     await page.waitForLoadState('domcontentloaded');
  44 |     await page.waitForTimeout(2000);
  45 | 
  46 |     // 截图
  47 |     await page.screenshot({ path: 'tests/screenshots/sqlite-page.png' });
  48 | 
  49 |     // 2. 检查文件上传区域
  50 |     const dropZone = page.locator('#sqliteDropZone');
  51 |     await expect(dropZone).toBeVisible();
  52 | 
  53 |     // 3. 上传测试数据库
  54 |     const testDbPath = path.resolve(__dirname, 'fixtures/test.db');
  55 |     const fileInput = page.locator('input[type="file"]');
  56 |     await fileInput.setInputFiles(testDbPath);
  57 | 
  58 |     // 等待表列表加载
  59 |     await page.waitForTimeout(2000);
  60 | 
  61 |     // 截图查看上传后状态
  62 |     await page.screenshot({ path: 'tests/screenshots/sqlite-uploaded.png' });
  63 | 
  64 |     // 4. 检查表选择器是否出现
  65 |     const tableSelect = page.locator('#tableSelect');
> 66 |     await expect(tableSelect).toBeVisible();
     |                               ^ Error: expect(locator).toBeVisible() failed
  67 | 
  68 |     console.log('✅ SQLite 数据库上传成功');
  69 |   });
  70 | });
```