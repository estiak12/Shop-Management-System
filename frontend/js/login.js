// frontend/js/login.js

auth.redirectIfLoggedIn();

const form = document.getElementById('login-form');
const alertBox = document.getElementById('login-alert');
const submitBtn = document.getElementById('login-submit');

function showAlert(message) {
  alertBox.innerHTML = `<div class="alert alert-error">${message}</div>`;
}

function clearAlert() {
  alertBox.innerHTML = '';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showAlert('Enter both a username/email and a password.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in…';

  try {
    const data = await api.post('/auth/login', { username, password });
    auth.saveSession(data.token, data.user);
    window.location.href = '/pages/dashboard.html';
  } catch (err) {
    showAlert(err.message || 'Login failed. Check your credentials and try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log in';
  }
});
