// Auth Logic for Login and Registration Pages
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('form[action="login"], form:has(#email):has(#password):not(:has(#name))');
  const registerForm = document.querySelector('form:has(#name):has(#email):has(#password)');

  // Helper alert message
  function showMessage(form, msg, isError = false) {
    let alertBox = form.querySelector('.auth-alert');
    if (!alertBox) {
      alertBox = document.createElement('div');
      alertBox.className = 'auth-alert';
      alertBox.style.padding = '10px 14px';
      alertBox.style.borderRadius = '6px';
      alertBox.style.marginBottom = '14px';
      alertBox.style.fontSize = '14px';
      form.prepend(alertBox);
    }
    alertBox.style.background = isError ? '#FEF2F2' : '#F0FDF4';
    alertBox.style.color = isError ? '#B91C1C' : '#15803D';
    alertBox.style.border = `1px solid ${isError ? '#F87171' : '#86EFAC'}`;
    alertBox.textContent = msg;
  }

  // Handle Login
  const isLoginPage = window.location.pathname.endsWith('login.html');
  if (isLoginPage) {
    const form = document.querySelector('form');
    if (form) {
      // Auto-fill demo credentials helper if clicked
      const emailInput = document.getElementById('email') || form.querySelector('input[type="email"]');
      const passInput = document.getElementById('password') || form.querySelector('input[type="password"]');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passInput ? passInput.value : '';

        if (!email || !password) {
          showMessage(form, 'Please enter your email and password.', true);
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const origText = submitBtn ? submitBtn.innerText : 'Sign In';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Signing in...';
        }

        try {
          const res = await window.api.login(email, password);
          showMessage(form, 'Login successful! Redirecting...', false);

          setTimeout(() => {
            if (res.user && (res.user.role === 'admin' || res.user.role === 'manager')) {
              window.location.href = 'admin/dashboard.html';
            } else {
              window.location.href = 'index.html';
            }
          }, 800);
        } catch (err) {
          showMessage(form, err.message || 'Login failed. Please check credentials.', true);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = origText;
          }
        }
      });
    }
  }

  // Handle Register
  const isRegisterPage = window.location.pathname.endsWith('register.html');
  if (isRegisterPage) {
    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('name') || form.querySelector('input[placeholder*="Name"], input[type="text"]');
        const emailInput = document.getElementById('email') || form.querySelector('input[type="email"]');
        const passInput = document.getElementById('password') || form.querySelector('input[type="password"]');
        const phoneInput = document.getElementById('phone') || form.querySelector('input[type="tel"]');
        const roleSelect = document.getElementById('role');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passInput ? passInput.value : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const role = roleSelect ? roleSelect.value : 'customer';

        if (!name || !email || !password) {
          showMessage(form, 'Please fill in all required fields.', true);
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Creating account...';
        }

        try {
          const res = await window.api.register(name, email, password, phone, role);
          showMessage(form, 'Account created successfully! Redirecting...', false);
          setTimeout(() => {
            if (res.user && res.user.role === 'admin') {
              window.location.href = 'admin/dashboard.html';
            } else {
              window.location.href = 'index.html';
            }
          }, 800);
        } catch (err) {
          showMessage(form, err.message || 'Registration failed.', true);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Create Account';
          }
        }
      });
    }
  }
});
