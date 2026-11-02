// Live Shopping Cart Manager
document.addEventListener('DOMContentLoaded', async () => {
  const cartPanel = document.querySelector('.cart-layout .panel');
  const summaryBody = document.querySelector('.summary-card__body');
  const cartTitle = document.querySelector('h1');
  const couponInput = document.querySelector('.coupon-form input');
  const couponBtn = document.querySelector('.coupon-form button');

  if (!cartPanel) return;

  let currentCoupon = null;

  async function loadCart() {
    if (!window.api.getToken()) {
      cartPanel.innerHTML = `
        <div style="text-align:center;padding:40px 20px">
          <h3>Please Sign In</h3>
          <p style="color:var(--text-muted);margin:10px 0 20px">Sign in to view items in your shopping cart.</p>
          <a href="../login.html" class="btn btn--primary">Sign In Now</a>
        </div>
      `;
      return;
    }

    try {
      cartPanel.innerHTML = '<div style="padding:30px;text-align:center;color:var(--text-muted)">Loading your cart...</div>';
      const data = await window.api.getCart();
      const items = data.items || [];

      if (cartTitle) cartTitle.textContent = `Shopping Cart (${items.length} ${items.length === 1 ? 'item' : 'items'})`;

      if (items.length === 0) {
        cartPanel.innerHTML = `
          <div style="text-align:center;padding:50px 20px">
            <div style="font-size:48px;margin-bottom:12px">🛒</div>
            <h3>Your cart is empty</h3>
            <p style="color:var(--text-muted);margin:8px 0 20px">Looks like you haven't added anything to your cart yet.</p>
            <a href="products.html" class="btn btn--primary">Start Shopping</a>
          </div>
        `;
        updateSummary(0, 0);
        return;
      }

      // Render items
      cartPanel.innerHTML = items.map(item => `
        <div class="cart-item" data-cart-id="${item.id}" data-product-id="${item.product_id}">
          <img src="${item.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}" alt="${item.title}" class="cart-item__img" style="object-fit:cover;border-radius:6px;width:80px;height:80px" />
          <div style="flex:1">
            <div class="cart-item__name" style="font-weight:600">${item.title}</div>
            <div class="cart-item__variant" style="font-size:12px;color:var(--text-muted);margin:4px 0 10px">SKU: ${item.sku || 'N/A'}</div>
            <div class="cart-item__actions" style="display:flex;align-items:center;gap:12px">
              <div class="qty-stepper" style="display:flex;align-items:center;border:1px solid var(--border);border-radius:4px;overflow:hidden">
                <button type="button" class="btn-qty-dec" style="padding:4px 10px;background:none;border:none;cursor:pointer">-</button>
                <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${item.stock_quantity || 99}" style="width:40px;text-align:center;border:none" readonly />
                <button type="button" class="btn-qty-inc" style="padding:4px 10px;background:none;border:none;cursor:pointer">+</button>
              </div>
              <button type="button" class="cart-item__link btn-remove" style="color:var(--danger, #DC2626);background:none;border:none;cursor:pointer;font-size:13px">Remove</button>
            </div>
          </div>
          <div style="text-align:right">
            <div class="cart-item__subtotal" style="font-weight:700;font-size:16px">₹${(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}</div>
            <div class="cart-item__unit" style="font-size:12px;color:var(--text-muted)">₹${parseFloat(item.price).toLocaleString('en-IN')} each</div>
          </div>
        </div>
      `).join('');

      updateSummary(data.subtotal, items.length);
    } catch (err) {
      cartPanel.innerHTML = `<div style="padding:30px;color:var(--danger)">Failed to load cart: ${err.message}</div>`;
    }
  }

  function updateSummary(subtotal, count) {
    if (!summaryBody) return;

    let discount = 0;
    if (currentCoupon) {
      discount = currentCoupon.calculatedDiscount || 0;
    }

    const shipping = subtotal >= 499 || subtotal === 0 ? 0 : 50;
    const tax = subtotal > 0 ? (subtotal - discount) * 0.05 : 0;
    const total = Math.max(0, subtotal - discount + shipping + tax);

    // Save calculation to sessionStorage for Checkout page
    sessionStorage.setItem('checkoutSummary', JSON.stringify({
      subtotal,
      discount,
      shipping,
      tax,
      total,
      couponCode: currentCoupon ? currentCoupon.code : null
    }));

    summaryBody.innerHTML = `
      <div class="summary-row" style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>Subtotal (${count} items)</span>
        <span>₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      ${discount > 0 ? `
      <div class="summary-row" style="display:flex;justify-content:space-between;margin-bottom:8px;color:#16A34A">
        <span>Coupon Discount (${currentCoupon.code})</span>
        <span>- ₹${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      <div class="summary-row" style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>Delivery Charges</span>
        <span style="color:${shipping === 0 ? '#16A34A' : 'inherit'}">${shipping === 0 ? 'FREE' : '₹50.00'}</span>
      </div>
      <div class="summary-row" style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>GST &amp; Taxes (5%)</span>
        <span>₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="summary-row total" style="display:flex;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-weight:700;font-size:18px">
        <span>Total Amount</span>
        <span>₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      ${discount > 0 ? `
      <div style="color:#16A34A;font-size:13px;font-weight:600;margin-top:8px">
        🎉 You are saving ₹${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} on this order!
      </div>` : ''}
    `;
  }

  // Handle Qty Stepper and Remove clicks
  cartPanel.addEventListener('click', async (e) => {
    const itemEl = e.target.closest('.cart-item');
    if (!itemEl) return;
    const cartId = itemEl.dataset.cartId;
    const input = itemEl.querySelector('.qty-input');
    let currentQty = parseInt(input.value, 10);

    if (e.target.classList.contains('btn-qty-inc')) {
      await window.api.updateCartItem(cartId, currentQty + 1);
      await loadCart();
      if (window.refreshCartBadge) window.refreshCartBadge();
    } else if (e.target.classList.contains('btn-qty-dec')) {
      if (currentQty > 1) {
        await window.api.updateCartItem(cartId, currentQty - 1);
        await loadCart();
        if (window.refreshCartBadge) window.refreshCartBadge();
      } else {
        if (confirm('Remove this item from your cart?')) {
          await window.api.removeFromCart(cartId);
          await loadCart();
          if (window.refreshCartBadge) window.refreshCartBadge();
        }
      }
    } else if (e.target.classList.contains('btn-remove')) {
      await window.api.removeFromCart(cartId);
      await loadCart();
      if (window.refreshCartBadge) window.refreshCartBadge();
    }
  });

  // Handle Coupon Apply
  if (couponBtn && couponInput) {
    couponBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const code = couponInput.value.trim();
      if (!code) return;

      try {
        const cartData = await window.api.getCart();
        const res = await window.api.validateCoupon(code, cartData.subtotal);
        currentCoupon = res.coupon;
        alert(res.message || 'Coupon applied successfully!');
        updateSummary(cartData.subtotal, cartData.items.length);
      } catch (err) {
        alert(err.message || 'Invalid coupon code.');
      }
    });
  }

  await loadCart();
});
