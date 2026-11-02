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

// Static Frontend Serving (Supports both monolithic root and /client structure)
const clientPath = path.resolve(__dirname, '../client');
const rootPath = path.resolve(__dirname, '..');

// Serve static frontend files
app.use(express.static(clientPath));
app.use(express.static(rootPath));

// API 404 Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.originalUrl} not found.` });
});

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
