# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chart-drag-drop.spec.js >> 图表拖拽功能测试 >> SQLite 页面基础功能
- Location: tests\chart-drag-drop.spec.js:233:3

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
  147 |         const dimContainer = document.getElementById('dimensionFields');
  148 |         const fieldEl = document.createElement('div');
  149 |         fieldEl.className = 'dropped-field';
  150 |         fieldEl.dataset.field = '月份';
  151 |         fieldEl.dataset.type = 'text';
  152 |         fieldEl.innerHTML = `<span class="field-name">月份</span><button type="button" class="remove-field" title="移除">×</button>`;
  153 |         dimContainer.appendChild(fieldEl);
  154 |         dimContainer.classList.add('has-field');
  155 |       });
  156 | 
  157 |       // 验证字段已添加
  158 |       await expect(page.locator('#metricFields .dropped-field')).toHaveCount(1);
  159 |       await expect(page.locator('#dimensionFields .dropped-field')).toHaveCount(1);
  160 |       console.log('✅ 字段已添加到维度和指标区域');
  161 | 
  162 |       // ========================================
  163 |       // 第四步：直接调用 renderChart 渲染图表
  164 |       // ========================================
  165 |       await page.evaluate(() => {
  166 |         window.__chartRenderChart({
  167 |           labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
  168 |           datasets: [{ name: '销售额', values: [12000, 15000, 18000, 14500, 20000, 22000] }],
  169 |           chartType: 'bar'
  170 |         });
  171 |       });
  172 |       await page.waitForTimeout(1500);
  173 |     } else {
  174 |       // fallback：直接渲染图表
  175 |       await page.evaluate(() => {
  176 |         const chartData = {
  177 |           labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
  178 |           datasets: [{ name: '销售额', values: [12000, 15000, 18000, 14500, 20000, 22000] }],
  179 |           chartType: 'bar'
  180 |         };
  181 |         if (typeof window.__chartRenderChart === 'function') {
  182 |           window.__chartRenderChart(chartData);
  183 |         }
  184 |       });
  185 |       await page.waitForTimeout(1500);
  186 |     }
  187 | 
  188 |     // ========================================
  189 |     // 第五步：验证图表渲染
  190 |     // ========================================
  191 |     const canvas = page.locator('#dataChartCanvas');
  192 |     const placeholder = page.locator('#chartPlaceholder');
  193 | 
  194 |     await expect(canvas).toBeVisible({ timeout: 5000 });
  195 |     await expect(placeholder).toBeHidden();
  196 | 
  197 |     // 验证画布有实际尺寸
  198 |     const box = await canvas.boundingBox();
  199 |     expect(box.width).toBeGreaterThan(100);
  200 |     expect(box.height).toBeGreaterThan(100);
  201 | 
  202 |     console.log('✅ 图表渲染成功');
  203 | 
  204 |     // ========================================
  205 |     // 第六步：截图保存
  206 |     // ========================================
  207 |     await page.screenshot({
  208 |       path: 'tests/screenshots/chart-with-data.png',
  209 |       fullPage: true
  210 |     });
  211 | 
  212 |     console.log('✅ 截图已保存到 tests/screenshots/chart-with-data.png');
  213 |     console.log('✅ 图表拖拽功能测试全部通过！');
  214 |   });
  215 | 
  216 |   test('图形模式页面结构验证', async ({ page }) => {
  217 |     // 直接打开图形模式（不需要连接）
  218 |     await page.goto('http://localhost:5173/src/chart.html');
  219 |     await page.waitForLoadState('networkidle');
  220 |     await page.waitForTimeout(1000);
  221 | 
  222 |     // 验证关键元素存在
  223 |     await expect(page.locator('#fieldList')).toBeVisible();
  224 |     await expect(page.locator('#dimensionZone')).toBeVisible();
  225 |     await expect(page.locator('#metricZone')).toBeVisible();
  226 |     await expect(page.locator('#dataChartCanvas')).toBeVisible();
  227 |     await expect(page.locator('.chart-placeholder')).toBeVisible();
  228 |     await expect(page.locator('.chart-type-btn')).toHaveCount(3); // 柱状图、饼图、折线图
  229 | 
  230 |     console.log('✅ 图形模式页面结构完整');
  231 |   });
  232 | 
  233 |   test('SQLite 页面基础功能', async ({ page }) => {
  234 |     await page.goto('http://localhost:5173/src/sqlite.html');
  235 |     await page.waitForLoadState('networkidle');
  236 | 
  237 |     // 拖拽区域（ID: sqliteDropZone）
  238 |     await expect(page.locator('#sqliteDropZone')).toBeVisible();
  239 |     await expect(page.locator('#fileInput')).toBeAttached();
  240 | 
  241 |     // 上传测试数据库
  242 |     const testDbPath = path.resolve(__dirname, 'fixtures/test.db');
  243 |     await page.locator('#fileInput').setInputFiles(testDbPath);
  244 | 
  245 |     // 等待表选择区域
  246 |     const tableSection = page.locator('#tableSection');
> 247 |     await expect(tableSection).toBeVisible({ timeout: 10000 });
      |                                ^ Error: expect(locator).toBeVisible() failed
  248 | 
  249 |     // 表选择器里有选项（至少 2 个：默认空选项 + sales_data）
  250 |     const options = page.locator('#tableSelect option');
  251 |     await expect(options).not.toHaveCount(1); // 不只是默认的空选项
  252 | 
  253 |     console.log('✅ SQLite 页面上传和表列表功能正常');
  254 |   });
  255 | });
  256 | 
```