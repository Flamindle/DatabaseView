var e=`http://localhost:3000`;async function t(e,t={}){try{return await(await fetch(e,{...t,headers:{"Content-Type":`application/json`,...t.headers}})).json()}catch(e){return{success:!1,message:e.message}}}function n(n){return t(`${e}/get-databases`,{method:`POST`,body:JSON.stringify(n)})}function r(n){return t(`${e}/connect`,{method:`POST`,body:JSON.stringify(n)})}async function i(t){try{let n=JSON.parse(localStorage.getItem(`mysql_viewer_config`)||`{}`);if(n.dbType===`sqlite`){if(!n.dbPath)return{success:!1,message:`未连接 SQLite 数据库`}}else if(!n.database)return{success:!1,message:`未连接数据库`};let r=await(await fetch(`${e}/connect`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)})).json();return r.success?await(await fetch(`${e}/query-table`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({tableName:t.tableName,page:t.page||1,pageSize:t.pageSize||500,dbType:n.dbType||`mysql`})})).json():{success:!1,message:`连接数据库失败：`+r.message}}catch(e){return{success:!1,message:e.message}}}var a=`mysql_viewer_config`,o=`mysql_viewer_dashboard`;function s(e){localStorage.setItem(a,JSON.stringify(e))}function c(){let e=localStorage.getItem(a);if(e)try{return JSON.parse(e)}catch{return null}return null}function l(e){localStorage.setItem(o,JSON.stringify({version:1,...e,updatedAt:Date.now()}))}function u(){let e=localStorage.getItem(o);if(e)try{return JSON.parse(e)}catch{return null}return null}var d={},f=null;function p(e,t={}){f=t.onTablesLoaded,e.innerHTML=`
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
        <div class="db-select-row">
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
    <div id="debugPanel" style="display:none;margin-top:16px;padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--border);">
      <div style="font-weight:600;margin-bottom:8px;">调试信息</div>
      <div id="debugContent" style="font-size:12px;font-family:monospace;white-space:pre-wrap;word-break:break-all;"></div>
    </div>
  `,d={host:document.getElementById(`host`),port:document.getElementById(`port`),user:document.getElementById(`user`),password:document.getElementById(`password`),database:document.getElementById(`database`),getDbBtn:document.getElementById(`getDbBtn`),connectBtn:document.getElementById(`connectBtn`),disconnectBtn:document.getElementById(`disconnectBtn`),debugBtn:document.getElementById(`debugBtn`),message:document.getElementById(`message`)},m(),h()}function m(){let e=c();e&&(d.host.value=e.host||`localhost`,d.port.value=e.port||`3306`,d.user.value=e.user||`root`,d.password.value=e.password||``)}function h(){d.getDbBtn.addEventListener(`click`,b),d.database.addEventListener(`change`,()=>{d.connectBtn.disabled=!d.database.value,g()}),d.connectBtn.addEventListener(`click`,x),d.debugBtn.addEventListener(`click`,v)}function g(){s({host:d.host.value,port:d.port.value,user:d.user.value,password:d.password.value,database:d.database.value})}var _=!1;function v(){_=!_;let e=document.getElementById(`debugPanel`);e&&(e.style.display=_?`block`:`none`)}function y(e,t=!0){d.message.textContent=e,d.message.className=`message ${t?`success`:`error`}`}async function b(){let e={host:d.host.value.trim(),port:d.port.value.trim(),user:d.user.value.trim(),password:d.password.value.trim()};if(!e.host||!e.port||!e.user){y(`请填写主机、端口、用户名`,!1);return}g();let t=await n(e);t.success?(y(t.message),d.database.innerHTML=`<option value="">请选择数据库</option>`,t.databases.forEach(e=>{let t=document.createElement(`option`);t.value=e,t.textContent=e,d.database.appendChild(t)}),d.database.disabled=!1):y(t.message,!1)}async function x(){let e=d.database.value.trim();if(!e){y(`请选择数据库`,!1);return}let t={dbType:`mysql`,host:d.host.value.trim(),port:d.port.value.trim(),user:d.user.value.trim(),password:d.password.value.trim(),database:e};g();let n=await r(t);n.success?(y(n.message),d.connectBtn.disabled=!0,d.disconnectBtn.disabled=!1,window.dispatchEvent(new CustomEvent(`dbTablesLoaded`,{detail:{tables:n.tables,dbType:`mysql`}})),f&&f(n.tables)):y(n.message,!1)}export{l as a,s as i,c as n,i as o,u as r,p as t};