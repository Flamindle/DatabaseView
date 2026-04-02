var e=`http://localhost:3000`;async function t(e,t={}){try{return await(await fetch(e,{...t,headers:{"Content-Type":`application/json`,...t.headers}})).json()}catch(e){return{success:!1,message:e.message}}}function n(n){return t(`${e}/get-databases`,{method:`POST`,body:JSON.stringify(n)})}function r(n){return t(`${e}/connect`,{method:`POST`,body:JSON.stringify(n)})}async function i(t){try{let n=JSON.parse(localStorage.getItem(`mysql_viewer_config`)||`{}`);if(n.dbType===`sqlite`){if(!n.dbPath)return{success:!1,message:`未连接 SQLite 数据库`}}else if(!n.database)return{success:!1,message:`未连接数据库`};let r=await(await fetch(`${e}/connect`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(n)})).json();return r.success?await(await fetch(`${e}/query-table`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({tableName:t.tableName,page:t.page||1,pageSize:t.pageSize||500,dbType:n.dbType||`mysql`})})).json():{success:!1,message:`连接数据库失败：`+r.message}}catch(e){return{success:!1,message:e.message}}}var a=`mysql_viewer_config`,o=`mysql_viewer_dashboard`;function s(e){localStorage.setItem(a,JSON.stringify(e))}function c(){let e=localStorage.getItem(a);if(e)try{return JSON.parse(e)}catch{return null}return null}function l(e){localStorage.setItem(o,JSON.stringify({version:1,...e,updatedAt:Date.now()}))}function u(){let e=localStorage.getItem(o);if(e)try{return JSON.parse(e)}catch{return null}return null}var d=`http://localhost:3000`,f={},p=null,m=`mysql`;function h(e,t={}){p=t.onTablesLoaded,e.innerHTML=`
    <div class="connection-form">
      <!-- 数据库类型选择 -->
      <div class="form-group">
        <label>数据库类型</label>
        <select id="dbTypeSelect" style="min-width:120px;height:32px;padding:0 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;font-weight:600;">
          <option value="mysql">MySQL</option>
          <option value="sqlite">SQLite</option>
        </select>
      </div>

      <!-- MySQL 连接字段 -->
      <div id="mysqlFields" class="mysql-fields">
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
      </div>

      <!-- SQLite 连接字段 -->
      <div id="sqliteFields" class="sqlite-fields" style="display:none;width:100%;">
        <div class="form-group" style="width:100%;">
          <label>选择数据库文件</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="file" id="sqliteFileInput" accept=".db,.sqlite,.sqlite3" style="display:none;">
            <button type="button" class="btn-secondary" id="sqliteSelectBtn">选择文件</button>
            <span id="sqliteFileName" style="font-size:13px;color:var(--text-muted);">未选择文件</span>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-primary" id="connectBtn">连接</button>
        <button type="button" class="btn-secondary" id="disconnectBtn" disabled>断开</button>
        <button type="button" class="btn-secondary" id="debugBtn" title="打开调试面板">调试</button>
      </div>
    </div>
    <div id="message" class="message hidden"></div>
    <div id="debugPanel" style="display:none;margin-top:16px;padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--border);">
      <div style="font-weight:600;margin-bottom:8px;">调试信息</div>
      <div id="debugContent" style="font-size:12px;font-family:monospace;white-space:pre-wrap;word-break:break-all;"></div>
    </div>
  `,f={dbTypeSelect:document.getElementById(`dbTypeSelect`),mysqlFields:document.getElementById(`mysqlFields`),sqliteFields:document.getElementById(`sqliteFields`),host:document.getElementById(`host`),port:document.getElementById(`port`),user:document.getElementById(`user`),password:document.getElementById(`password`),database:document.getElementById(`database`),getDbBtn:document.getElementById(`getDbBtn`),sqliteFileInput:document.getElementById(`sqliteFileInput`),sqliteSelectBtn:document.getElementById(`sqliteSelectBtn`),sqliteFileName:document.getElementById(`sqliteFileName`),connectBtn:document.getElementById(`connectBtn`),disconnectBtn:document.getElementById(`disconnectBtn`),debugBtn:document.getElementById(`debugBtn`),message:document.getElementById(`message`)},g(),v()}function g(){let e=c();e&&(f.host.value=e.host||`localhost`,f.port.value=e.port||`3306`,f.user.value=e.user||`root`,f.password.value=e.password||``,e.dbType&&(m=e.dbType,f.dbTypeSelect.value=e.dbType,_()))}function _(){let e=f.dbTypeSelect.value===`mysql`;f.mysqlFields.style.display=e?``:`none`,f.sqliteFields.style.display=e?`none`:``,m=e?`mysql`:`sqlite`}function v(){f.dbTypeSelect.addEventListener(`change`,()=>{_(),y()}),f.getDbBtn.addEventListener(`click`,C),f.database.addEventListener(`change`,()=>{f.connectBtn.disabled=!1,y()}),f.sqliteSelectBtn.addEventListener(`click`,()=>{f.sqliteFileInput.click()}),f.sqliteFileInput.addEventListener(`change`,()=>{let e=f.sqliteFileInput.files[0];e?(f.sqliteFileName.textContent=e.name,f.sqliteFileName.style.color=`var(--success)`,f.connectBtn.disabled=!1):(f.sqliteFileName.textContent=`未选择文件`,f.sqliteFileName.style.color=`var(--text-muted)`,f.connectBtn.disabled=!0)}),f.connectBtn.addEventListener(`click`,w),f.disconnectBtn.addEventListener(`click`,D),f.debugBtn.addEventListener(`click`,x)}function y(){s({dbType:m,host:f.host.value,port:f.port.value,user:f.user.value,password:f.password.value,database:f.database.value})}var b=!1;function x(){b=!b;let e=document.getElementById(`debugPanel`);e&&(e.style.display=b?`block`:`none`)}function S(e,t=!0){f.message.textContent=e,f.message.className=`message ${t?`success`:`error`}`}async function C(){let e={host:f.host.value.trim(),port:f.port.value.trim(),user:f.user.value.trim(),password:f.password.value.trim()};if(!e.host||!e.port||!e.user){S(`请填写主机、端口、用户名`,!1);return}y();let t=await n(e);t.success?(S(t.message),f.database.innerHTML=`<option value="">请选择数据库</option>`,t.databases.forEach(e=>{let t=document.createElement(`option`);t.value=e,t.textContent=e,f.database.appendChild(t)}),f.database.disabled=!1):S(t.message,!1)}async function w(){m===`mysql`?await T():await E()}async function T(){let e=f.database.value.trim();if(!e){S(`请选择数据库`,!1);return}let t={dbType:`mysql`,host:f.host.value.trim(),port:f.port.value.trim(),user:f.user.value.trim(),password:f.password.value.trim(),database:e};y();let n=await r(t);n.success?(S(n.message),f.connectBtn.disabled=!0,f.disconnectBtn.disabled=!1,window.dispatchEvent(new CustomEvent(`dbTablesLoaded`,{detail:{tables:n.tables,dbType:`mysql`}})),p&&p(n.tables)):S(n.message,!1)}async function E(){let e=f.sqliteFileInput.files[0];if(!e){S(`请先选择数据库文件`,!1);return}S(`正在连接...`);try{let t=await e.arrayBuffer(),n=new Uint8Array(t),r=await(await fetch(`${d}/connect-binary`,{method:`POST`,headers:{"Content-Type":`application/octet-stream`},body:n})).json();r.success?(S(`连接成功，共 ${r.tables.length} 个表`),f.connectBtn.disabled=!0,f.disconnectBtn.disabled=!1,window.dispatchEvent(new CustomEvent(`dbTablesLoaded`,{detail:{tables:r.tables,dbType:`sqlite`}})),p&&p(r.tables)):S(r.message,!1)}catch(e){S(`连接失败：`+e.message,!1)}}async function D(){try{let e=await(await fetch(`${d}/disconnect`,{method:`POST`,headers:{"Content-Type":`application/json`}})).json();e.success?(S(`已断开连接`),f.connectBtn.disabled=!1,f.disconnectBtn.disabled=!0,m===`sqlite`&&(f.sqliteFileInput.value=``,f.sqliteFileName.textContent=`未选择文件`,f.sqliteFileName.style.color=`var(--text-muted)`),window.dispatchEvent(new CustomEvent(`dbDisconnected`))):S(e.message,!1)}catch(e){S(`断开失败：`+e.message,!1)}}export{l as a,s as i,c as n,i as o,u as r,h as t};