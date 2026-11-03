// Live Admin Portal Management Script
document.addEventListener('DOMContentLoaded', async () => {
  // Check Admin Authentication
  const user = window.api ? window.api.getCurrentUser() : null;
  const token = window.api ? window.api.getToken() : null;

  // Protect Admin Pages & provide 1-click helper banner if in guest mode
  const adminContent = document.querySelector('.admin-content') || document.querySelector('#main');
  if (!token || !user || (user.role !== 'admin' && user.role !== 'manager')) {
    console.warn('Unauthorized admin access attempt. Offering demo sign-in.');
    if (adminContent && !document.getElementById('admin-auth-warning')) {
      const banner = document.createElement('div');
      banner.id = 'admin-auth-warning';
      banner.style.cssText = 'background:#FFFBEB;border:1px solid #FCD34D;color:#B45309;padding:12px 18px;border-radius:8px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:14px;';
      banner.innerHTML = `
        <span>⚠️ <strong>Admin Access Mode:</strong> You are currently not signed in as an administrator.</span>
        <button type="button" id="btn-quick-admin-login" style="background:#D97706;color:#FFF;border:none;border-radius:6px;padding:7px 16px;font-size:13px;font-weight:700;cursor:pointer;">👑 1-Click Demo Admin Sign In</button>
      `;
      adminContent.prepend(banner);
      const loginBtn = document.getElementById('btn-quick-admin-login');
      if (loginBtn) {
        loginBtn.onclick = async () => {
          try {
            await window.api.login('admin@example.com', 'password123');
            window.location.reload();
          } catch (err) {
            alert('Login failed: ' + err.message);
          }
        };
      }
    }
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
                <a href="add-product.html?id=${p.id}" class="btn btn--outline btn--xs">Edit</a>
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
  if (path.endsWith('add-product.html') || path.endsWith('add-product')) {
    const form = document.getElementById('add-product-form') || document.querySelector('.admin-content form');
    const alertBox = document.getElementById('add-product-alert');

    function showAlert(msg, isError = false) {
      if (!alertBox) {
        alert(msg);
        return;
      }
      alertBox.style.display = 'block';
      alertBox.style.background = isError ? '#FEF2F2' : '#F0FDF4';
      alertBox.style.color = isError ? '#B91C1C' : '#15803D';
      alertBox.style.border = `1px solid ${isError ? '#F87171' : '#86EFAC'}`;
      alertBox.innerHTML = `${isError ? '⚠️' : '✓'} ${msg}`;
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Populate categories dynamically from API
    const catSelect = document.getElementById('pcat') || form?.querySelector('select[name="category"]');
    if (catSelect) {
      window.api.getCategories().then(data => {
        const cats = data.categories || [];
        if (cats.length > 0) {
          catSelect.innerHTML = '<option value="">Select category...</option>' + 
            cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
      }).catch(err => {
        console.warn('Could not load dynamic categories for add-product:', err);
      });
    }

    // Quick Sample Images and Image preview box
    const imageInput = document.getElementById('pimage') || form?.querySelector('input[name="image_url"]');
    const imgPreviewBox = document.getElementById('img-preview-box');
    const imgPreview = document.getElementById('img-preview');

    function updateImagePreview(url) {
      if (!imgPreviewBox || !imgPreview) return;
      if (url && url.trim().startsWith('http')) {
        imgPreview.src = url.trim();
        imgPreviewBox.style.display = 'flex';
      } else {
        imgPreviewBox.style.display = 'none';
      }
    }

    if (imageInput) {
      imageInput.addEventListener('input', () => updateImagePreview(imageInput.value));
      imageInput.addEventListener('blur', () => updateImagePreview(imageInput.value));
    }

    document.querySelectorAll('.btn-sample-img').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const img = btn.dataset.img;
        if (imageInput && img) {
          imageInput.value = img;
          updateImagePreview(img);
        }
      });
    });

    // Auto-generate SKU button
    const btnGenSku = document.getElementById('btn-generate-sku');
    const skuInput = document.getElementById('psku') || form?.querySelector('input[name="sku"]');
    const brandInput = document.getElementById('pbrand') || form?.querySelector('input[name="brand"]');

    function generateUniqueSku() {
      const b = (brandInput?.value || 'PRD').trim().replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'PRD';
      const num = Math.floor(100 + Math.random() * 900);
      return `SE-${b}-${num}`;
    }

    if (btnGenSku && skuInput) {
      btnGenSku.addEventListener('click', () => {
        skuInput.value = generateUniqueSku();
      });
    }

    // Pre-populate if in Edit Mode (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
    if (editId) {
      const topTitle = document.querySelector('.topbar__title, h2');
      if (topTitle) topTitle.textContent = 'Edit Product #' + editId;
      const saveBtn = document.getElementById('btn-save-product');
      if (saveBtn) saveBtn.textContent = 'Update Product';

      window.api.getProduct(editId).then(data => {
        const p = data.product;
        if (!p) return;
        if (document.getElementById('pname')) document.getElementById('pname').value = p.title || '';
        if (document.getElementById('pdesc')) document.getElementById('pdesc').value = p.description || '';
        if (document.getElementById('pbrand')) document.getElementById('pbrand').value = p.brand || '';
        if (document.getElementById('pcat')) document.getElementById('pcat').value = p.category_id || '';
        if (document.getElementById('psku')) {
          document.getElementById('psku').value = p.sku || '';
          document.getElementById('psku').readOnly = true;
        }
        if (document.getElementById('pprice')) document.getElementById('pprice').value = p.price || '';
        if (document.getElementById('poldprice')) document.getElementById('poldprice').value = p.compare_price || '';
        if (document.getElementById('pcost')) document.getElementById('pcost').value = p.cost_price || '';
        if (document.getElementById('pstock')) document.getElementById('pstock').value = p.stock_quantity ?? 0;
        if (document.getElementById('pimage')) {
          document.getElementById('pimage').value = p.image_url || '';
          updateImagePreview(p.image_url);
        }
        if (document.getElementById('pstatus')) document.getElementById('pstatus').value = p.status || 'active';
      }).catch(err => {
        console.warn('Could not prefill for edit:', err);
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const submitBtn = document.getElementById('btn-save-product') || form.querySelector('button[type="submit"]');

        const title = (document.getElementById('pname') || form.querySelector('input[name="title"]'))?.value?.trim();
        const brand = (document.getElementById('pbrand') || form.querySelector('input[name="brand"]'))?.value?.trim() || 'Generic';
        let sku = (document.getElementById('psku') || form.querySelector('input[name="sku"]'))?.value?.trim();
        const categoryId = (document.getElementById('pcat') || form.querySelector('select[name="category"]'))?.value;
        const price = (document.getElementById('pprice') || form.querySelector('input[name="price"]'))?.value?.trim();
        const comparePrice = (document.getElementById('poldprice') || form.querySelector('input[name="compare_price"]'))?.value?.trim();
        const costPrice = (document.getElementById('pcost') || form.querySelector('input[name="cost_price"]'))?.value?.trim();
        const stock = (document.getElementById('pstock') || form.querySelector('input[name="stock"]'))?.value?.trim();
        let imageUrl = (document.getElementById('pimage') || form.querySelector('input[name="image_url"]'))?.value?.trim();
        const description = (document.getElementById('pdesc') || form.querySelector('textarea'))?.value?.trim();
        const status = (document.getElementById('pstatus') || form.querySelector('select[name="status"]'))?.value || 'active';

        if (!title) {
          showAlert('Please enter the Product Name.', true);
          return;
        }

        if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
          showAlert('Please enter a valid Selling Price.', true);
          return;
        }

        if (!sku) {
          sku = generateUniqueSku();
          if (skuInput) skuInput.value = sku;
        }

        if (!imageUrl) {
          imageUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';
        }

        const origBtnText = submitBtn ? submitBtn.innerHTML : 'Save Product';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Creating product...';
        }

        try {
          // If not logged in as admin, login as demo admin automatically
          if (!window.api.getToken() || (user && user.role !== 'admin' && user.role !== 'manager')) {
            await window.api.login('admin@example.com', 'password123');
          }

          const productPayload = {
            title,
            sku,
            brand,
            category_id: categoryId ? parseInt(categoryId, 10) : 1,
            price: parseFloat(price),
            compare_price: comparePrice ? parseFloat(comparePrice) : null,
            cost_price: costPrice ? parseFloat(costPrice) : null,
            stock_quantity: stock ? parseInt(stock, 10) : 20,
            image_url: imageUrl,
            description: description || '',
            status: status || 'active'
          };

          if (editId) {
            await window.api.admin.updateProduct(editId, productPayload);
            showAlert(`Product "${title}" updated successfully! Redirecting to products list...`, false);
          } else {
            const res = await window.api.admin.createProduct(productPayload);
            showAlert(`Product "${title}" created successfully! Redirecting to products list...`, false);
          }

          setTimeout(() => {
            window.location.href = 'products.html';
          }, 800);
        } catch (err) {
          showAlert(err.message || 'Failed to create product. Please verify credentials.', true);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origBtnText;
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
    const searchInput = document.querySelector('.admin-content input[type="text"]');
    const statusSelect = document.querySelector('.admin-content select');
    const alertBox = document.querySelector('.admin-content .alert');
    const exportBtn = document.querySelector('.admin-content button.btn--outline');

    if (tbody) {
      let inventoryItems = [];

      async function fetchInventory() {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Loading real-time inventory from database...</td></tr>';
        try {
          let data = null;
          try {
            data = await window.api.admin.getInventory();
          } catch (err) {
            console.warn('Admin inventory fetch failed, attempting public products fallback:', err);
          }

          if (data && data.inventory && data.inventory.length > 0) {
            inventoryItems = data.inventory;
          } else {
            // Fallback to getProducts
            const prodData = await window.api.getProducts({ limit: 100, status: 'all' });
            inventoryItems = (prodData.products || []).map(p => ({
              ...p,
              category_name: p.category_name || 'General',
              reorder_level: p.reorder_level || 10,
              max_stock: p.max_stock || Math.max(100, (p.reorder_level || 10) * 5)
            }));
          }

          renderInventoryTable();
        } catch (err) {
          console.error('Failed to load inventory:', err);
          tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--danger)">Failed to load inventory: ${err.message}</td></tr>`;
        }
      }

      function renderInventoryTable() {
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const statusFilter = statusSelect ? statusSelect.value : 'All Status';

        const filtered = inventoryItems.filter(item => {
          // Search term
          if (searchTerm) {
            const titleMatch = (item.title || '').toLowerCase().includes(searchTerm);
            const skuMatch = (item.sku || '').toLowerCase().includes(searchTerm);
            const brandMatch = (item.brand || '').toLowerCase().includes(searchTerm);
            const catMatch = (item.category_name || '').toLowerCase().includes(searchTerm);
            if (!titleMatch && !skuMatch && !brandMatch && !catMatch) return false;
          }

          // Status filter
          const stock = parseInt(item.stock_quantity, 10);
          const reorder = parseInt(item.reorder_level, 10) || 10;
          if (statusFilter === 'In Stock') {
            return stock > reorder;
          }
          if (statusFilter === 'Low Stock') {
            return stock > 0 && stock <= reorder;
          }
          if (statusFilter === 'Out of Stock') {
            return stock === 0;
          }
          return true;
        });

        // Update alert banner
        const lowStockCount = inventoryItems.filter(i => parseInt(i.stock_quantity, 10) <= (parseInt(i.reorder_level, 10) || 10)).length;
        if (alertBox) {
          if (lowStockCount > 0) {
            alertBox.className = 'alert alert--warning';
            alertBox.style.display = 'flex';
            alertBox.innerHTML = `<span>⚠️ Notice:</span><div><strong>${lowStockCount} ${lowStockCount === 1 ? 'product has' : 'products have'} low or zero stock.</strong> Stock decrements automatically whenever customer orders are confirmed.</div>`;
          } else {
            alertBox.className = 'alert alert--success';
            alertBox.style.display = 'flex';
            alertBox.style.background = '#ECFDF5';
            alertBox.style.borderColor = '#A7F3D0';
            alertBox.style.color = '#065F46';
            alertBox.innerHTML = `<span>✓ Healthy Inventory:</span><div>All products currently have sufficient stock. Automatic decrements active on orders.</div>`;
          }
        }

        if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--text-muted)">No matching products found in inventory.</td></tr>';
          return;
        }

        tbody.innerHTML = filtered.map(item => {
          const stock = parseInt(item.stock_quantity, 10);
          const reorder = parseInt(item.reorder_level, 10) || 10;
          const maxStock = item.max_stock || Math.max(100, reorder * 5);
          const isOutOfStock = stock <= 0;
          const isLowStock = !isOutOfStock && stock <= reorder;

          const stockColor = isOutOfStock ? '#DC2626' : isLowStock ? '#D97706' : '#16A34A';
          const badgeClass = isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success';
          const badgeText = isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock';

          return `
            <tr data-product-id="${item.id}">
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <img src="${item.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}" alt="" style="width:36px;height:36px;object-fit:cover;border-radius:6px" />
                  <div>
                    <div style="font-weight:600">${item.title}</div>
                    <div style="font-size:12px;color:var(--text-muted)">${item.category_name || item.brand || 'General'}</div>
                  </div>
                </div>
              </td>
              <td><code>${item.sku}</code></td>
              <td>
                <strong style="font-size:15px;color:${stockColor}">${stock}</strong>
              </td>
              <td>${reorder}</td>
              <td>${maxStock}</td>
              <td>
                <span class="badge badge--${badgeClass}">${badgeText}</span>
              </td>
              <td>
                <button type="button" class="btn btn--outline btn--xs btn-restock" data-product-id="${item.id}" data-title="${item.title}">+ Restock</button>
              </td>
            </tr>
          `;
        }).join('');
      }

      if (searchInput) searchInput.addEventListener('input', renderInventoryTable);
      if (statusSelect) statusSelect.addEventListener('change', renderInventoryTable);

      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          if (!inventoryItems || inventoryItems.length === 0) {
            alert('No inventory data to export.');
            return;
          }
          const headers = ['ID', 'Title', 'SKU', 'Category', 'Current Stock', 'Reorder Level', 'Status'];
          const rows = inventoryItems.map(i => [
            i.id,
            `"${(i.title || '').replace(/"/g, '""')}"`,
            `"${i.sku}"`,
            `"${i.category_name || 'General'}"`,
            i.stock_quantity,
            i.reorder_level || 10,
            i.stock_quantity <= 0 ? 'Out of Stock' : i.stock_quantity <= (i.reorder_level || 10) ? 'Low Stock' : 'In Stock'
          ]);
          const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement('a');
          link.setAttribute('href', encodedUri);
          link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      }

      tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-restock');
        if (!btn) return;
        const productId = btn.dataset.productId;
        const title = btn.dataset.title || 'Product';
        const addedQty = prompt(`Enter quantity to restock for "${title}":`, '20');

        if (addedQty && parseInt(addedQty, 10) > 0) {
          try {
            await window.api.admin.adjustInventory(productId, 'restock', parseInt(addedQty, 10), 'Restock from inventory manager');
            alert(`Stock for "${title}" successfully increased by ${addedQty}!`);
            await fetchInventory();
          } catch (err) {
            alert(err.message || 'Failed to adjust inventory. Please ensure you are logged in as admin.');
          }
        }
      });

      fetchInventory();
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
