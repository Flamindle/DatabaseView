import{n as e,r as t,s as n,t as r}from"./ThemeToggle-Bwh_Oo5m.js";import{n as i,t as a}from"./chart-CosCFBAV.js";a.register(...i);var o=null,s=`bar`;function c(e,t={}){l(e)}function l(e){e.innerHTML=`
    <div class="chart-view">
      <!-- 左侧字段面板 -->
      <div class="chart-field-panel">
        <div class="panel-header">
          <h4>可用字段</h4>
          <button type="button" class="refresh-btn" id="refreshFieldsBtn" title="刷新字段">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
          </button>
        </div>
        <div class="field-list" id="fieldList">
          <!-- 字段会动态生成 -->
        </div>

        <!-- 字段拖放说明 -->
        <div class="field-hint">
          <span class="hint-icon">💡</span>
          <span>拖拽字段到维度或指标区域</span>
        </div>
      </div>

      <!-- 右侧图表区域 -->
      <div class="chart-canvas-area">
        <!-- 图表类型选择 -->
        <div class="chart-type-bar">
          <span class="type-label">图表类型：</span>
          <div class="chart-type-buttons">
            <button type="button" class="chart-type-btn active" data-type="bar" title="柱状图">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <rect x="3" y="12" width="4" height="9"/>
                <rect x="10" y="6" width="4" height="15"/>
                <rect x="17" y="3" width="4" height="18"/>
              </svg>
              <span class="btn-text">柱状图</span>
            </button>
            <button type="button" class="chart-type-btn" data-type="pie" title="饼图">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
                <path d="M12 3v9l7 5"/>
              </svg>
              <span class="btn-text">饼图</span>
            </button>
            <button type="button" class="chart-type-btn" data-type="line" title="折线图">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <span class="btn-text">折线图</span>
            </button>
          </div>
        </div>

        <!-- 图表配置区域 -->
        <div class="chart-config-area">
          <!-- 维度区域 -->
          <div class="config-row">
            <div class="config-zone dimension-zone" id="dimensionZone">
              <div class="zone-label">
                <span class="zone-icon">📊</span>
                <span>维度（横轴/标签）</span>
              </div>
              <div class="dropped-fields" id="dimensionFields">
                <!-- 拖放的维度字段 -->
              </div>
            </div>
            <div class="config-zone metric-zone" id="metricZone">
              <div class="zone-label">
                <span class="zone-icon">📈</span>
                <span>指标（数值）</span>
              </div>
              <div class="dropped-fields" id="metricFields">
                <!-- 拖放的指标字段 -->
              </div>
            </div>
          </div>
        </div>

        <!-- 图表画布 -->
        <div class="chart-canvas" id="chartCanvas">
          <canvas id="dataChartCanvas"></canvas>
          <div class="chart-placeholder" id="chartPlaceholder">
            <div class="placeholder-icon">📊</div>
            <p>拖拽字段到上方区域生成图表</p>
            <p class="placeholder-hint">维度用于分类/标签，指标用于数值计算</p>
          </div>
        </div>
      </div>
    </div>
  `,u()}function u(){document.querySelectorAll(`.chart-type-btn`).forEach(e=>{e.addEventListener(`click`,()=>{document.querySelectorAll(`.chart-type-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),s=e.dataset.type,b()})})}var d=null,f=null,p=null,m=null;function h(e){let t=e.target.closest(`.field-item`);t&&(f={name:t.dataset.field,type:t.dataset.type},d=document.createElement(`div`),d.className=`drag-ghost`,d.textContent=f.name,d.style.cssText=`position:fixed;pointer-events:none;z-index:9999;top:${e.clientY-20}px;left:${e.clientX-60}px;`,document.body.appendChild(d),t.classList.add(`dragging`),p=e=>{d&&(d.style.left=e.clientX-60+`px`,d.style.top=e.clientY-20+`px`,g(e.clientX,e.clientY))},m=e=>{if(p&&=(document.removeEventListener(`mousemove`,p),null),m&&=(document.removeEventListener(`mouseup`,m),null),d&&=(d.remove(),null),t.classList.remove(`dragging`),_(),f){let t=v(e.clientX,e.clientY);if(t){if(t.id===`metricFields`&&f.type!==`number`){f=null;return}y(t,f),b()}}f=null},document.addEventListener(`mousemove`,p),document.addEventListener(`mouseup`,m))}function g(e,t){_();let n=document.elementFromPoint(e,t);if(!n)return;let r=n.closest(`.dimension-zone, .metric-zone`);r&&r.classList.add(`drop-zone-hover`)}function _(){document.querySelectorAll(`.drop-zone-hover`).forEach(e=>e.classList.remove(`drop-zone-hover`))}function v(e,t){let n=document.elementFromPoint(e,t);if(!n)return null;let r=n.closest(`.dimension-zone, .metric-zone`);return r?r.querySelector(`.dropped-fields`):null}function y(e,t){if(e.querySelector(`[data-field="${t.name}"]`))return;let n=document.createElement(`div`);n.className=`dropped-field`,n.dataset.field=t.name,n.dataset.type=t.type,n.innerHTML=`
    <span class="field-name">${t.name}</span>
    <button type="button" class="remove-field" title="移除">×</button>
  `,n.querySelector(`.remove-field`).addEventListener(`click`,()=>{n.remove(),b()}),e.appendChild(n),e.classList.add(`has-field`)}function b(){let e=document.getElementById(`dimensionFields`),t=document.getElementById(`metricFields`);if(!e||!t)return;let n=Array.from(e.querySelectorAll(`.dropped-field`)).map(e=>({name:e.dataset.field,type:e.dataset.type})),r=Array.from(t.querySelectorAll(`.dropped-field`)).map(e=>({name:e.dataset.field,type:e.dataset.type})),i=new CustomEvent(`chartConfigChange`,{detail:{dimensions:n,metrics:r,chartType:s}});document.dispatchEvent(i)}function x(e,t){let{labels:n,datasets:r,chartType:i}=e,c=document.getElementById(`dataChartCanvas`),l=document.getElementById(`chartPlaceholder`);if(!n||n.length===0||!r||r.length===0){l.style.display=`flex`,c.style.display=`none`;return}l.style.display=`none`,c.style.display=`block`,o&&o.destroy();let u=C();o=new a(c,S(i||s,n,r,u))}function S(e,t,n,r){let i={responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:e===`pie`||n.length>1,position:`right`},tooltip:{trigger:e===`pie`?`item`:`axis`}}},a=n.map((t,n)=>{let i=r[n%r.length],a={label:t.name};return e===`bar`?{...a,data:t.values,backgroundColor:i,borderRadius:4}:e===`line`?{...a,data:t.values,borderColor:i,backgroundColor:i+`33`,fill:!0,tension:.3}:{label:`数值`,data:t.values,backgroundColor:r,borderWidth:2,borderColor:`#fff`}});e===`pie`&&(a[0].data=n[0].values,a[0].label=n[0].name);let o={type:e,data:{labels:t,datasets:a},options:i};return e!==`pie`&&(o.options.scales={x:{ticks:{maxRotation:45}},y:{beginAtZero:!0}}),o}function C(){let e=document.body.classList.contains(`dark-theme`),t=document.body.classList.contains(`sepia-theme`),n=document.body.classList.contains(`pink-theme`);return e?[`#60a5fa`,`#34d399`,`#fbbf24`,`#f87171`,`#a78bfa`,`#fb923c`]:t?[`#5b8a72`,`#c17f59`,`#8b7355`,`#d4a574`,`#7d9f85`,`#b8860b`]:n?[`#f472b6`,`#c084fc`,`#fb7185`,`#818cf8`,`#e879f9`,`#fb923c`]:[`#667eea`,`#764ba2`,`#f093fb`,`#4facfe`,`#43e97b`,`#fa709a`]}function w(e){let t=document.getElementById(`fieldList`);t&&(t.innerHTML=e.map(e=>`
    <div class="field-item ${e.type}" data-field="${e.name}" data-type="${e.type}">
      <span class="field-icon">${T(e.type)}</span>
      <span class="field-name">${e.name}</span>
      <span class="field-type">${E(e.type)}</span>
    </div>
  `).join(``),t.querySelectorAll(`.field-item`).forEach(e=>{e.addEventListener(`mousedown`,h)}))}function T(e){return e===`number`?`📈`:e===`date`?`📅`:`📝`}function E(e){return e===`number`?`数值`:e===`date`?`日期`:`文本`}var D={connection:null,currentTable:``,lastQueryResult:null,chartViewReady:!1};async function O(){r(),document.getElementById(`backBtn`).addEventListener(`click`,()=>{window.close(),window.location.href=`/`}),e(document.getElementById(`connectionForm`),{onTablesLoaded(e){D.connection=t()||{},F(),I()}}),c(document.getElementById(`chartViewContainer`),{onReady:()=>{D.chartViewReady=!0}}),await k(),document.addEventListener(`chartConfigChange`,N)}async function k(){let e=t();if(e){if(e.dbType===`sqlite`&&e.dbPath){await A();return}if(e.host)try{let t=await(await fetch(`http://localhost:3000/get-databases`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({host:e.host,port:e.port,user:e.user,password:e.password||``})})).json();if(!t.success)return;let n=document.getElementById(`database`);n&&(n.innerHTML=`<option value="">请选择数据库</option>`,t.databases.forEach(e=>{let t=document.createElement(`option`);t.value=e,t.textContent=e,n.appendChild(t)}),n.disabled=!1,e.database&&t.databases.includes(e.database)&&(n.value=e.database,await A()))}catch(e){console.error(`恢复连接失败`,e)}}}async function A(){let e=t();if(!(!e||!e.database))try{if(!(await(await fetch(`http://localhost:3000/connect`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)})).json()).success)return;document.getElementById(`connectionSection`).style.display=`none`,F(),e.tableName&&(D.currentTable=e.tableName,await j(e.tableName))}catch(e){console.error(`连接失败`,e)}}async function j(e){if(e)try{let t=await n({tableName:e,page:1,pageSize:500});t.success&&t.data&&t.data.length>0?(D.lastQueryResult={fields:t.fields,data:t.data},w(M(t.fields,t.data)),L(`已加载 ${e}，共 ${t.data.length} 条记录`)):L(`该表无数据`,!1)}catch(e){L(`加载数据失败：`+e.message,!1)}}function M(e,t){return!t||t.length===0?e.map(e=>({name:e,type:`text`})):e.map(e=>{let n=t.find(t=>t[e]!=null);if(!n)return{name:e,type:`text`};let r=n[e];return typeof r==`number`||!isNaN(parseFloat(r))?{name:e,type:`number`}:r instanceof Date||typeof r==`string`&&/^\d{4}-\d{2}-\d{2}/.test(r)?{name:e,type:`date`}:{name:e,type:`text`}})}function N(e){let{dimensions:t,metrics:n,chartType:r}=e.detail;if(!D.lastQueryResult)return;let{data:i}=D.lastQueryResult,a=P(i,t,n);a.labels.length>0&&x({labels:a.labels,datasets:a.datasets,chartType:r||`bar`})}function P(e,t,n){let r=t.map(e=>typeof e==`object`?e.name:e),i=n.map(e=>typeof e==`object`?e.name:e);if(!r.length||!i.length)return{labels:[],datasets:[]};let a=[],o=i.map(e=>({name:e,values:[]}));return e.forEach(e=>{let t=r.map(t=>{let n=e[t];return n==null?``:String(n)}).join(` / `);(a.length===0||a[a.length-1]!==t)&&a.push(t),i.forEach((t,n)=>{let r=e[t],i=parseFloat(r);o[n].values.push(isNaN(i)?0:Math.round(i*100)/100)})}),{labels:a,datasets:o}}function F(){let e=t(),n=document.getElementById(`datasourceInfo`);e&&(e.dbType===`sqlite`&&e.dbPath?(n.textContent=`SQLite: ${e.dbPath.split(/[/\\]/).pop()}`,n.className=`datasource-info connected`):e.database?(n.textContent=`${e.host}/${e.database}`,n.className=`datasource-info connected`):(n.textContent=`未连接数据库`,n.className=`datasource-info`))}function I(){document.getElementById(`chartViewContainer`).style.display=``}function L(e,t=!0){let n=document.getElementById(`message`);n&&(n.textContent=e,n.className=`message ${t?`success`:`error`}`,n.style.display=`block`,setTimeout(()=>{n.style.display=`none`},3e3))}document.addEventListener(`DOMContentLoaded`,O);