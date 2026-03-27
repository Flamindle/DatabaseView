/**
 * 登录模态框组件
 */
import { login as apiLogin, logout as apiLogout, getAuthStatus } from '../../services/djangoApi.js';
import './LoginModal.css';

let callbacks = {
  onLoginSuccess: () => {},
  onLogoutSuccess: () => {},
  onAuthChange: () => {}
};

let isLoggedIn = false;
let currentUser = null;

/**
 * 初始化登录模块
 */
function init(cbs) {
  callbacks = { ...callbacks, ...cbs };
  createLoginModalDOM();
  // 页面加载时检查登录状态
  checkAuthStatus();
}

/**
 * 创建登录模态框 DOM
 */
function createLoginModalDOM() {
  if (document.getElementById('loginModal')) return;

  const modal = document.createElement('div');
  modal.id = 'loginModal';
  modal.className = 'login-modal-overlay hidden';
  modal.innerHTML = `
    <div class="login-modal">
      <div class="login-modal-header">
        <h3>管理员登录</h3>
        <button type="button" class="modal-close" id="loginModalClose">&times;</button>
      </div>
      <div class="login-modal-body">
        <form id="loginForm">
          <div class="form-field">
            <label for="loginUsername">用户名</label>
            <input type="text" id="loginUsername" name="username" required autocomplete="username">
          </div>
          <div class="form-field">
            <label for="loginPassword">密码</label>
            <input type="password" id="loginPassword" name="password" required autocomplete="current-password">
          </div>
          <div class="form-error" id="loginError"></div>
        </form>
      </div>
      <div class="login-modal-footer">
        <button type="button" class="btn-secondary" id="loginCancelBtn">取消</button>
        <button type="button" class="btn-primary" id="loginSubmitBtn">登录</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // 绑定事件
  document.getElementById('loginModalClose').addEventListener('click', hideLoginModal);
  document.getElementById('loginCancelBtn').addEventListener('click', hideLoginModal);
  document.getElementById('loginSubmitBtn').addEventListener('click', handleLogin);

  // 回车登录
  document.getElementById('loginForm').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  });

  // 点击遮罩关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideLoginModal();
  });
}

/**
 * 检查登录状态
 */
async function checkAuthStatus() {
  const result = await getAuthStatus();
  isLoggedIn = result.success && result.data && result.data.is_authenticated;
  currentUser = isLoggedIn ? result.data.username : null;

  updateLoginButton();
  callbacks.onAuthChange({ isLoggedIn, username: currentUser });
}

/**
 * 更新登录按钮状态
 */
function updateLoginButton() {
  const btn = document.getElementById('authBtn');
  if (!btn) return;

  if (isLoggedIn) {
    btn.textContent = `退出 (${currentUser})`;
    btn.classList.add('logged-in');
  } else {
    btn.textContent = '登录';
    btn.classList.remove('logged-in');
  }
}

/**
 * 显示登录模态框
 */
function showLoginModal() {
  const modal = document.getElementById('loginModal');
  if (!modal) return;

  // 清空表单和错误
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginError').style.display = 'none';

  modal.classList.remove('hidden');
  document.getElementById('loginUsername').focus();
}

/**
 * 隐藏登录模态框
 */
function hideLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * 处理登录
 */
async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  const submitBtn = document.getElementById('loginSubmitBtn');

  if (!username || !password) {
    errorEl.textContent = '用户名和密码不能为空';
    errorEl.style.display = 'block';
    return;
  }

  // 禁用按钮，防止重复点击
  submitBtn.disabled = true;
  submitBtn.textContent = '登录中...';

  try {
    const result = await apiLogin(username, password);

    if (result.success) {
      hideLoginModal();
      isLoggedIn = true;
      currentUser = result.data.username;
      updateLoginButton();
      callbacks.onLoginSuccess(result.data);
      callbacks.onAuthChange({ isLoggedIn: true, username: currentUser });
    } else {
      errorEl.textContent = result.message || '登录失败';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = `请求失败: ${err.message}`;
    errorEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '登录';
  }
}

/**
 * 处理登出
 */
async function handleLogout() {
  try {
    await apiLogout();
  } catch (e) {
    console.error('登出请求失败:', e);
  }
  isLoggedIn = false;
  currentUser = null;
  updateLoginButton();
  callbacks.onLogoutSuccess();
  callbacks.onAuthChange({ isLoggedIn: false, username: null });
}

/**
 * 获取当前登录状态
 */
function getLoginState() {
  return { isLoggedIn, username: currentUser };
}

export { init, showLoginModal, hideLoginModal, checkAuthStatus, handleLogout, getLoginState };
