// Global Storefront and Navbar Live State
document.addEventListener('DOMContentLoaded', async () => {
  // Update Navbar Session Status
  const user = window.api ? window.api.getCurrentUser() : null;
  const accountLinks = document.querySelectorAll('a[href*="login.html"], .navbar__icons a[aria-label="Account"], a:has(.icon-label:contains("Account"))');

  accountLinks.forEach(link => {
    if (user) {
      const isSubDir = window.location.pathname.includes('/customer/') || window.location.pathname.includes('/admin/');
      const basePath = isSubDir ? '..' : '.';

      if (user.role === 'admin' || user.role === 'manager') {
        link.href = `${basePath}/admin/dashboard.html`;
        link.title = `Admin: ${user.name}`;
      } else {
        link.href = `${basePath}/customer/profile.html`;
        link.title = `Signed in as ${user.name}`;
      }

      const label = link.querySelector('.icon-label');
      if (label) label.textContent = user.name.split(' ')[0];
    }
  });

  // Update Cart Badge Count
  async function refreshCartBadge() {
    if (!window.api || !window.api.getToken()) return;
    try {
      const cartData = await window.api.getCart();
      const count = cartData.items ? cartData.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
      const badges = document.querySelectorAll('.navbar__count, [aria-label*="Cart"] .navbar__count');
      badges.forEach(b => {
        b.textContent = count;
        b.style.display = count > 0 ? 'inline-block' : 'none';
      });
    } catch {
      // Ignore if not logged in
    }
  }

  await refreshCartBadge();
  window.refreshCartBadge = refreshCartBadge;

  // Handle Quick Add to Cart button clicks
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-add-cart, button[data-product-id]');
    if (!btn) return;

    e.preventDefault();
    const productId = btn.getAttribute('data-product-id') || btn.dataset.productId;
    if (!productId) return;

    if (!window.api.getToken()) {
      alert('Please sign in to add items to your cart.');
      const isSubDir = window.location.pathname.includes('/customer/');
      window.location.href = isSubDir ? '../login.html' : 'login.html';
      return;
    }

    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Adding...';

    try {
      await window.api.addToCart(productId, 1);
      btn.textContent = '✓ Added!';
      await refreshCartBadge();
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = origText;
      }, 1200);
    } catch (err) {
      alert(err.message || 'Failed to add item to cart.');
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  });
});
