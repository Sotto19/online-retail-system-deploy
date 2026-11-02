// Global Storefront and Navbar Live State
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Toast Notification Helper
  function showToast(message, actionUrl = null, actionText = 'View Cart') {
    let toast = document.getElementById('global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #0F172A;
        color: #FFFFFF;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 14px;
        font-weight: 500;
        z-index: 99999;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        transform: translateY(100px);
        opacity: 0;
      `;
      document.body.appendChild(toast);
    }

    const actionHtml = actionUrl 
      ? `<a href="${actionUrl}" style="color: #60A5FA; font-weight: 700; text-decoration: underline; margin-left: 6px;">${actionText} &rarr;</a>` 
      : '';

    toast.innerHTML = `<span>${message}</span>${actionHtml}`;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }, 3500);
  }
  window.showToast = showToast;

  // 2. Update Navbar User Session Status (Safe standard selectors, NO :contains)
  try {
    const user = window.api ? window.api.getCurrentUser() : null;
    const isSubDir = window.location.pathname.includes('/customer/') || window.location.pathname.includes('/admin/');
    const basePath = isSubDir ? '..' : '.';

    // Find all account links in header
    const accountLinks = document.querySelectorAll('a[href*="login.html"], .navbar__icons a[aria-label*="Account"], a.navbar__icon-btn:first-child');
    accountLinks.forEach(link => {
      if (user) {
        if (user.role === 'admin' || user.role === 'manager') {
          link.href = `${basePath}/admin/dashboard.html`;
          link.title = `Admin: ${user.name}`;
        } else {
          link.href = `${basePath}/customer/profile.html`;
          link.title = `Account: ${user.name}`;
        }

        const label = link.querySelector('.icon-label') || link;
        if (label.classList && label.classList.contains('icon-label')) {
          label.textContent = user.name.split(' ')[0];
        } else {
          // If plain text link
          const icon = link.innerHTML.match(/^[^\w\s]+/);
          link.innerHTML = (icon ? icon[0] + ' ' : '👤 ') + user.name.split(' ')[0];
        }
      }
    });
  } catch (err) {
    console.warn('[Navbar] Session update error:', err);
  }

  // 3. Update Cart Badge Count
  async function refreshCartBadge() {
    if (!window.api || !window.api.getToken()) return;
    try {
      const cartData = await window.api.getCart();
      const count = cartData.items ? cartData.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
      const badges = document.querySelectorAll('.navbar__count, [aria-label*="Cart"] .navbar__count, a[href*="cart.html"] .navbar__count');
      
      badges.forEach(b => {
        b.textContent = count;
        b.style.display = count > 0 ? 'inline-block' : 'none';
      });

      // If no badge element exists, create one inside cart icon link
      if (badges.length === 0 && count > 0) {
        const cartLink = document.querySelector('a[href*="cart.html"].navbar__icon-btn, .navbar__icons a[href*="cart.html"]');
        if (cartLink && !cartLink.querySelector('.navbar__count')) {
          const newBadge = document.createElement('span');
          newBadge.className = 'navbar__count';
          newBadge.textContent = count;
          cartLink.appendChild(newBadge);
        }
      }
    } catch {
      // Ignore if session expired
    }
  }

  await refreshCartBadge();
  window.refreshCartBadge = refreshCartBadge;

  // 4. Quantity Stepper Handler (+ / - buttons on product details or anywhere)
  document.addEventListener('click', (e) => {
    const decBtn = e.target.closest('.qty-stepper button:first-child, button[aria-label*="Decrease"]');
    const incBtn = e.target.closest('.qty-stepper button:last-child, button[aria-label*="Increase"]');

    if (decBtn) {
      e.preventDefault();
      const input = decBtn.parentElement.querySelector('input[type="number"], input');
      if (input) {
        let val = parseInt(input.value, 10) || 1;
        if (val > 1) input.value = val - 1;
      }
    } else if (incBtn) {
      e.preventDefault();
      const input = incBtn.parentElement.querySelector('input[type="number"], input');
      if (input) {
        let val = parseInt(input.value, 10) || 1;
        const max = parseInt(input.getAttribute('max') || '10', 10);
        if (val < max) input.value = val + 1;
      }
    }
  });

  // 5. Helper to infer product ID from card context
  function getCardProductId(card, btn) {
    if (btn && (btn.dataset.productId || btn.getAttribute('data-product-id'))) {
      return btn.dataset.productId || btn.getAttribute('data-product-id');
    }
    if (card && (card.dataset.id || card.getAttribute('data-id'))) {
      return card.dataset.id || card.getAttribute('data-id');
    }

    // Try detail link ?id=
    if (card) {
      const detailLink = card.querySelector('a[href*="product-details.html"]');
      if (detailLink) {
        const href = detailLink.getAttribute('href') || '';
        const match = href.match(/[?&]id=(\d+)/);
        if (match) return match[1];
      }

      // Keyword fallback from title
      const titleEl = card.querySelector('.product-card__name, h2, h3, a');
      const text = titleEl ? titleEl.textContent.toLowerCase() : '';
      if (text.includes('headphone')) return '1';
      if (text.includes('galaxy') || text.includes('phone') || text.includes('s24')) return '2';
      if (text.includes('smartwatch') || text.includes('watch')) return '3';
      if (text.includes('air max') || text.includes('sneaker') || text.includes('shoe')) return '4';
      if (text.includes('fryer')) return '5';
      if (text.includes('dutch oven') || text.includes('kadai') || text.includes('cookware')) return '6';
      if (text.includes('atomic habits') || text.includes('book')) return '7';
      if (text.includes('serum') || text.includes('vitamin c') || text.includes('glow')) return '8';
    }

    // URL parameter fallback if on product-details page
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('id')) return urlParams.get('id');

    return '1';
  }

  // 6. Global Add to Cart Click Handler
  document.addEventListener('click', async (e) => {
    // Check if target is an Add to Cart button/link
    const btn = e.target.closest(
      '.btn-add-cart, ' +
      'button[data-product-id], ' +
      '.product-card__actions a[href*="cart.html"], ' +
      '.product-card__actions button, ' +
      'a[href*="cart.html"].btn--secondary, ' +
      'button.btn--secondary:not(.btn-qty-dec):not(.btn-qty-inc)'
    );

    // Exclude navbar icon buttons or cart page remove buttons
    if (!btn || btn.closest('.navbar__icons') || btn.closest('.cart-item__actions') || btn.closest('.cart-layout')) {
      return;
    }

    // If on product-details page, let product-details specific script handle it if it exists
    if (window.location.pathname.endsWith('product-details.html') && btn.id === 'btn-add-cart') {
      return;
    }

    e.preventDefault();

    const isSubDir = window.location.pathname.includes('/customer/');
    const loginPath = isSubDir ? '../login.html' : 'login.html';
    const cartPath = isSubDir ? 'cart.html' : 'customer/cart.html';

    if (!window.api || !window.api.getToken()) {
      showToast('⚠️ Please sign in first to add items to your cart.', loginPath, 'Sign In');
      setTimeout(() => { window.location.href = loginPath; }, 1200);
      return;
    }

    const card = btn.closest('.product-card, article');
    const productId = getCardProductId(card, btn);

    // Quantity from card or default to 1
    const qtyInput = card ? card.querySelector('.qty-input, input[type="number"]') : null;
    const qty = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;

    const origContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Adding...';

    try {
      await window.api.addToCart(productId, qty);
      btn.innerHTML = '✓ Added!';
      btn.style.backgroundColor = '#16A34A';
      btn.style.color = '#FFFFFF';
      btn.style.borderColor = '#16A34A';

      await refreshCartBadge();
      showToast('🛒 Added to your shopping cart!', cartPath, 'View Cart');

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = origContent;
        btn.style.backgroundColor = '';
        btn.style.color = '';
        btn.style.borderColor = '';
      }, 1500);
    } catch (err) {
      alert(err.message || 'Failed to add item to cart.');
      btn.disabled = false;
      btn.innerHTML = origContent;
    }
  });

  // 7. Global Buy Now Click Handler
  document.addEventListener('click', async (e) => {
    const buyBtn = e.target.closest(
      '.btn-buy-now, ' +
      'a[href*="checkout.html"].btn--primary, ' +
      'a[href*="checkout.html"].btn--lg, ' +
      'button.btn-buy-now'
    );

    // Exclude checkout submit button on checkout page or proceed button on cart page
    if (!buyBtn || buyBtn.closest('.checkout-layout') || buyBtn.closest('.summary-card__footer')) {
      return;
    }

    e.preventDefault();

    const isSubDir = window.location.pathname.includes('/customer/');
    const loginPath = isSubDir ? '../login.html' : 'login.html';
    const checkoutPath = isSubDir ? 'checkout.html' : 'customer/checkout.html';

    if (!window.api || !window.api.getToken()) {
      showToast('⚠️ Please sign in first to proceed to checkout.', loginPath, 'Sign In');
      setTimeout(() => { window.location.href = loginPath; }, 1200);
      return;
    }

    const card = buyBtn.closest('.two-col, .product-card, article') || document;
    const productId = getCardProductId(card, buyBtn);

    const qtyInput = card.querySelector('.qty-stepper input, input[type="number"]');
    const qty = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;

    const origText = buyBtn.innerText;
    buyBtn.innerText = 'Preparing Checkout...';

    try {
      await window.api.addToCart(productId, qty);
      await refreshCartBadge();
      window.location.href = checkoutPath;
    } catch (err) {
      alert(err.message || 'Failed to initialize checkout.');
      buyBtn.innerText = origText;
    }
  });
});
