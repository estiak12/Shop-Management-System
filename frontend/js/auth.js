// frontend/js/auth.js
// Session storage + page guards. Depends on api.js's TOKEN_KEY/USER_KEY.

const auth = {
  saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isAdmin() {
    const user = this.getUser();
    return !!user && user.role === 'admin';
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/pages/login.html';
  },

  /**
   * Call at the top of every protected page.
   * Redirects to login if there's no session, and (optionally) if the
   * user's role isn't in `allowedRoles`.
   * @param {string[]} [allowedRoles] - e.g. ['admin']. Omit to allow any logged-in user.
   */
  requireAuth(allowedRoles = null) {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      window.location.href = '/pages/login.html';
      return null;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Logged in, but not allowed on this page — send them somewhere they can use.
      window.location.href = '/pages/dashboard.html';
      return null;
    }

    return user;
  },

  /** If already logged in, skip the login page and go straight to the dashboard. */
  redirectIfLoggedIn() {
    if (this.getToken() && this.getUser()) {
      window.location.href = '/pages/dashboard.html';
    }
  }
};
