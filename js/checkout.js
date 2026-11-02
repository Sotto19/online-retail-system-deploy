// Live Checkout Manager
document.addEventListener('DOMContentLoaded', async () => {
  const summaryBody = document.querySelector('.summary-card__body');
  const continueBtn = document.querySelector('.summary-card__footer button, .btn-place-order');
  const panel = document.querySelector('.checkout-layout .panel');

  if (!continueBtn) return;

  if (!window.api.getToken()) {
    alert('Please sign in before checkout.');
    window.location.href = '../login.html';
    return;
  }

  // Load live cart for checkout
  let cartData = null;
  try {
    cartData = await window.api.getCart();
    if (!cartData.items || cartData.items.length === 0) {
      alert('Your cart is empty.');
      window.location.href = 'cart.html';
      return;
    }
  } catch (err) {
    alert('Failed to load cart for checkout.');
    return;
  }

  // Retrieve cached coupon or calculate fresh
  const cachedSummary = JSON.parse(sessionStorage.getItem('checkoutSummary') || '{}');
  const subtotal = cartData.subtotal;
  const discount = cachedSummary.discount || 0;
  const shipping = subtotal >= 499 ? 0 : 50;
  const tax = (subtotal - discount) * 0.05;
  const total = subtotal - discount + shipping + tax;
  const couponCode = cachedSummary.couponCode || null;

  if (summaryBody) {
    summaryBody.innerHTML = `
      <div class="summary-row" style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>Subtotal (${cartData.items.length} items)</span>
        <span>₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      ${discount > 0 ? `
      <div class="summary-row" style="display:flex;justify-content:space-between;margin-bottom:8px;color:#16A34A">
        <span>Discount ${couponCode ? `(${couponCode})` : ''}</span>
        <span>- ₹${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      <div class="summary-row" style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>Delivery</span>
        <span style="color:${shipping === 0 ? '#16A34A' : 'inherit'}">${shipping === 0 ? 'FREE' : '₹50.00'}</span>
      </div>
      <div class="summary-row" style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>Taxes (5%)</span>
        <span>₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="summary-row total" style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-weight:700;font-size:18px">
        <span>Total Payable</span>
        <span>₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    `;
  }

  // Address selection state
  let selectedAddress = 'Priya Sharma, 42, Indiranagar 12th Main, Bengaluru, Karnataka 560038 (+91 98765 43210)';

  const addressCards = document.querySelectorAll('.address-card');
  addressCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      addressCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const lines = Array.from(card.querySelectorAll('p')).map(p => p.innerText).join(', ');
      selectedAddress = lines;
    });
  });

  // Handle Checkout submission
  continueBtn.innerText = 'Confirm & Place Order (COD)';
  continueBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    continueBtn.disabled = true;
    continueBtn.innerText = 'Processing Order...';

    try {
      const orderPayload = {
        shippingAddress: selectedAddress,
        paymentMethod: 'cod',
        couponCode: couponCode,
        items: cartData.items
      };

      const result = await window.api.createOrder(orderPayload);
      sessionStorage.removeItem('checkoutSummary');
      if (window.refreshCartBadge) window.refreshCartBadge();

      // Redirect to confirmation
      window.location.href = `order-confirmation.html?orderNumber=${result.orderNumber}&total=${result.totalAmount}`;
    } catch (err) {
      alert(`Order placement failed: ${err.message}`);
      continueBtn.disabled = false;
      continueBtn.innerText = 'Confirm & Place Order (COD)';
    }
  });
});
