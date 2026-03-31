(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`http://localhost:3000`;async function t(e,t={}){try{return await(await fetch(e,{...t,headers:{"Content-Type":`application/json`,...t.headers}})).json()}catch(e){return{success:!1,message:e.message}}}function n(n){return t(`${e}/get-databases`,{method:`POST`,body:JSON.stringify(n)})}function r(n){return t(`${e}/connect`,{method:`POST`,body:JSON.stringify(n)})}async function i(t){try{let n=JSON.parse(localStorage.getItem(`mysql_viewer_config`)||`{}`);if(!n.database)return{success:!1,message:`未连接数据库`};let r=await(await fetch(`${e}/connect`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)})).json();return r.success?await(await fetch(`${e}/query-table`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({tableName:t.tableName,page:t.page||1,pageSize:t.pageSize||500})})).json():{success:!1,message:`连接数据库失败：`+r.message}}catch(e){return{success:!1,message:e.message}}}var a=`mysql_viewer_config`,o=`mysql_viewer_dashboard`;function s(e){localStorage.setItem(a,JSON.stringify(e))}function c(){let e=localStorage.getItem(a);if(e)try{return JSON.parse(e)}catch{return null}return null}function l(e){localStorage.setItem(o,JSON.stringify({version:1,...e,updatedAt:Date.now()}))}function u(){let e=localStorage.getItem(o);if(e)try{return JSON.parse(e)}catch{return null}return null}var d={connection:{host:``,port:`3306`,user:`root`,password:``,database:``,connected:!1},databases:[],tables:[],currentTable:``,lastQueryResult:null,columnsConfig:[],viewMode:`full`,sortField:``,sortOrder:`ASC`},f=[];function p(e,t){let n=e.split(`.`),r=n.pop(),i=d;for(let e of n)i=i[e];let a=i[r];i[r]=t,f.forEach(n=>n(e,t,a))}var m={},h=null;function g(e,t={}){t.onDatabaseConnected,h=t.onTablesLoaded,e.innerHTML=`
    <div class="connection-form">
      <div class="form-group">
        <label>主机地址</label>
        <input type="text" id="host" value="localhost" placeholder="例如：127.0.0.1">
      </div>
      <div class="form-group">
        <label>端口号</label>
        <input type="number" id="port" value="3306" placeholder="默认3306">
      </div>
      <div class="form-group">
        <label>用户名</label>
        <input type="text" id="user" value="root" placeholder="例如：root">
      </div>
      <div class="form-group">
        <label>密码</label>
        <input type="password" id="password" placeholder="数据库密码">
      </div>
      <div class="form-group">
        <label>数据库</label>
        <div style="display:flex;gap:8px;align-items:center">
          <button type="button" class="btn-secondary" id="getDbBtn">获取列表</button>
          <select id="database" disabled>
            <option value="">请先获取数据库</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-primary" id="connectBtn" disabled>连接</button>
        <button type="button" class="btn-secondary" id="disconnectBtn" disabled>断开</button>
        <button type="button" class="btn-secondary" id="debugBtn" title="打开调试面板">调试</button>
      </div>
    </div>
    <div id="message" class="message hidden"></div>
    <div id="debugPanel" style="display:none;margin-top:16px;padding:12px;background:var(--bg-secondary);border-radius:8px;border:1px solid var(--border);">
      <div style="font-weight:600;margin-bottom:8px;">调试信息</div>
      <div id="debugContent" style="font-size:12px;font-family:monospace;white-space:pre-wrap;word-break:break-all;"></div>
    </div>
  `,m={host:document.getElementById(`host`),port:document.getElementById(`port`),user:document.getElementById(`user`),password:document.getElementById(`password`),database:document.getElementById(`database`),getDbBtn:document.getElementById(`getDbBtn`),connectBtn:document.getElementById(`connectBtn`),disconnectBtn:document.getElementById(`disconnectBtn`),debugBtn:document.getElementById(`debugBtn`),message:document.getElementById(`message`)},_(),v()}function _(){let e=c();e&&(m.host.value=e.host||`localhost`,m.port.value=e.port||`3306`,m.user.value=e.user||`root`,m.password.value=e.password||``)}function v(){m.getDbBtn.addEventListener(`click`,S),m.connectBtn.addEventListener(`click`,C),m.debugBtn.addEventListener(`click`,b)}var y=!1;function b(){y=!y;let e=document.getElementById(`debugPanel`);e&&(e.style.display=y?`block`:`none`)}function x(e,t=!0){m.message.textContent=e,m.message.className=`message ${t?`success`:`error`}`}async function S(){let e={host:m.host.value.trim(),port:m.port.value.trim(),user:m.user.value.trim(),password:m.password.value.trim()};if(!e.host||!e.port||!e.user){x(`请填写主机、端口、用户名`,!1);return}s(e);let t=await n(e);t.success?(x(t.message),m.database.innerHTML=`<option value="">请选择数据库</option>`,t.databases.forEach(e=>{let t=document.createElement(`option`);t.value=e,t.textContent=e,m.database.appendChild(t)}),m.database.disabled=!1,m.connectBtn.disabled=!1,p(`databases`,t.databases)):x(t.message,!1)}async function C(){let e={host:m.host.value.trim(),port:m.port.value.trim(),user:m.user.value.trim(),password:m.password.value.trim(),database:m.database.value.trim()};if(!e.database){x(`请选择数据库`,!1);return}s(e);let t=await r(e);t.success?(x(t.message),p(`connection`,{host:e.host,port:e.port,user:e.user,password:e.password,database:e.database,connected:!0}),h&&h(t.tables)):x(t.message,!1)}var w=[{key:`light`,label:`浅色`,color:`linear-gradient(135deg, #667eea, #764ba2)`},{key:`dark`,label:`深色`,color:`linear-gradient(135deg, #2c3e50, #4ca1af)`},{key:`green`,label:`护眼`,color:`linear-gradient(135deg, #11998e, #38ef7d)`},{key:`pink`,label:`粉色`,color:`linear-gradient(135deg, #ec4899, #f472b6)`}],T=0;function E(){let e=document.getElementById(`themeToggle`);if(!e)return;D(e),e.addEventListener(`click`,()=>{w.forEach(e=>document.documentElement.removeAttribute(`data-theme`)),T=(T+1)%w.length;let t=w[T];document.documentElement.setAttribute(`data-theme`,t.key),D(e),localStorage.setItem(`dbview-theme`,t.key)});let t=localStorage.getItem(`dbview-theme`);if(t){let e=w.findIndex(e=>e.key===t);e>=0&&(T=e,document.documentElement.setAttribute(`data-theme`,t))}D(e)}function D(e){let t=w[T];e.textContent=t.label,e.style.background=t.color}export{s as a,u as i,g as n,l as o,c as r,i as s,E as t};