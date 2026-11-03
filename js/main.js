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

  // 2. Update Navbar User Session Status & Sign Out Option
  try {
    const user = window.api ? window.api.getCurrentUser() : null;
    const isSubDir = window.location.pathname.includes('/customer/') || window.location.pathname.includes('/admin/');
    const basePath = isSubDir ? '..' : '.';

    if (user) {
      // Find all account links in header
      const accountLinks = document.querySelectorAll('a[href*="login.html"], .navbar__icons a[aria-label*="Account"], a.navbar__icon-btn:first-child');
      accountLinks.forEach(link => {
        if (user.role === 'admin' || user.role === 'manager') {
          link.href = `${basePath}/admin/dashboard.html`;
          link.title = `Admin Dashboard (${user.name})`;
        } else {
          link.href = `${basePath}/customer/profile.html`;
          link.title = `My Profile (${user.name})`;
        }

        const label = link.querySelector('.icon-label');
        if (label) {
          label.textContent = user.name.split(' ')[0];
        } else {
          const icon = link.innerHTML.match(/^[^\w\s]+/);
          link.innerHTML = (icon ? icon[0] + ' ' : '👤 ') + user.name.split(' ')[0];
        }
      });

      // Add prominent Sign Out button to navbar icons if not already added
      const navIcons = document.querySelector('.navbar__icons');
      if (navIcons && !document.getElementById('nav-signout-btn')) {
        const signoutBtn = document.createElement('a');
        signoutBtn.id = 'nav-signout-btn';
        signoutBtn.href = 'javascript:void(0);';
        signoutBtn.className = 'navbar__icon-btn btn-signout';
        signoutBtn.setAttribute('aria-label', 'Sign Out');
        signoutBtn.title = `Sign Out (${user.name})`;
        signoutBtn.style.cursor = 'pointer';
        signoutBtn.innerHTML = `<span>🚪</span><span class="icon-label" style="color:var(--danger,#DC2626);font-weight:600">Sign Out</span>`;
        navIcons.appendChild(signoutBtn);
      }

      // Update footer login link if present
      const footerLoginLinks = document.querySelectorAll('.footer a[href*="login.html"]');
      footerLoginLinks.forEach(link => {
        link.href = 'javascript:void(0);';
        link.className = 'btn-signout';
        link.textContent = 'Sign Out';
        link.title = `Signed in as ${user.name}`;
      });
    }

    // Global click listener for any sign out trigger
    document.addEventListener('click', (e) => {
      const signoutBtn = e.target.closest('.btn-signout, [data-action="signout"], [data-action="logout"], #nav-signout-btn');
      if (signoutBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (window.api && typeof window.api.logout === 'function') {
          window.api.logout();
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          const isSub = window.location.pathname.includes('/customer/') || window.location.pathname.includes('/admin/');
          window.location.href = isSub ? '../login.html' : 'login.html';
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

  // 8. Search & Filter System (Home Page and Global Navigation)
  (function initSearchAndFilter() {
    const isSubDir = window.location.pathname.includes('/customer/') || window.location.pathname.includes('/admin/');
    const isHomePage = document.getElementById('main-product-grid') !== null || 
                       document.getElementById('home-category-pills') !== null ||
                       window.location.pathname.endsWith('index.html') ||
                       window.location.pathname === '/' ||
                       window.location.pathname.endsWith('/online-retail-system/');

    const searchForms = document.querySelectorAll('.search-form');
    const searchInputs = document.querySelectorAll('.search-form input[type="search"]');

    // ----------------------------------------------------
    // A. HOME PAGE INTERACTIVE SEARCH & CATEGORY FILTERING
    // ----------------------------------------------------
    if (isHomePage && document.getElementById('main-product-grid')) {
      const mainGrid = document.getElementById('main-product-grid');
      const sortSelect = document.getElementById('home-sort-select');
      const resetBtn = document.getElementById('btn-reset-filters');
      const filterStatus = document.getElementById('home-filter-status');
      const filterText = document.getElementById('home-filter-text');
      const clearFilterBtn = document.getElementById('btn-clear-home-filter');
      const productsSection = document.getElementById('products-section');

      let currentCategory = 'all';
      let currentSearch = '';
      let currentSort = 'featured';
      let debounceTimer = null;

      // Render product cards helper
      function renderCards(products) {
        if (!mainGrid) return;
        if (!products || products.length === 0) {
          mainGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: #F8FAFC; border-radius: 12px; border: 1px dashed #CBD5E1;">
              <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
              <h3 style="margin-bottom: 8px; font-weight: 700;">No products found</h3>
              <p style="color: var(--text-muted); margin-bottom: 18px; font-size: 14px;">We couldn't find any items matching your selected criteria.</p>
              <button type="button" class="btn btn--primary btn--sm" id="btn-no-results-reset">Clear All Filters</button>
            </div>
          `;
          const noResBtn = document.getElementById('btn-no-results-reset');
          if (noResBtn) noResBtn.onclick = () => resetAll();
          return;
        }

        mainGrid.innerHTML = products.map(p => {
          const price = parseFloat(p.price);
          const comparePrice = p.compare_price ? parseFloat(p.compare_price) : null;
          const discountPct = comparePrice && comparePrice > price 
            ? Math.round((1 - price / comparePrice) * 100) 
            : null;

          return `
            <article class="product-card" data-id="${p.id}">
              <div class="product-card__img-wrap">
                <img src="${p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}" alt="${p.title}" style="object-fit:cover" />
                ${discountPct ? `<span class="product-card__badge"><span class="badge badge--discount">${discountPct}% OFF</span></span>` : ''}
                <button class="btn--wishlist" aria-label="Add to wishlist">🤍</button>
              </div>
              <div class="product-card__body">
                <span class="product-card__brand">${p.brand || 'Premium'}</span>
                <a href="customer/product-details.html?id=${p.id}" class="product-card__name">${p.title}</a>
                <div class="product-card__rating">
                  <span class="stars">★★★★☆</span>
                  <span class="rating-text">${p.rating || 4.5} (${p.reviews_count || 48})</span>
                </div>
                <div class="product-card__price">
                  <span class="price--current">₹${price.toLocaleString('en-IN')}</span>
                  ${comparePrice ? `<span class="price--old">₹${comparePrice.toLocaleString('en-IN')}</span>` : ''}
                  ${discountPct ? `<span class="price--save">Save ₹${(comparePrice - price).toLocaleString('en-IN')}</span>` : ''}
                </div>
              </div>
              <div class="product-card__actions">
                <button type="button" class="btn btn--secondary btn--sm btn-add-cart" data-product-id="${p.id}">🛒 Add to Cart</button>
              </div>
            </article>
          `;
        }).join('');
      }

      // Fetch and apply current filters
      async function executeHomeFilter(scrollIntoView = false) {
        if (!mainGrid) return;

        // Update category pills styling
        document.querySelectorAll('.btn-cat-pill').forEach(pill => {
          const isActive = pill.dataset.category === currentCategory;
          pill.style.background = isActive ? '#2563EB' : '#FFF';
          pill.style.color = isActive ? '#FFF' : '#1E293B';
          pill.style.borderColor = isActive ? '#2563EB' : '#CBD5E1';
        });

        // Update active class on navbar category links
        document.querySelectorAll('.navbar__nav-link').forEach(link => {
          if (link.dataset.category === currentCategory) {
            link.classList.add('active');
          } else if (currentCategory !== 'all') {
            link.classList.remove('active');
          }
        });

        const isFiltered = currentCategory !== 'all' || currentSearch.trim() !== '' || currentSort !== 'featured';

        if (resetBtn) resetBtn.style.display = isFiltered ? 'inline-block' : 'none';

        if (filterStatus && filterText) {
          if (isFiltered) {
            const parts = [];
            if (currentSearch.trim()) parts.push(`Keyword: "${currentSearch.trim()}"`);
            if (currentCategory !== 'all') {
              const catLabel = currentCategory.replace('-', ' ').replace(/\w/g, l => l.toUpperCase());
              parts.push(`Category: ${catLabel}`);
            }
            if (currentSort !== 'featured') {
              const sortLabel = sortSelect ? sortSelect.options[sortSelect.selectedIndex].text : currentSort;
              parts.push(`Sort: ${sortLabel}`);
            }
            filterText.textContent = `Showing results for: ${parts.join(' | ')}`;
            filterStatus.style.display = 'flex';
          } else {
            filterStatus.style.display = 'none';
          }
        }

        mainGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); font-size: 15px;">Loading products...</div>';

        try {
          const params = { limit: 30 };
          if (currentCategory !== 'all') params.category = currentCategory;
          if (currentSearch.trim()) params.search = currentSearch.trim();
          if (currentSort !== 'featured') params.sort = currentSort;

          const data = await window.api.getProducts(params);
          const products = data.products || [];
          renderCards(products);

          if (scrollIntoView && productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } catch (err) {
          console.error('Failed to filter products:', err);
          mainGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger, #DC2626); padding: 30px;">Error loading products: ${err.message}</div>`;
        }
      }

      function resetAll() {
        currentCategory = 'all';
        currentSearch = '';
        currentSort = 'featured';
        searchInputs.forEach(i => i.value = '');
        if (sortSelect) sortSelect.value = 'featured';
        executeHomeFilter(false);
      }

      // Quick Category Pills Click
      document.addEventListener('click', (e) => {
        const pill = e.target.closest('.btn-cat-pill');
        if (pill) {
          e.preventDefault();
          currentCategory = pill.dataset.category || 'all';
          executeHomeFilter(true);
        }
      });

      // Category Strip Cards Click
      document.addEventListener('click', (e) => {
        const catCard = e.target.closest('.category-strip .category-card');
        if (catCard) {
          e.preventDefault();
          currentCategory = catCard.dataset.category || 'all';
          executeHomeFilter(true);
        }
      });

      // Navbar Category Links Click on Home Page
      document.addEventListener('click', (e) => {
        const navCatLink = e.target.closest('.navbar__nav-link');
        if (navCatLink && navCatLink.dataset.category) {
          e.preventDefault();
          currentCategory = navCatLink.dataset.category;
          executeHomeFilter(true);
        }
      });

      // Navbar Categories Toggle button
      const navCategoriesBtn = document.querySelector('.navbar__categories');
      if (navCategoriesBtn) {
        navCategoriesBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const catStrip = document.querySelector('.category-strip');
          if (catStrip) {
            catStrip.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }

      // Sort Select
      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          currentSort = sortSelect.value;
          executeHomeFilter(false);
        });
      }

      // Reset & Clear buttons
      if (resetBtn) resetBtn.addEventListener('click', resetAll);
      if (clearFilterBtn) clearFilterBtn.addEventListener('click', resetAll);

      // Search Inputs on Home Page (real-time typing + submit)
      searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
          currentSearch = e.target.value;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            executeHomeFilter(false);
          }, 250);
        });
      });

      searchForms.forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = form.querySelector('input[type="search"]');
          if (input) currentSearch = input.value;
          executeHomeFilter(true);
        });
      });

      // Parse initial URL query params (?q=... or ?category=...)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('q')) {
        currentSearch = urlParams.get('q');
        searchInputs.forEach(i => i.value = currentSearch);
      }
      if (urlParams.get('category')) {
        currentCategory = urlParams.get('category');
      }

      // Initial load
      executeHomeFilter(false);

    } else {
      // ----------------------------------------------------
      // B. GLOBAL SEARCH HANDLING FOR NON-HOME PAGES
      // ----------------------------------------------------
      searchForms.forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = form.querySelector('input[type="search"]');
          const query = input ? input.value.trim() : '';
          const targetUrl = isSubDir 
            ? `search.html?q=${encodeURIComponent(query)}` 
            : `customer/search.html?q=${encodeURIComponent(query)}`;
          window.location.href = targetUrl;
        });
      });
    }

    // ----------------------------------------------------
    // C. DYNAMIC SEARCH PAGE (search.html)
    // ----------------------------------------------------
    if (window.location.pathname.includes('search.html')) {
      const searchGrid = document.querySelector('.product-grid');
      const searchTitle = document.querySelector('h1');
      const resultCount = document.querySelector('.catalog-toolbar__count');
      const sortSelect = document.getElementById('s-sort');

      const urlParams = new URLSearchParams(window.location.search);
      const queryParam = urlParams.get('q') || '';

      if (queryParam) {
        searchInputs.forEach(i => i.value = queryParam);
        if (searchTitle) searchTitle.textContent = `Search results for "${queryParam}"`;
      }

      async function loadSearchPage() {
        if (!searchGrid) return;
        searchGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Searching products...</div>';
        try {
          const q = searchInputs[0]?.value || queryParam;
          let sortVal = 'newest';
          if (sortSelect) {
            if (sortSelect.value.includes('Low to High')) sortVal = 'price-asc';
            else if (sortSelect.value.includes('Rating')) sortVal = 'rating';
          }

          const data = await window.api.getProducts({ search: q, sort: sortVal, limit: 30 });
          const products = data.products || [];

          if (resultCount) resultCount.textContent = `${products.length} results for ${q ? `"${q}"` : 'all products'}`;

          if (products.length === 0) {
            searchGrid.innerHTML = `
              <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: #F8FAFC; border-radius: 12px;">
                <div style="font-size: 36px; margin-bottom: 12px;">🔍</div>
                <h3>No products found for "${q}"</h3>
                <p style="color: var(--text-muted); margin: 8px 0 16px;">Try checking your spelling or search for general categories like phones, shoes, or headphones.</p>
                <a href="../index.html" class="btn btn--primary btn--sm">Back to Home</a>
              </div>
            `;
            return;
          }

          searchGrid.innerHTML = products.map(p => `
            <article class="product-card" data-id="${p.id}">
              <div class="product-card__img-wrap">
                <img src="${p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}" alt="${p.title}" style="object-fit:cover" />
                <button class="btn--wishlist" aria-label="Add to wishlist">🤍</button>
              </div>
              <div class="product-card__body">
                <span class="product-card__brand">${p.brand || 'Generic'}</span>
                <a href="product-details.html?id=${p.id}" class="product-card__name">${p.title}</a>
                <div class="product-card__rating">
                  <span class="stars">⭐</span>
                  <span class="rating-text">${p.rating || 4.5} (${p.reviews_count || 12})</span>
                </div>
                <div class="product-card__price">
                  <span class="price--current">₹${parseFloat(p.price).toLocaleString('en-IN')}</span>
                  ${p.compare_price ? `<span class="price--old">₹${parseFloat(p.compare_price).toLocaleString('en-IN')}</span>` : ''}
                </div>
              </div>
              <div class="product-card__actions">
                <button type="button" class="btn btn--secondary btn--sm btn-add-cart" data-product-id="${p.id}">🛒 Add to Cart</button>
              </div>
            </article>
          `).join('');
        } catch (err) {
          searchGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 30px;">Failed to load search results: ${err.message}</div>`;
        }
      }

      if (sortSelect) sortSelect.addEventListener('change', loadSearchPage);
      loadSearchPage();
    }

    // ----------------------------------------------------
    // D. DYNAMIC CATEGORY PAGE (category.html)
    // ----------------------------------------------------
    if (window.location.pathname.includes('category.html')) {
      const catGrid = document.querySelector('.product-grid');
      const catHeading = document.querySelector('h1');
      const countEl = document.querySelector('.catalog-toolbar__count');
      const sortSelect = document.getElementById('cat-sort');

      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get('category') || '';

      if (catParam && catHeading) {
        catHeading.textContent = catParam.replace('-', ' ').replace(/\w/g, l => l.toUpperCase());
      }

      async function loadCategoryPage() {
        if (!catGrid) return;
        catGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Loading category products...</div>';
        try {
          let sortVal = 'newest';
          if (sortSelect) {
            if (sortSelect.value.includes('Low to High')) sortVal = 'price-asc';
            else if (sortSelect.value.includes('High to Low')) sortVal = 'price-desc';
            else if (sortSelect.value.includes('Rating')) sortVal = 'rating';
          }

          const params = { sort: sortVal, limit: 30 };
          if (catParam) params.category = catParam;

          const data = await window.api.getProducts(params);
          const products = data.products || [];

          if (countEl) countEl.textContent = `Showing ${products.length} of ${data.total || products.length} results`;

          if (products.length === 0) {
            catGrid.innerHTML = `
              <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: #F8FAFC; border-radius: 12px;">
                <div style="font-size: 36px; margin-bottom: 12px;">📦</div>
                <h3>No products in this category yet</h3>
                <p style="color: var(--text-muted); margin: 8px 0 16px;">Check back soon as we add new stock daily.</p>
                <a href="../index.html" class="btn btn--primary btn--sm">Back to Home</a>
              </div>
            `;
            return;
          }

          catGrid.innerHTML = products.map(p => `
            <article class="product-card" data-id="${p.id}">
              <div class="product-card__img-wrap">
                <img src="${p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}" alt="${p.title}" style="object-fit:cover" />
                <button class="btn--wishlist" aria-label="Add to wishlist">🤍</button>
              </div>
              <div class="product-card__body">
                <span class="product-card__brand">${p.brand || 'Generic'}</span>
                <a href="product-details.html?id=${p.id}" class="product-card__name">${p.title}</a>
                <div class="product-card__rating">
                  <span class="stars">⭐</span>
                  <span class="rating-text">${p.rating || 4.5} (${p.reviews_count || 12})</span>
                </div>
                <div class="product-card__price">
                  <span class="price--current">₹${parseFloat(p.price).toLocaleString('en-IN')}</span>
                  ${p.compare_price ? `<span class="price--old">₹${parseFloat(p.compare_price).toLocaleString('en-IN')}</span>` : ''}
                </div>
              </div>
              <div class="product-card__actions">
                <button type="button" class="btn btn--secondary btn--sm btn-add-cart" data-product-id="${p.id}">🛒 Add to Cart</button>
              </div>
            </article>
          `).join('');
        } catch (err) {
          catGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 30px;">Failed to load category products: ${err.message}</div>`;
        }
      }

      if (sortSelect) sortSelect.addEventListener('change', loadCategoryPage);
      loadCategoryPage();
    }
  })();

});