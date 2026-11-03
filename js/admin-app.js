// Live Admin Portal Management Script
document.addEventListener('DOMContentLoaded', async () => {
  // Check Admin Authentication
  const user = window.api ? window.api.getCurrentUser() : null;
  const token = window.api ? window.api.getToken() : null;

  // Protect Admin Pages
  if (!token || !user || (user.role !== 'admin' && user.role !== 'manager')) {
    // If not authenticated as admin, prompt or redirect
    console.warn('Unauthorized admin access attempt. Please sign in as admin.');
  }

  // Update Admin user avatar & name in sidebar if present
  if (user) {
    const adminNameEl = document.querySelector('.sidebar__user-name');
    const adminAvatarEl = document.querySelector('.sidebar__avatar, .topbar__avatar');
    if (adminNameEl) adminNameEl.textContent = user.name;
    if (adminAvatarEl) {
      const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      adminAvatarEl.textContent = initials;
    }
  }

  // Add Sign Out buttons to Admin Topbar & Sidebar
  const topbarActions = document.querySelector('.topbar__actions');
  if (topbarActions && !document.getElementById('admin-topbar-logout')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'admin-topbar-logout';
    logoutBtn.type = 'button';
    logoutBtn.title = 'Sign Out of Admin';
    logoutBtn.setAttribute('aria-label', 'Sign Out');
    logoutBtn.className = 'topbar__btn btn-admin-logout';
    logoutBtn.style.cssText = 'color:#EF4444;border:none;background:rgba(239,68,68,0.1);border-radius:6px;padding:6px 12px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;cursor:pointer;margin-left:8px;';
    logoutBtn.innerHTML = '<span>🚪</span><span>Sign Out</span>';
    logoutBtn.onclick = () => window.api.logout();
    topbarActions.appendChild(logoutBtn);
  }

  const sidebarNav = document.querySelector('.sidebar__nav');
  if (sidebarNav && !document.getElementById('admin-sidebar-logout')) {
    const sidebarLogout = document.createElement('a');
    sidebarLogout.id = 'admin-sidebar-logout';
    sidebarLogout.href = 'javascript:void(0);';
    sidebarLogout.className = 'sidebar__link btn-admin-logout';
    sidebarLogout.style.color = '#EF4444';
    sidebarLogout.innerHTML = '<span class="link-icon">🚪</span><span>Sign Out</span>';
    sidebarLogout.onclick = (e) => {
      e.preventDefault();
      window.api.logout();
    };
    sidebarNav.appendChild(sidebarLogout);
  }

  const path = window.location.pathname;

  // 1. DASHBOARD PAGE
  if (path.endsWith('dashboard.html') || path.endsWith('dashboard')) {
    try {
      const data = await window.api.admin.getDashboard();
      const metrics = data.metrics;

      // Update stat cards if elements exist
      const statCards = document.querySelectorAll('.stat-card');
      statCards.forEach(card => {
        const title = card.querySelector('.stat-card__title, .stat-title, h4, span')?.innerText?.toLowerCase() || '';
        const valueEl = card.querySelector('.stat-card__value, .stat-value, .value, h2');
        if (!valueEl) return;

        if (title.includes('sales') || title.includes('revenue')) {
          valueEl.textContent = `₹${metrics.totalRevenue.toLocaleString('en-IN')}`;
        } else if (title.includes('order')) {
          valueEl.textContent = metrics.totalOrders.toLocaleString('en-IN');
        } else if (title.includes('customer')) {
          valueEl.textContent = metrics.totalCustomers.toLocaleString('en-IN');
        } else if (title.includes('stock')) {
          valueEl.textContent = metrics.lowStockCount.toLocaleString('en-IN');
        }
      });

      // Update Recent Orders table
      const ordersTbody = document.querySelector('.data-table tbody');
      if (ordersTbody && metrics.recentOrders && metrics.recentOrders.length > 0) {
        ordersTbody.innerHTML = metrics.recentOrders.map(o => `
          <tr>
            <td><strong style="color:var(--primary,#2563EB)">${o.order_number}</strong></td>
            <td>${o.customer_name}</td>
            <td>₹${parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
            <td><span class="badge badge--${o.order_status === 'delivered' ? 'success' : o.order_status === 'shipped' ? 'info' : 'warning'}">${o.order_status.toUpperCase()}</span></td>
            <td>${new Date(o.created_at).toLocaleDateString()}</td>
            <td><a href="orders.html" class="btn btn--outline btn--xs">View</a></td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    }
  }

  // 2. PRODUCTS PAGE
  if (path.endsWith('products.html') || path.endsWith('products')) {
    const tbody = document.querySelector('.data-table tbody');
    const searchInput = document.querySelector('.admin-content input[type="text"]');
    const categorySelect = document.querySelector('.admin-content select');

    async function loadAdminProducts() {
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px">Loading products...</td></tr>';

      try {
        const queryParams = { limit: 50 };
        if (searchInput && searchInput.value.trim()) queryParams.search = searchInput.value.trim();
        if (categorySelect && categorySelect.value && !categorySelect.value.startsWith('All')) {
          queryParams.category = categorySelect.value;
        }

        const data = await window.api.admin.getProducts(queryParams);
        const products = data.products || [];

        if (products.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px">No products found.</td></tr>';
          return;
        }

        tbody.innerHTML = products.map(p => {
          const isLowStock = p.stock_quantity <= p.reorder_level;
          const isOutOfStock = p.stock_quantity === 0;
          return `
            <tr data-product-id="${p.id}">
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <img src="${p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px" />
                  <div>
                    <div style="font-weight:600">${p.title}</div>
                    <div style="font-size:12px;color:var(--text-muted)">SKU: ${p.sku}</div>
                  </div>
                </div>
              </td>
              <td>${p.brand || 'Generic'}</td>
              <td>${p.category_name || 'General'}</td>
              <td style="font-weight:600">₹${parseFloat(p.price).toLocaleString('en-IN')}</td>
              <td>
                <span class="badge badge--${isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}">
                  ${isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${p.stock_quantity})` : `In Stock (${p.stock_quantity})`}
                </span>
              </td>
              <td>
                <span class="badge badge--${p.status === 'active' ? 'success' : 'warning'}">
                  ${p.status.toUpperCase()}
                </span>
              </td>
              <td>
                <button type="button" class="btn btn--outline btn--xs btn-edit-product">Edit</button>
                <button type="button" class="btn btn--ghost btn--xs btn-delete-product" style="margin-left:4px;color:var(--danger,#DC2626)">Delete</button>
              </td>
            </tr>
          `;
        }).join('');

        const paginationInfo = document.querySelector('.pagination__info');
        if (paginationInfo) paginationInfo.textContent = `Showing 1-${products.length} of ${data.total}`;
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger);text-align:center;padding:20px">Error loading products: ${err.message}</td></tr>`;
      }
    }

    if (tbody) {
      tbody.addEventListener('click', async (e) => {
        const tr = e.target.closest('tr[data-product-id]');
        if (!tr) return;
        const productId = tr.dataset.productId;

        if (e.target.classList.contains('btn-delete-product')) {
          if (confirm('Are you sure you want to delete or deactivate this product?')) {
            try {
              await window.api.admin.deleteProduct(productId);
              alert('Product marked as inactive.');
              loadAdminProducts();
            } catch (err) {
              alert(err.message || 'Failed to delete product.');
            }
          }
        } else if (e.target.classList.contains('btn-edit-product')) {
          const newPrice = prompt('Enter new price for this product:');
          if (newPrice && !isNaN(newPrice)) {
            try {
              await window.api.admin.updateProduct(productId, { price: parseFloat(newPrice) });
              alert('Price updated successfully!');
              loadAdminProducts();
            } catch (err) {
              alert(err.message || 'Failed to update price.');
            }
          }
        }
      });

      if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(loadAdminProducts, 300);
        });
      }

      if (categorySelect) {
        categorySelect.addEventListener('change', loadAdminProducts);
      }

      loadAdminProducts();
    }
  }

  // 3. ADD PRODUCT PAGE
  if (path.endsWith('add-product.html')) {
    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');

        const title = form.querySelector('#title, input[name="title"], input[placeholder*="Product Name"]')?.value?.trim();
        const sku = form.querySelector('#sku, input[name="sku"], input[placeholder*="SKU"]')?.value?.trim();
        const brand = form.querySelector('#brand, input[name="brand"], input[placeholder*="Brand"]')?.value?.trim();
        const categoryId = form.querySelector('#category, select[name="category"]')?.value;
        const price = form.querySelector('#price, input[name="price"], input[placeholder*="Price"]')?.value?.trim();
        const costPrice = form.querySelector('#costPrice, input[name="cost_price"]')?.value?.trim();
        const stock = form.querySelector('#stock, input[name="stock"], input[placeholder*="Stock"]')?.value?.trim();
        const description = form.querySelector('textarea')?.value?.trim();

        if (!title || !sku || !price) {
          alert('Product Title, SKU, and Price are required.');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Creating product...';
        }

        try {
          await window.api.admin.createProduct({
            title,
            sku,
            brand: brand || 'Generic',
            category_id: categoryId || 1,
            price: parseFloat(price),
            cost_price: costPrice ? parseFloat(costPrice) : null,
            stock_quantity: parseInt(stock, 10) || 10,
            description: description || ''
          });

          alert('Product created successfully!');
          window.location.href = 'products.html';
        } catch (err) {
          alert(err.message || 'Failed to create product.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Save Product';
          }
        }
      });
    }
  }

  // 4. ORDERS PAGE
  if (path.endsWith('orders.html') && path.includes('/admin/')) {
    const tbody = document.querySelector('.data-table tbody');
    if (tbody) {
      try {
        const data = await window.api.admin.getOrders();
        const orders = data.orders || [];

        if (orders.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px">No orders found.</td></tr>';
        } else {
          tbody.innerHTML = orders.map(o => `
            <tr data-order-id="${o.id}">
              <td><strong style="color:var(--primary,#2563EB)">${o.order_number}</strong></td>
              <td>${o.customer_name}</td>
              <td>₹${parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
              <td><span class="badge badge--info">${o.payment_method.toUpperCase()} (${o.payment_status})</span></td>
              <td>
                <select class="form-control select-order-status" style="width:auto;padding:2px 8px;font-size:12px">
                  <option value="pending" ${o.order_status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="confirmed" ${o.order_status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                  <option value="processing" ${o.order_status === 'processing' ? 'selected' : ''}>Processing</option>
                  <option value="shipped" ${o.order_status === 'shipped' ? 'selected' : ''}>Shipped</option>
                  <option value="delivered" ${o.order_status === 'delivered' ? 'selected' : ''}>Delivered</option>
                  <option value="cancelled" ${o.order_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              </td>
              <td>${new Date(o.created_at).toLocaleDateString()}</td>
              <td>
                <button type="button" class="btn btn--outline btn--xs btn-update-order">Save</button>
              </td>
            </tr>
          `).join('');

          tbody.addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-update-order')) {
              const tr = e.target.closest('tr');
              const orderId = tr.dataset.orderId;
              const select = tr.querySelector('.select-order-status');
              const status = select.value;

              try {
                await window.api.admin.updateOrderStatus(orderId, status);
                alert(`Order #${orderId} status updated to ${status}!`);
              } catch (err) {
                alert(err.message || 'Failed to update order status.');
              }
            }
          });
        }
      } catch (err) {
        console.error('Error loading admin orders:', err);
      }
    }
  }

  // 5. INVENTORY PAGE
  if (path.endsWith('inventory.html')) {
    const tbody = document.querySelector('.data-table tbody');
    if (tbody) {
      try {
        const data = await window.api.admin.getInventory();
        const items = data.inventory || [];

        tbody.innerHTML = items.map(item => `
          <tr data-product-id="${item.id}">
            <td><strong>${item.sku}</strong></td>
            <td>${item.title}</td>
            <td>${item.category_name || 'General'}</td>
            <td><strong style="color:${item.stock_quantity <= item.reorder_level ? '#DC2626' : '#16A34A'}">${item.stock_quantity}</strong></td>
            <td>${item.reorder_level}</td>
            <td>
              <button type="button" class="btn btn--outline btn--xs btn-restock">+ Restock</button>
            </td>
          </tr>
        `).join('');

        tbody.addEventListener('click', async (e) => {
          if (e.target.classList.contains('btn-restock')) {
            const tr = e.target.closest('tr');
            const productId = tr.dataset.productId;
            const addedQty = prompt('Enter quantity to add to stock:', '20');

            if (addedQty && parseInt(addedQty, 10) > 0) {
              try {
                await window.api.admin.adjustInventory(productId, 'restock', parseInt(addedQty, 10), 'Restock from inventory manager');
                alert('Stock updated successfully!');
                window.location.reload();
              } catch (err) {
                alert(err.message || 'Failed to adjust inventory.');
              }
            }
          }
        });
      } catch (err) {
        console.error('Failed to load inventory:', err);
      }
    }
  }

  // 6. CUSTOMERS PAGE
  if (path.endsWith('customers.html')) {
    const tbody = document.querySelector('.data-table tbody');
    if (tbody) {
      try {
        const data = await window.api.admin.getCustomers();
        const customers = data.customers || [];

        tbody.innerHTML = customers.map(c => `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.email}</td>
            <td>${c.phone || 'N/A'}</td>
            <td>${c.total_orders} orders</td>
            <td><strong>₹${parseFloat(c.total_spent).toLocaleString('en-IN')}</strong></td>
            <td><span class="badge badge--success">${c.status.toUpperCase()}</span></td>
          </tr>
        `).join('');
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
    }
  }

  // 7. DISCOUNTS / PROMO CODES PAGE
  if (path.endsWith('discounts.html') || path.endsWith('discounts')) {
    const tbody = document.getElementById('discounts-table-body') || document.querySelector('.data-table tbody');
    const searchInput = document.getElementById('search-discounts') || document.querySelector('.admin-content input[type="text"]');
    const createBtn = document.getElementById('btn-create-discount') || document.querySelector('.admin-content .btn--primary');

    let allCoupons = [];

    async function loadDiscounts() {
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px">Loading discounts...</td></tr>';

      try {
        const data = await window.api.admin.getCoupons();
        allCoupons = data.coupons || [];
        renderDiscountsTable(allCoupons);
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger,#DC2626);text-align:center;padding:20px">Error loading discounts: ${err.message}</td></tr>`;
      }
    }

    function renderDiscountsTable(coupons) {
      const term = (searchInput?.value || '').trim().toUpperCase();
      const filtered = coupons.filter(c => !term || (c.code && c.code.toUpperCase().includes(term)));

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px">No discount codes found.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(c => {
        const isActive = c.is_active == 1 || c.is_active === true;
        const discountVal = parseFloat(c.discount_value);
        const discountDisplay = c.discount_type === 'percentage' ? `${discountVal}%` : `₹${discountVal.toLocaleString('en-IN')}`;
        const minOrder = parseFloat(c.min_order_amount || 0);
        const minOrderDisplay = minOrder > 0 ? `₹${minOrder.toLocaleString('en-IN')}` : '₹0';
        const expiryDisplay = c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never';

        return `
          <tr data-coupon-id="${c.id}">
            <td><span class="discount-code" style="font-weight:700;letter-spacing:0.5px">${c.code}</span></td>
            <td style="font-weight:600;color:var(--primary,#2563EB)">${discountDisplay} OFF</td>
            <td><span style="text-transform:capitalize">${c.discount_type || 'percentage'}</span></td>
            <td>${minOrderDisplay}</td>
            <td>${expiryDisplay}</td>
            <td>
              <span class="badge badge--${isActive ? 'success' : 'warning'}">
                ${isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td>
              <button type="button" class="btn btn--outline btn--xs btn-toggle-coupon">
                ${isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button type="button" class="btn btn--ghost btn--xs btn-delete-coupon" style="margin-left:4px;color:var(--danger,#DC2626)">
                Delete
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderDiscountsTable(allCoupons);
      });
    }

    if (tbody) {
      tbody.addEventListener('click', async (e) => {
        const tr = e.target.closest('tr[data-coupon-id]');
        if (!tr) return;
        const couponId = tr.dataset.couponId;

        if (e.target.classList.contains('btn-toggle-coupon')) {
          try {
            await window.api.admin.toggleCoupon(couponId);
            await loadDiscounts();
          } catch (err) {
            alert(err.message || 'Failed to update coupon status.');
          }
        } else if (e.target.classList.contains('btn-delete-coupon')) {
          if (confirm('Are you sure you want to delete this coupon?')) {
            try {
              await window.api.admin.deleteCoupon(couponId);
              alert('Coupon deleted successfully.');
              await loadDiscounts();
            } catch (err) {
              alert(err.message || 'Failed to delete coupon.');
            }
          }
        }
      });
    }

    if (createBtn) {
      createBtn.addEventListener('click', async () => {
        const code = prompt('Enter coupon code (e.g. FLASH25):');
        if (!code || !code.trim()) return;

        const discountVal = prompt('Enter discount amount (e.g. 20 for 20% or 500 for ₹500):', '20');
        if (!discountVal || isNaN(discountVal)) {
          alert('Please enter a valid numeric discount value.');
          return;
        }

        const isPercentage = confirm('Is this a percentage discount?\n\nClick [OK] for Percentage (e.g. 20%)\nClick [Cancel] for Fixed Amount (e.g. ₹500)');
        const minOrder = prompt('Minimum order purchase required in ₹ (enter 0 for no minimum):', '0');

        try {
          await window.api.admin.createCoupon({
            code: code.trim().toUpperCase(),
            discount_type: isPercentage ? 'percentage' : 'fixed',
            discount_value: parseFloat(discountVal),
            min_order_amount: parseFloat(minOrder || 0),
            expires_at: '2027-12-31'
          });
          alert(`🎉 Coupon "${code.trim().toUpperCase()}" created successfully!`);
          await loadDiscounts();
        } catch (err) {
          alert(err.message || 'Failed to create coupon.');
        }
      });
    }

    loadDiscounts();
  }
});
