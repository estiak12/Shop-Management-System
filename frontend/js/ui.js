// frontend/js/ui.js
// Tiny shared UI helpers: toasts. Kept dependency-free on purpose.

const ui = {
  ensureToastStack() {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  },

  /**
   * @param {string} message
   * @param {'success'|'error'|'warning'} [type]
   */
  toast(message, type = 'success') {
    const stack = this.ensureToastStack();
    const el = document.createElement('div');
    el.className = `toast ${type === 'success' ? '' : type}`.trim();
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 0.2s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 220);
    }, 3200);
  }
};
