import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { testDbConnection, isDbConnected } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Base Landing (/api and /api/)
app.get(['/api', '/api/'], (req, res) => {
  const dbConnected = isDbConnected();
  const apiData = {
    name: "Online Retail Management System API",
    version: "1.0.0",
    status: "online",
    timestamp: new Date().toISOString(),
    database: {
      driver: "mysql2",
      connected: dbConnected,
      mode: dbConnected ? "live-mysql" : "hybrid-fallback"
    },
    popularCoupons: ["SAVE20", "NEWUSER", "ELEC15", "FESTIVE20", "FLAT500"],
    endpoints: {
      health: "/api/health",
      auth: "/api/auth (login, register, me)",
      products: "/api/products (list, search, create, update, delete)",
      categories: "/api/categories",
      cart: "/api/cart (view, add, update, remove)",
      coupons: "/api/coupons (validate, list, create, toggle, delete)",
      orders: "/api/orders (place, history, details)",
      admin: "/api/admin (dashboard, orders, inventory, customers)"
    },
    links: {
      store: "/",
      cart: "/customer/cart.html",
      admin: "/admin/dashboard.html",
      discounts: "/admin/discounts.html",
      health: "/api/health"
    }
  };

  // Serve modern status dashboard when opened in a browser
  const acceptHeader = req.headers['accept'] || '';
  if (req.accepts('html') && !req.xhr && !acceptHeader.startsWith('application/json')) {
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Base - Satyabrata's Online Retail System</title>
  <style>
    :root {
      --bg: #0B0F19;
      --card-bg: #111827;
      --border: #1F2937;
      --border-light: #374151;
      --text: #F9FAFB;
      --text-muted: #9CA3AF;
      --primary: #3B82F6;
      --primary-hover: #2563EB;
      --success: #10B981;
      --success-bg: rgba(16, 185, 129, 0.12);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }
    .container {
      width: 100%;
      max-width: 820px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--success-bg);
      color: #34D399;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .dot {
      width: 8px;
      height: 8px;
      background: #10B981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10B981;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    p.lead {
      color: var(--text-muted);
      font-size: 15px;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 28px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .btn-secondary { background: #1F2937; color: #F3F4F6; border: 1px solid var(--border-light); }
    .btn-secondary:hover { background: #374151; }
    .meta-box {
      background: #0B0F19;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px 20px;
      font-size: 13px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
    }
    .meta-item span { color: var(--text-muted); display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .meta-item strong { color: #F9FAFB; font-size: 14px; }
    h2 { font-size: 16px; margin-bottom: 14px; font-weight: 600; }
    .endpoints-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 12px;
    }
    .endpoint-card {
      background: rgba(11, 15, 25, 0.7);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 14px;
      text-decoration: none;
      color: inherit;
      display: block;
      transition: all 0.2s;
    }
    .endpoint-card:hover {
      border-color: var(--primary);
      background: #111827;
      transform: translateY(-1px);
    }
    .method {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 6px;
    }
    .method-get { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
    .method-post { background: rgba(16, 185, 129, 0.2); color: #34D399; }
    .ep-path { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #E5E7EB; }
    .ep-desc { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge"><span class="dot"></span> REST API Base Active</div>
    <h1>Retail Management System API</h1>
    <p class="lead">The backend REST API base is operational and ready to serve customer storefront requests, shopping cart operations, live coupon validations, and administrative tasks.</p>

    <div class="actions">
      <a href="/" class="btn btn-primary">🛍️ View Storefront</a>
      <a href="/customer/cart.html" class="btn btn-secondary">🛒 Shopping Cart</a>
      <a href="/admin/dashboard.html" class="btn btn-secondary">🛡️ Admin Portal</a>
      <a href="/admin/discounts.html" class="btn btn-secondary">🎟️ Discounts Manager</a>
      <a href="/api/health" class="btn btn-secondary">🩺 Health Status</a>
    </div>

    <div class="meta-box">
      <div class="meta-item">
        <span>Database Mode</span>
        <strong>${dbConnected ? '🟢 Live MySQL (Port 3306)' : '🟡 Hybrid Fallback (In-Memory)'}</strong>
      </div>
      <div class="meta-item">
        <span>Active Promo Codes</span>
        <strong style="color:#60A5FA">SAVE20 (20% OFF), NEWUSER (10% OFF), ELEC15</strong>
      </div>
      <div class="meta-item">
        <span>Server Port</span>
        <strong>${PORT}</strong>
      </div>
    </div>

    <h2>Interactive API Endpoints</h2>
    <div class="endpoints-grid">
      <a href="/api/health" class="endpoint-card">
        <div><span class="method method-get">GET</span><span class="ep-path">/api/health</span></div>
        <div class="ep-desc">Server health & database status</div>
      </a>
      <a href="/api/products" class="endpoint-card">
        <div><span class="method method-get">GET</span><span class="ep-path">/api/products</span></div>
        <div class="ep-desc">Product catalog & filters</div>
      </a>
      <a href="/api/categories" class="endpoint-card">
        <div><span class="method method-get">GET</span><span class="ep-path">/api/categories</span></div>
        <div class="ep-desc">Store categories</div>
      </a>
      <a href="/api/coupons" class="endpoint-card">
        <div><span class="method method-get">GET</span><span class="ep-path">/api/coupons</span></div>
        <div class="ep-desc">List all discount coupons</div>
      </a>
      <div class="endpoint-card">
        <div><span class="method method-post">POST</span><span class="ep-path">/api/coupons/validate</span></div>
        <div class="ep-desc">Validate code (e.g. Save20)</div>
      </div>
      <a href="/api/cart" class="endpoint-card">
        <div><span class="method method-get">GET</span><span class="ep-path">/api/cart</span></div>
        <div class="ep-desc">Live shopping cart items</div>
      </a>
      <a href="/api/orders" class="endpoint-card">
        <div><span class="method method-get">GET</span><span class="ep-path">/api/orders</span></div>
        <div class="ep-desc">Customer order history</div>
      </a>
      <a href="/api/admin/dashboard" class="endpoint-card">
        <div><span class="method method-get">GET</span><span class="ep-path">/api/admin/dashboard</span></div>
        <div class="ep-desc">Admin analytics & metrics</div>
      </a>
    </div>
  </div>
</body>
</html>`);
  }

  res.json(apiData);
});

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      driver: 'mysql2',
      connected: isDbConnected(),
      mode: isDbConnected() ? 'live-mysql' : 'hybrid-fallback'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);

// API 404 Handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint ${req.originalUrl} not found.` });
});

// Static Frontend Serving (Supports both monolithic root and /client structure)
const clientPath = path.resolve(__dirname, '../client');
const rootPath = path.resolve(__dirname, '..');

// Serve static frontend files
app.use(express.static(clientPath));
app.use(express.static(rootPath));


// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Retail Management Backend Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
  await testDbConnection();
});
