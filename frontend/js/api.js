// frontend/js/api.js
// Single fetch wrapper: attaches the JWT, parses JSON, and normalizes errors
// so every page can just do `await api.get('/products')`.

const API_BASE_URL = '/api';
const TOKEN_KEY = 'sms_token';
const USER_KEY = 'sms_user';

const api = {
  /**
   * Core request helper.
   * @param {string} path - e.g. '/products' (relative to /api)
   * @param {object} options - { method, body, isFormData }
   */
  async request(path, options = {}) {
    const { method = 'GET', body = null, isFormData = false } = options;
    const token = localStorage.getItem(TOKEN_KEY);

    const headers = {};
    if (!isFormData) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
      });
    } catch (networkErr) {
      throw new Error('Cannot reach the server. Is the backend running?');
    }

    // 401 anywhere: the session is gone — clear it and bounce to login,
    // except when we're already ON the login page (avoid a redirect loop
    // while the user is just typing a wrong password).
    if (res.status === 401) {
      const onLoginPage = window.location.pathname.endsWith('/login.html');
      if (!onLoginPage) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/pages/login.html';
        return new Promise(() => {}); // halt further handling; redirect is in flight
      }
    }

    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    }

    if (!res.ok) {
      const message = (data && data.error) || `Request failed (${res.status}).`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  },

  get(path) {
    return this.request(path, { method: 'GET' });
  },
  post(path, body, opts = {}) {
    return this.request(path, { method: 'POST', body, ...opts });
  },
  put(path, body, opts = {}) {
    return this.request(path, { method: 'PUT', body, ...opts });
  },
  delete(path) {
    return this.request(path, { method: 'DELETE' });
  }
};
