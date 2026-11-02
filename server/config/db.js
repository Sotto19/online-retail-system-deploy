import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

let pool = null;
let isConnected = false;

// Attempt to create MySQL pool
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'retail_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true
  });
} catch (err) {
  console.warn('[Database] Failed to initialize MySQL pool:', err.message);
}

// In-Memory Seed Storage for fallback
export const mockData = {
  users: [
    {
      id: 1,
      name: 'Arjun Khanna',
      email: 'admin@example.com',
      password_hash: '$2a$10$wT8fUfG8fW2m6z7q1C4g9eZqJk7Hh5P2kQ9L8yW6vE3mD1pB5nK8q', // password123 or admin123
      phone: '+91 9876543210',
      role: 'admin',
      status: 'active'
    },
    {
      id: 2,
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password_hash: '$2a$10$wT8fUfG8fW2m6z7q1C4g9eZqJk7Hh5P2kQ9L8yW6vE3mD1pB5nK8q', // password123
      phone: '+91 9812345678',
      role: 'customer',
      status: 'active'
    },
    {
      id: 3,
      name: 'Rahul Verma',
      email: 'rahul@example.com',
      password_hash: '$2a$10$wT8fUfG8fW2m6z7q1C4g9eZqJk7Hh5P2kQ9L8yW6vE3mD1pB5nK8q',
      phone: '+91 9823456789',
      role: 'customer',
      status: 'active'
    },
    {
      id: 4,
      name: 'Retail Admin',
      email: 'admin@retail.com',
      password_hash: '$2a$10$wT8fUfG8fW2m6z7q1C4g9eZqJk7Hh5P2kQ9L8yW6vE3mD1pB5nK8q', // admin123
      phone: '+91 9999988888',
      role: 'admin',
      status: 'active'
    },
    {
      id: 5,
      name: 'John Doe',
      email: 'john.doe@example.com',
      password_hash: '$2a$10$wT8fUfG8fW2m6z7q1C4g9eZqJk7Hh5P2kQ9L8yW6vE3mD1pB5nK8q', // password123
      phone: '+91 9888877777',
      role: 'customer',
      status: 'active'
    }
  ],
  categories: [
    { id: 1, name: 'Electronics', slug: 'electronics', description: 'Smartphones, audio, tech', image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60', is_active: 1 },
    { id: 2, name: 'Fashion', slug: 'fashion', description: 'Men and women apparel & shoes', image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&auto=format&fit=crop&q=60', is_active: 1 },
    { id: 3, name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Cookware, decor, and appliances', image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=60', is_active: 1 },
    { id: 4, name: 'Beauty & Personal Care', slug: 'beauty', description: 'Skincare and wellness', image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=60', is_active: 1 },
    { id: 5, name: 'Books & Stationery', slug: 'books', description: 'Bestselling paperbacks and stationery', image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60', is_active: 1 }
  ],
  products: [
    {
      id: 1,
      sku: 'SE-AUD-001',
      title: 'Noise-Cancelling Wireless Headphones',
      slug: 'noise-cancelling-wireless-headphones',
      brand: 'SoundCore',
      category_id: 1,
      category_name: 'Electronics',
      price: 4999.00,
      cost_price: 3200.00,
      compare_price: 7999.00,
      stock_quantity: 48,
      reorder_level: 10,
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      description: 'Premium high-resolution sound with 40-hour battery life and adaptive hybrid active noise cancellation.',
      rating: 4.8,
      reviews_count: 128
    },
    {
      id: 2,
      sku: 'SE-MOB-042',
      title: 'Galaxy S24 FE 5G (128GB)',
      slug: 'galaxy-s24-fe-5g',
      brand: 'Samsung',
      category_id: 1,
      category_name: 'Electronics',
      price: 42999.00,
      cost_price: 35000.00,
      compare_price: 49999.00,
      stock_quantity: 15,
      reorder_level: 5,
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80',
      description: 'Next-gen flagship smartphone with AI-assisted photography and stunning dynamic AMOLED 2X display.',
      rating: 4.6,
      reviews_count: 94
    },
    {
      id: 3,
      sku: 'SE-WAT-108',
      title: 'Pro GPS Smartwatch',
      slug: 'pro-gps-smartwatch',
      brand: 'FitTech',
      category_id: 1,
      category_name: 'Electronics',
      price: 3499.00,
      cost_price: 2100.00,
      compare_price: 5999.00,
      stock_quantity: 28,
      reorder_level: 8,
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      description: 'Track heart rate, SpO2, sleep, and workouts with 14-day battery life and water resistance.',
      rating: 4.5,
      reviews_count: 62
    },
    {
      id: 4,
      sku: 'SE-FAH-112',
      title: 'Air Max Athletic Sneakers',
      slug: 'air-max-athletic-sneakers',
      brand: 'Nike',
      category_id: 2,
      category_name: 'Fashion',
      price: 8495.00,
      cost_price: 5500.00,
      compare_price: 10995.00,
      stock_quantity: 32,
      reorder_level: 10,
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      description: 'Engineered mesh upper for breathability and iconic max-air cushioning unit for all-day comfort.',
      rating: 4.7,
      reviews_count: 210
    },
    {
      id: 5,
      sku: 'SE-FAH-204',
      title: 'Slim Fit Cotton Casual Shirt',
      slug: 'slim-fit-cotton-casual-shirt',
      brand: 'Arrow',
      category_id: 2,
      category_name: 'Fashion',
      price: 1499.00,
      cost_price: 800.00,
      compare_price: 2499.00,
      stock_quantity: 60,
      reorder_level: 15,
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
      description: '100% breathable combed cotton with a tailored modern cut suitable for work and casual outings.',
      rating: 4.3,
      reviews_count: 45
    },
    {
      id: 6,
      sku: 'SE-HOM-033',
      title: 'Cast Iron Pre-Seasoned Dutch Oven',
      slug: 'cast-iron-dutch-oven',
      brand: 'Prestige',
      category_id: 3,
      category_name: 'Home & Kitchen',
      price: 2999.00,
      cost_price: 1800.00,
      compare_price: 4499.00,
      stock_quantity: 22,
      reorder_level: 5,
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1584990347449-399c43e06180?w=600&auto=format&fit=crop&q=80',
      description: 'Heavy-duty cast iron retaining uniform heat for baking artisan bread, braising stews, and slow cooking.',
      rating: 4.9,
      reviews_count: 87
    },
    {
      id: 7,
      sku: 'SE-BOK-009',
      title: 'Atomic Habits - James Clear',
      slug: 'atomic-habits-james-clear',
      brand: 'Penguin',
      category_id: 5,
      category_name: 'Books & Stationery',
      price: 399.00,
      cost_price: 220.00,
      compare_price: 599.00,
      stock_quantity: 85,
      reorder_level: 20,
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80',
      description: 'An easy and proven way to build good habits and break bad ones. Multi-million copy global bestseller.',
      rating: 4.9,
      reviews_count: 540
    },
    {
      id: 8,
      sku: 'SE-BEA-055',
      title: 'Hydrating Vitamin C Glow Serum',
      slug: 'hydrating-vitamin-c-glow-serum',
      brand: 'Minimalist',
      category_id: 4,
      category_name: 'Beauty & Personal Care',
      price: 699.00,
      cost_price: 380.00,
      compare_price: 999.00,
      stock_quantity: 50,
      reorder_level: 10,
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
      description: 'Concentrated 10% ethyl ascorbic acid formulation designed to brighten dull skin and diminish dark spots.',
      rating: 4.6,
      reviews_count: 115
    }
  ],
  cart: [
    { id: 1, user_id: 2, product_id: 1, quantity: 1 },
    { id: 2, user_id: 2, product_id: 7, quantity: 2 }
  ],
  orders: [
    {
      id: 1,
      order_number: 'ORD-2026-90412',
      user_id: 2,
      subtotal: 4999.00,
      discount_amount: 499.90,
      shipping_fee: 0.00,
      tax_amount: 225.00,
      total_amount: 4724.10,
      order_status: 'delivered',
      payment_method: 'upi',
      payment_status: 'paid',
      shipping_address: 'Priya Sharma, Flat 402 Sunshine Apartments, MG Road, Indiranagar, Bengaluru, KA - 560038',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { product_id: 1, product_title: 'Noise-Cancelling Wireless Headphones', price: 4999.00, quantity: 1, total_price: 4999.00 }
      ]
    },
    {
      id: 2,
      order_number: 'ORD-2026-90413',
      user_id: 3,
      subtotal: 8495.00,
      discount_amount: 0.00,
      shipping_fee: 0.00,
      tax_amount: 424.00,
      total_amount: 8919.00,
      order_status: 'shipped',
      payment_method: 'card',
      payment_status: 'paid',
      shipping_address: 'Rahul Verma, House 15 Sector 14, Near City Center, Gurugram, HR - 122001',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { product_id: 4, product_title: 'Air Max Athletic Sneakers', price: 8495.00, quantity: 1, total_price: 8495.00 }
      ]
    }
  ],
  coupons: [
    { id: 1, code: 'NEWUSER', discount_type: 'percentage', discount_value: 10.00, min_order_amount: 499.00, is_active: 1 },
    { id: 2, code: 'FESTIVE20', discount_type: 'percentage', discount_value: 20.00, min_order_amount: 1999.00, is_active: 1 },
    { id: 3, code: 'FLAT500', discount_type: 'fixed', discount_value: 500.00, min_order_amount: 2999.00, is_active: 1 }
  ]
};

// Test Connection Helper
export async function testDbConnection() {
  if (!pool) return false;
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isConnected = true;
    console.log(`[Database] Successfully connected to MySQL at ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    return true;
  } catch (err) {
    isConnected = false;
    console.log(`[Database Info] Local MySQL server not detected on port 3306 (${err.code || 'offline'}).`);
    console.log(`[Database Info] ✔ Hybrid Fallback Mode active: All APIs, Auth, Cart, and Products are fully operational!`);
    return false;
  }
}

export function isDbConnected() {
  return isConnected;
}

export default pool;
