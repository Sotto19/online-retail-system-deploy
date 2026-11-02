// Unified RESTful API Client for Retail Management System
const api = {
  baseUrl: (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'http://localhost:5000/api',

  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  },

  getCurrentUser() {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  },

  // Auth Endpoints
  async register(name, email, password, phone = '', role = 'customer') {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: { name, email, password, phone, role }
    });
    if (data.token) this.setToken(data.token);
    if (data.user) this.setCurrentUser(data.user);
    return data;
  },

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (data.token) this.setToken(data.token);
    if (data.user) this.setCurrentUser(data.user);
    return data;
  },

  logout() {
    this.setToken(null);
    this.setCurrentUser(null);
    window.location.href = window.location.pathname.includes('/admin/') ? '../login.html' : 'login.html';
  },

  async getMe() {
    return this.request('/auth/me');
  },

  // Products & Categories
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? '?' + query : ''}`);
  },

  async getProduct(id) {
    return this.request(`/products/${id}`);
  },

  async getCategories() {
    return this.request('/categories');
  },

  // Cart Management
  async getCart() {
    return this.request('/cart');
  },

  async addToCart(productId, quantity = 1) {
    return this.request('/cart', {
      method: 'POST',
      body: { productId, quantity }
    });
  },

  async updateCartItem(id, quantity) {
    return this.request(`/cart/${id}`, {
      method: 'PUT',
      body: { quantity }
    });
  },

  async removeFromCart(id) {
    return this.request(`/cart/${id}`, {
      method: 'DELETE'
    });
  },

  // Coupons
  async validateCoupon(code, orderAmount) {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: { code, orderAmount }
    });
  },

  // Orders
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: orderData
    });
  },

  async getMyOrders() {
    return this.request('/orders');
  },

  async getOrder(idOrNumber) {
    return this.request(`/orders/${idOrNumber}`);
  },

  // Admin Portal API
  admin: {
    getDashboard() {
      return api.request('/admin/dashboard');
    },
    getProducts(params = {}) {
      return api.getProducts({ ...params, status: 'all' });
    },
    createProduct(productData) {
      return api.request('/products', {
        method: 'POST',
        body: productData
      });
    },
    updateProduct(id, productData) {
      return api.request(`/products/${id}`, {
        method: 'PUT',
        body: productData
      });
    },
    deleteProduct(id) {
      return api.request(`/products/${id}`, {
        method: 'DELETE'
      });
    },
    getOrders(params = {}) {
      const q = new URLSearchParams(params).toString();
      return api.request(`/admin/orders${q ? '?' + q : ''}`);
    },
    updateOrderStatus(id, status, payment_status) {
      return api.request(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: { status, payment_status }
      });
    },
    getInventory() {
      return api.request('/admin/inventory');
    },
    adjustInventory(productId, changeType, quantity, notes) {
      return api.request('/admin/inventory/adjust', {
        method: 'POST',
        body: { productId, changeType, quantity, notes }
      });
    },
    getCustomers() {
      return api.request('/admin/customers');
    }
  }
};

window.api = api;
