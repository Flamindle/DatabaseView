import{t as e}from"./ThemeToggle-Dsn7mdR_.js";import{a as t,n,o as r,r as i,t as a}from"./ConnectionForm-evP68P2t.js";import{n as o,t as s}from"./chart-6Dgdad7Y.js";function c(e,t,n){if(!e||e.length===0||!t||!t.length||!n||!n.length)return{labels:[],datasets:[]};let r=[],i=new Map,a=n.map(e=>({name:e,values:[]}));return e.forEach(e=>{let n=t.map(t=>{let n=e[t];return n==null?``:String(n)}).join(` / `);i.has(n)||(i.set(n,r.length),r.push(n))}),r.forEach((e,t)=>{a.forEach(e=>{e.values.push(0)})}),e.forEach(e=>{let r=t.map(t=>{let n=e[t];return n==null?``:String(n)}).join(` / `),o=i.get(r);n.forEach((t,n)=>{let r=e[t],i=parseFloat(r);isNaN(i)||(a[n].values[o]=Math.round(i*100)/100)})}),{labels:r,datasets:a}}function l(e,t){if(!e||e.length===0)return`text`;let n=e.find(e=>e[t]!=null);if(!n)return`text`;let r=n[t];return typeof r==`number`||!isNaN(parseFloat(r))?`number`:r instanceof Date||typeof r==`string`&&/^\d{4}-\d{2}-\d{2}/.test(r)?`date`:`text`}s.register(...o);var u=class e{constructor(e,t={}){this.id=e.id,this.config=e,this.callbacks=t,this.chart=null,this.$el=null,this._createDOM(),this._renderChart()}static create(t,n){return new e(t,n)}_createDOM(){let e=document.createElement(`div`);e.className=`dashboard-card`,e.dataset.cardId=this.id,e.innerHTML=`
      <div class="card-header">
        <div class="card-drag-handle" title="拖拽排序">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <circle cx="9" cy="6" r="1.5"/>
            <circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/>
            <circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/>
            <circle cx="15" cy="18" r="1.5"/>
          </svg>
        </div>
        <span class="card-title">${this.config.title||`未命名图表`}</span>
        <div class="card-actions">
          <button type="button" class="card-action-btn" data-type="bar" title="柱状图">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <rect x="3" y="12" width="4" height="9"/>
              <rect x="10" y="6" width="4" height="15"/>
              <rect x="17" y="3" width="4" height="18"/>
            </svg>
          </button>
          <button type="button" class="card-action-btn" data-type="line" title="折线图">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </button>
          <button type="button" class="card-action-btn" data-type="pie" title="饼图">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 2a10 10 0 0 1 10 10H12V2z"/>
            </svg>
          </button>
          <button type="button" class="card-action-btn card-edit-btn" title="编辑">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button type="button" class="card-action-btn card-delete-btn" title="删除">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="card-body">
        <canvas id="cardChart_${this.id}"></canvas>
        <div class="card-loading" id="cardLoading_${this.id}" style="display:none;">
          <span>加载中...</span>
        </div>
        <div class="card-error" id="cardError_${this.id}" style="display:none;"></div>
      </div>
    `,this.$el=e,this._bindCardEvents()}_bindCardEvents(){this.$el.querySelectorAll(`.card-action-btn[data-type]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.type;this.setChartType(t),this.callbacks.onChartTypeChange&&this.callbacks.onChartTypeChange(this.id,t)})});let e=this.$el.querySelector(`.card-edit-btn`);e&&e.addEventListener(`click`,()=>{this.callbacks.onEdit&&this.callbacks.onEdit(this.id)});let t=this.$el.querySelector(`.card-delete-btn`);t&&t.addEventListener(`click`,()=>{confirm(`确定要删除这张卡片吗？`)&&this.callbacks.onDelete&&this.callbacks.onDelete(this.id)})}async _renderChart(){let e=document.getElementById(`cardChart_${this.id}`),t=document.getElementById(`cardLoading_${this.id}`),n=document.getElementById(`cardError_${this.id}`);if(e){t.style.display=`flex`,e.style.display=`none`,n.style.display=`none`;try{let i=await r({tableName:this.config.tableName,dimensions:this.config.dimensions,metrics:this.config.metrics,page:1,pageSize:500});if(t.style.display=`none`,!i.success||!i.data||i.data.length===0){n.textContent=`无数据`,n.style.display=`flex`;return}let{labels:a,datasets:o}=c(i.data,this.config.dimensions,this.config.metrics);e.style.display=`block`,this._drawChart(e,a,o)}catch(e){t.style.display=`none`,n.textContent=`加载失败：`+e.message,n.style.display=`flex`}}}_drawChart(e,t,n){this.chart&&this.chart.destroy();let r=[`#667eea`,`#764ba2`,`#f093fb`,`#4facfe`,`#43e97b`,`#fa709a`,`#60a5fa`,`#34d399`,`#fbbf24`,`#f87171`,`#a78bfa`,`#fb923c`],i=this.config.chartType||`bar`,a=n.map((e,t)=>{let n=r[t%r.length];return i===`bar`?{label:e.name,data:e.values,backgroundColor:n,borderRadius:4}:i===`line`?{label:e.name,data:e.values,borderColor:n,backgroundColor:n+`33`,fill:!0,tension:.3}:{label:e.name,data:e.values,backgroundColor:r,borderWidth:2,borderColor:`#fff`}}),o={responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:i===`pie`||n.length>1,position:`right`},tooltip:{trigger:i===`pie`?`item`:`axis`}}};i!==`pie`&&(o.scales={x:{ticks:{maxRotation:45}},y:{beginAtZero:!0}}),this.chart=new s(e,{type:i,data:{labels:t,datasets:a},options:o})}setChartType(e){this.config.chartType=e,this._renderChart()}update(e){this.config={...this.config,...e};let t=this.$el.querySelector(`.card-title`);t&&(t.textContent=this.config.title||`未命名图表`),this._renderChart()}destroy(){this.chart&&=(this.chart.destroy(),null),this.$el&&=(this.$el.remove(),null)}},d=null,f=1,p={},m=[`选择数据源`,`选择维度`,`选择指标`,`图表设置`];function h(e,t){p=e?{...e}:{title:``,tableName:``,dimensions:[],metrics:[],chartType:`bar`},f=1,g(t)}function g(e){d&&d.remove(),d=document.createElement(`div`),d.className=`modal-overlay`,d.innerHTML=`
    <div class="modal-box" id="dashboardModalBox">
      <div class="modal-header">
        <h3 id="modalTitle">添加卡片</h3>
        <button type="button" class="modal-close" id="modalCloseBtn">&times;</button>
      </div>
      <div class="modal-steps" id="modalSteps">
        ${m.map((e,t)=>`<div class="step-dot ${t===0?`active`:``}" data-step="${t+1}">${t+1}</div>`).join(``)}
        ${m.map((e,t)=>`<div class="step-label ${t===0?`active`:``}" data-step="${t+1}">${e}</div>`).join(``)}
      </div>
      <div class="modal-body" id="modalBody"></div>
      <div class="modal-footer">
        <button type="button" class="btn-secondary" id="modalPrevBtn" style="display:none;">上一步</button>
        <button type="button" class="btn-primary" id="modalNextBtn">下一步</button>
      </div>
    </div>
  `,document.body.appendChild(d),document.getElementById(`modalCloseBtn`).addEventListener(`click`,_),d.addEventListener(`click`,e=>{e.target===d&&_()}),document.getElementById(`modalPrevBtn`).addEventListener(`click`,()=>v(-1,e)),document.getElementById(`modalNextBtn`).addEventListener(`click`,()=>v(1,e)),y(e)}function _(){d&&=(d.remove(),null)}function v(e,t){let n=f+e;if(!(n<1||n>m.length)){if(f===m.length&&e===1){if(!p.title||!p.tableName||p.dimensions.length===0||p.metrics.length===0){alert(`请填写完整信息`);return}t({...p}),_();return}f=n,y(t)}}function y(e){let t=document.getElementById(`modalBody`),n=document.getElementById(`modalPrevBtn`),r=document.getElementById(`modalNextBtn`),i=document.getElementById(`modalTitle`);switch(document.querySelectorAll(`.step-dot, .step-label`).forEach(e=>{let t=parseInt(e.dataset.step);e.classList.toggle(`active`,t===f)}),n.style.display=f>1?``:`none`,f===m.length?r.textContent=`确认添加`:r.textContent=`下一步`,i.textContent=f===1&&p.tableName?`编辑卡片`:`添加卡片`,f){case 1:b(t,e);break;case 2:x(t,e);break;case 3:S(t,e);break;case 4:C(t,e);break}}async function b(e,t){e.innerHTML=`
    <div class="form-group">
      <label>卡片标题</label>
      <input type="text" id="cardTitleInput" value="${p.title||``}" placeholder="例如：销售趋势">
    </div>
    <div class="form-group">
      <label>数据源表</label>
      <select id="tableSelect">
        <option value="">请选择数据表</option>
      </select>
    </div>
  `;let n=document.getElementById(`cardTitleInput`),r=document.getElementById(`tableSelect`);try{let e=localStorage.getItem(`mysql_viewer_config`),t=e?JSON.parse(e):{},n=await(await fetch(`http://localhost:3000/connect`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)})).json();n.success&&n.tables&&n.tables.forEach(e=>{let t=document.createElement(`option`);t.value=e,t.textContent=e,e===p.tableName&&(t.selected=!0),r.appendChild(t)})}catch{r.innerHTML=`<option value="">请先连接数据库</option>`}n.addEventListener(`input`,()=>{p.title=n.value}),r.addEventListener(`change`,()=>{p.tableName=r.value,p.dimensions=[],p.metrics=[]})}async function x(e,t){e.innerHTML=`<div class="step-loading">加载字段中...</div>`;try{let t=await(await fetch(`http://localhost:3000/query-table`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({tableName:p.tableName,page:1,pageSize:5})})).json();if(!t.success){e.innerHTML=`<div class="step-error">加载字段失败：`+t.message+`</div>`;return}let n=t.fields||[];t.data,p.dimensions=p.dimensions||[],e.innerHTML=`
      <div class="form-group">
        <label>选择维度字段（至少选1个）</label>
        <div class="field-checklist" id="dimensionChecklist">
          ${n.map(e=>`
            <label class="field-checkbox">
              <input type="checkbox" value="${e}" ${p.dimensions.includes(e)?`checked`:``}>
              <span>${e}</span>
            </label>
          `).join(``)}
        </div>
      </div>
    `,document.querySelectorAll(`#dimensionChecklist input`).forEach(e=>{e.addEventListener(`change`,()=>{p.dimensions=Array.from(document.querySelectorAll(`#dimensionChecklist input:checked`)).map(e=>e.value)})})}catch(t){e.innerHTML=`<div class="step-error">加载字段失败：`+t.message+`</div>`}}async function S(e,t){e.innerHTML=`<div class="step-loading">加载字段中...</div>`;try{let t=await(await fetch(`http://localhost:3000/query-table`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({tableName:p.tableName,page:1,pageSize:5})})).json();if(!t.success){e.innerHTML=`<div class="step-error">加载字段失败：`+t.message+`</div>`;return}let n=t.fields||[],r=t.data||[];p.metrics=p.metrics||[];let i=n.filter(e=>l(r,e)===`number`);if(i.length===0){e.innerHTML=`<div class="step-error">未找到数值类型字段</div>`;return}e.innerHTML=`
      <div class="form-group">
        <label>选择指标字段（至少选1个）</label>
        <div class="field-checklist" id="metricChecklist">
          ${i.map(e=>`
            <label class="field-checkbox">
              <input type="checkbox" value="${e}" ${p.metrics.includes(e)?`checked`:``}>
              <span>${e}</span>
            </label>
          `).join(``)}
        </div>
      </div>
    `,document.querySelectorAll(`#metricChecklist input`).forEach(e=>{e.addEventListener(`change`,()=>{p.metrics=Array.from(document.querySelectorAll(`#metricChecklist input:checked`)).map(e=>e.value)})})}catch(t){e.innerHTML=`<div class="step-error">加载字段失败：`+t.message+`</div>`}}function C(e,t){e.innerHTML=`
    <div class="form-group">
      <label>图表类型</label>
      <div class="chart-type-picker" id="chartTypePicker">
        <button type="button" class="type-btn ${p.chartType===`bar`?`active`:``}" data-type="bar">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <rect x="3" y="12" width="4" height="9"/>
            <rect x="10" y="6" width="4" height="15"/>
            <rect x="17" y="3" width="4" height="18"/>
          </svg>
          <span>柱状图</span>
        </button>
        <button type="button" class="type-btn ${p.chartType===`line`?`active`:``}" data-type="line">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span>折线图</span>
        </button>
        <button type="button" class="type-btn ${p.chartType===`pie`?`active`:``}" data-type="pie">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 2a10 10 0 0 1 10 10H12V2z"/>
          </svg>
          <span>饼图</span>
        </button>
      </div>
    </div>
    <div class="form-summary">
      <h4>配置摘要</h4>
      <div><strong>标题：</strong>${p.title||`未命名`}</div>
      <div><strong>数据源：</strong>${p.tableName}</div>
      <div><strong>维度：</strong>${p.dimensions.join(`，`)}</div>
      <div><strong>指标：</strong>${p.metrics.join(`，`)}</div>
    </div>
  `,document.querySelectorAll(`#chartTypePicker .type-btn`).forEach(e=>{e.addEventListener(`click`,()=>{document.querySelectorAll(`#chartTypePicker .type-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),p.chartType=e.dataset.type})})}var w=null,T=[],E={onCardAdd:null,onCardDelete:null,onCardUpdate:null};function D(e,t={}){E={...E,...t},w=e,O()}function O(){if(!w)return;let e=i()?.cards||[];w.innerHTML=`
    <div class="dashboard-header">
      <h3>仪表板</h3>
      <div class="dashboard-actions">
        <button type="button" class="btn-add-card" id="addCardBtn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8M8 12h8"/>
          </svg>
          添加卡片
        </button>
      </div>
    </div>
    <div class="dashboard-grid" id="dashboardGrid">
      ${e.length===0?`<div class="dashboard-empty">暂无卡片，点击"添加卡片"开始创建</div>`:``}
    </div>
  `,document.getElementById(`addCardBtn`).addEventListener(`click`,A),T=[],e.forEach(e=>{k(e)}),F()}function k(e){let t=document.getElementById(`dashboardGrid`);if(!t)return;let n=t.querySelector(`.dashboard-empty`);n&&n.remove();let r=u.create(e,{onDelete:j,onEdit:M,onChartTypeChange:N});t.appendChild(r.$el),T.push(r)}function A(){h(null,e=>{let n=i()||{cards:[]},r={id:`card_`+Date.now(),...e};n.cards.push(r),t(n),k(r)})}function j(e){let n=i();if(!n)return;n.cards=n.cards.filter(t=>t.id!==e),t(n);let r=T.find(t=>t.id===e);r&&r.$el&&r.$el.remove(),T=T.filter(t=>t.id!==e);let a=document.getElementById(`dashboardGrid`);a&&T.length===0&&(a.innerHTML=`<div class="dashboard-empty">暂无卡片，点击"添加卡片"开始创建</div>`)}function M(e){let n=i();if(!n)return;let r=n.cards.find(t=>t.id===e);r&&h(r,r=>{let i=n.cards.findIndex(t=>t.id===e);i>=0&&(n.cards[i]={...n.cards[i],...r},t(n));let a=T.find(t=>t.id===e);if(a){let e={...a.config,...r};a.update(e)}})}function N(e,n){let r=i();if(!r)return;let a=r.cards.findIndex(t=>t.id===e);a>=0&&(r.cards[a].chartType=n,t(r));let o=T.find(t=>t.id===e);o&&o.setChartType(n)}var P=null;function F(){let e=document.getElementById(`dashboardGrid`);e&&e.addEventListener(`mousedown`,I)}function I(e){let t=e.target.closest(`.card-drag-handle`);if(!t)return;let n=t.closest(`.dashboard-card`);if(!n)return;e.preventDefault();let r=n.cloneNode(!0);r.classList.add(`card-ghost`),r.style.cssText=`position:fixed;pointer-events:none;z-index:9999;width:${n.offsetWidth}px;top:${e.clientY-60}px;left:${e.clientX-n.offsetWidth/2}px;opacity:0.85;`,document.body.appendChild(r),n.classList.add(`card-dragging`),P={ghost:r,sourceEl:n,sourceId:n.dataset.cardId},document.addEventListener(`mousemove`,L),document.addEventListener(`mouseup`,z)}function L(e){if(!P)return;let{ghost:t}=P;t.style.top=e.clientY-60+`px`,t.style.left=e.clientX-t.offsetWidth/2+`px`,R(e.clientX,e.clientY)}function R(e,t){if(document.querySelectorAll(`.card-drop-target`).forEach(e=>e.classList.remove(`card-drop-target`)),!P)return;let{sourceEl:n}=P,r=Array.from(document.querySelectorAll(`.dashboard-card:not(.card-dragging)`));for(let e of r){let n=e.getBoundingClientRect(),r=n.top+n.height/2;if(t>=n.top&&t<=n.bottom){t<r?(e.classList.add(`card-drop-target`),P.targetBefore=e):(e.classList.add(`card-drop-target`),P.targetBefore=e.nextElementSibling);return}}P.targetBefore=null}function z(e){if(!P)return;document.removeEventListener(`mousemove`,L),document.removeEventListener(`mouseup`,z);let{ghost:t,sourceEl:n,sourceId:r,targetBefore:i}=P;t.remove(),n.classList.remove(`card-dragging`),document.querySelectorAll(`.card-drop-target`).forEach(e=>e.classList.remove(`card-drop-target`)),i&&i!==n&&(document.getElementById(`dashboardGrid`).insertBefore(n,i),B()),P=null}function B(){let e=i();if(!e)return;let n=document.getElementById(`dashboardGrid`);e.cards=Array.from(n.querySelectorAll(`.dashboard-card`)).map(e=>e.dataset.cardId).filter(Boolean).map(t=>e.cards.find(e=>e.id===t)).filter(Boolean),t(e)}async function V(){e(),document.getElementById(`backBtn`).addEventListener(`click`,()=>{window.close(),window.location.href=`/`}),a(document.getElementById(`connectionForm`),{onTablesLoaded(e){document.getElementById(`connectionSection`).style.display=`none`,W(),G()}}),await H()}async function H(){let e=n();if(e){if(e.dbType===`sqlite`&&e.dbPath){await U();return}if(e.host)try{let t=await(await fetch(`http://localhost:3000/get-databases`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({host:e.host,port:e.port,user:e.user,password:e.password||``})})).json();if(!t.success)return;let n=document.getElementById(`database`);n&&(n.innerHTML=`<option value="">请选择数据库</option>`,t.databases.forEach(e=>{let t=document.createElement(`option`);t.value=e,t.textContent=e,n.appendChild(t)}),n.disabled=!1,e.database&&t.databases.includes(e.database)&&(n.value=e.database,await U()))}catch(e){console.error(`恢复连接失败`,e)}}}async function U(){let e=n();if(e){if(e.dbType===`sqlite`){if(!e.dbPath)return}else if(!e.database)return;try{if(!(await(await fetch(`http://localhost:3000/connect`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)})).json()).success)return;document.getElementById(`connectionSection`).style.display=`none`,W(),G()}catch(e){console.error(`连接失败`,e)}}}function W(){let e=n(),t=document.getElementById(`datasourceInfo`);e&&(e.dbType===`sqlite`&&e.dbPath?(t.textContent=`SQLite: ${e.dbPath.split(/[/\\]/).pop()}`,t.className=`datasource-info connected`):e.database?(t.textContent=`${e.host}/${e.database}`,t.className=`datasource-info connected`):(t.textContent=`未连接数据库`,t.className=`datasource-info`))}function G(){let e=document.getElementById(`dashboardContainer`);e.style.display=``,D(e)}document.addEventListener(`DOMContentLoaded`,V);