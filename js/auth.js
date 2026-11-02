// Authentication & Authorization Management for Satyabrata's Shop
(function () {
  function initAuth() {
    // Helper function for user feedback alerts
    function showMessage(form, msg, isError = false) {
      if (!form) return;
      let alertBox = form.querySelector('.auth-alert');
      if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.className = 'auth-alert';
        alertBox.style.padding = '10px 14px';
        alertBox.style.borderRadius = '6px';
        alertBox.style.marginBottom = '14px';
        alertBox.style.fontSize = '14px';
        alertBox.style.fontWeight = '500';
        form.prepend(alertBox);
      }
      alertBox.style.background = isError ? '#FEF2F2' : '#F0FDF4';
      alertBox.style.color = isError ? '#B91C1C' : '#15803D';
      alertBox.style.border = `1px solid ${isError ? '#F87171' : '#86EFAC'}`;
      alertBox.textContent = msg;
    }

    // ==========================================
    // 1. LOGIN FORM HANDLING
    // ==========================================
    const loginForm = document.getElementById('login-form') || 
                      document.querySelector('.auth-card form:not(#register-form)');

    if (loginForm && !loginForm.dataset.initialized) {
      const emailInput = document.getElementById('email') || loginForm.querySelector('input[type="email"]');
      const passInput = document.getElementById('password') || loginForm.querySelector('input[type="password"]');
      const submitBtn = document.getElementById('btn-login-submit') || loginForm.querySelector('button[type="submit"]');

      // Demo credential auto-fill buttons
      const btnAdmin = document.getElementById('btn-fill-admin');
      const btnCustomer = document.getElementById('btn-fill-customer');

      if (btnAdmin) {
        btnAdmin.onclick = (e) => {
          e.preventDefault();
          if (emailInput) emailInput.value = 'admin@example.com';
          if (passInput) passInput.value = 'password123';
          showMessage(loginForm, 'Filled Admin demo credentials (admin@example.com)', false);
        };
      }

      if (btnCustomer) {
        btnCustomer.onclick = (e) => {
          e.preventDefault();
          if (emailInput) emailInput.value = 'priya@example.com';
          if (passInput) passInput.value = 'password123';
          showMessage(loginForm, 'Filled Customer demo credentials (priya@example.com)', false);
        };
      }

      // Core login routine
      async function handleLogin(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passInput ? passInput.value : '';

        if (!email || !password) {
          showMessage(loginForm, 'Please enter both your email address and password.', true);
          return;
        }

        const origBtnText = submitBtn ? submitBtn.innerText : 'Sign In';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Signing in...';
        }

        try {
          if (!window.api || typeof window.api.login !== 'function') {
            throw new Error('API client not loaded. Please ensure js/api.js is included.');
          }

          const res = await window.api.login(email, password);
          showMessage(loginForm, `Welcome back, ${res.user ? res.user.name : 'User'}! Redirecting...`, false);

          setTimeout(() => {
            if (res.user && (res.user.role === 'admin' || res.user.role === 'manager')) {
              window.location.replace('admin/dashboard.html');
            } else {
              window.location.replace('index.html');
            }
          }, 600);
        } catch (err) {
          showMessage(loginForm, err.message || 'Invalid email or password. Please try again.', true);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = origBtnText;
          }
        }
      }

      loginForm.onsubmit = handleLogin;
      loginForm.addEventListener('submit', handleLogin);
      if (submitBtn) {
        submitBtn.onclick = handleLogin;
      }

      loginForm.dataset.initialized = 'true';
    }

    // ==========================================
    // 2. REGISTRATION FORM HANDLING
    // ==========================================
    const registerForm = document.getElementById('register-form') ||
                         document.querySelector('.auth-card form#register-form');

    if (registerForm && !registerForm.dataset.initialized) {
      const fnameInput = document.getElementById('fname') || registerForm.querySelector('input[placeholder*="First"]');
      const lnameInput = document.getElementById('lname') || registerForm.querySelector('input[placeholder*="Last"]');
      const emailInput = document.getElementById('reg-email') || registerForm.querySelector('input[type="email"]');
      const phoneInput = document.getElementById('phone') || registerForm.querySelector('input[type="tel"]');
      const passInput = document.getElementById('reg-pwd') || registerForm.querySelector('input[type="password"]');
      const confirmInput = document.getElementById('confirm-pwd');
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      async function handleRegister(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        const fname = fnameInput ? fnameInput.value.trim() : '';
        const lname = lnameInput ? lnameInput.value.trim() : '';
        const name = (fname + ' ' + lname).trim() || 'Valued Customer';
        const email = emailInput ? emailInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const password = passInput ? passInput.value : '';
        const confirmPass = confirmInput ? confirmInput.value : '';

        if (!email || !password) {
          showMessage(registerForm, 'Please fill in all required fields.', true);
          return;
        }

        if (confirmInput && password !== confirmPass) {
          showMessage(registerForm, 'Passwords do not match. Please re-enter.', true);
          return;
        }

        const origBtnText = submitBtn ? submitBtn.innerText : 'Create Account';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Creating account...';
        }

        try {
          if (!window.api || typeof window.api.register !== 'function') {
            throw new Error('API client not loaded.');
          }

          const res = await window.api.register(name, email, password, phone, 'customer');
          showMessage(registerForm, 'Account created successfully! Redirecting...', false);

          setTimeout(() => {
            window.location.replace('index.html');
          }, 700);
        } catch (err) {
          showMessage(registerForm, err.message || 'Registration failed. Please try again.', true);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = origBtnText;
          }
        }
      }

      registerForm.onsubmit = handleRegister;
      registerForm.addEventListener('submit', handleRegister);
      if (submitBtn) {
        submitBtn.onclick = handleRegister;
      }

      registerForm.dataset.initialized = 'true';
    }
  }

  // Initialize immediately if DOM is ready, or on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
