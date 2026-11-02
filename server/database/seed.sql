-- Online Retail System Database Seed Data
USE retail_db;

-- Clear previous data in correct reverse FK order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE wishlist_items;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE coupons;
TRUNCATE TABLE addresses;
TRUNCATE TABLE inventory_logs;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users (Passwords hashed for 'password123': $2a$10$wT8fUfG8fW2m6z7q1C4g9eZqJk7Hh5P2kQ9L8yW6vE3mD1pB5nK8q)
-- For demonstration/testing, the backend Auth controller also supports automatic verification.
INSERT INTO users (id, name, email, password_hash, phone, role, status) VALUES
(1, 'Arjun Khanna', 'admin@example.com', '$2a$10$wT8fUfG8fW2m6z7q1C4g9eZqJk7Hh5P2kQ9L8yW6vE3mD1pB5nK8q', '+91 9876543210', 'admin', 'active'),
(2, 'Priya Sharma', 'priya@example.com', '$2a$10$wT8fUfG8fW2m6z7q1C4g9eZqJk7Hh5P2kQ9L8yW6vE3mD1pB5nK8q', '+91 9812345678', 'customer', 'active'),
(3, 'Rahul Verma', 'rahul@example.com', '$2a$10$wT8fUfG8fW2m6z7q1C4g9eZqJk7Hh5P2kQ9L8yW6vE3mD1pB5nK8q', '+91 9823456789', 'customer', 'active'),
(4, 'Neha Patel', 'neha@example.com', '$2a$10$wT8fUfG8fW2m6z7q1C4g9eZqJk7Hh5P2kQ9L8yW6vE3mD1pB5nK8q', '+91 9834567890', 'customer', 'active');

-- 2. Categories
INSERT INTO categories (id, name, slug, description, image_url, is_active) VALUES
(1, 'Electronics', 'electronics', 'Smartphones, audio gear, smartwatches and high-tech gadgets.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60', TRUE),
(2, 'Fashion', 'fashion', 'Trendy men and women clothing, footwear, and designer accessories.', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&auto=format&fit=crop&q=60', TRUE),
(3, 'Home & Kitchen', 'home-kitchen', 'Modern cookware, home appliances, and elegant decor.', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=60', TRUE),
(4, 'Beauty & Personal Care', 'beauty', 'Skincare, cosmetics, fragrances, and wellness essentials.', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=60', TRUE),
(5, 'Books & Stationery', 'books', 'Bestsellers, self-help, business books, and stationery.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60', TRUE);

-- 3. Products
INSERT INTO products (id, sku, title, slug, brand, category_id, price, cost_price, compare_price, stock_quantity, reorder_level, status, image_url, description, rating, reviews_count) VALUES
(1, 'SE-AUD-001', 'Noise-Cancelling Wireless Headphones', 'noise-cancelling-wireless-headphones', 'SoundCore', 1, 4999.00, 3200.00, 7999.00, 48, 10, 'active', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', 'Premium high-resolution sound with 40-hour battery life and adaptive hybrid active noise cancellation.', 4.8, 128),
(2, 'SE-MOB-042', 'Galaxy S24 FE 5G (128GB)', 'galaxy-s24-fe-5g', 'Samsung', 1, 42999.00, 35000.00, 49999.00, 15, 5, 'active', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80', 'Next-gen flagship smartphone with AI-assisted photography and stunning dynamic AMOLED 2X display.', 4.6, 94),
(3, 'SE-WAT-108', 'Pro GPS Smartwatch', 'pro-gps-smartwatch', 'FitTech', 1, 3499.00, 2100.00, 5999.00, 28, 8, 'active', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80', 'Track heart rate, SpO2, sleep, and workouts with 14-day battery life and water resistance.', 4.5, 62),
(4, 'SE-FAH-112', 'Air Max Athletic Sneakers', 'air-max-athletic-sneakers', 'Nike', 2, 8495.00, 5500.00, 10995.00, 32, 10, 'active', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', 'Engineered mesh upper for breathability and iconic max-air cushioning unit for all-day comfort.', 4.7, 210),
(5, 'SE-FAH-204', 'Slim Fit Cotton Casual Shirt', 'slim-fit-cotton-casual-shirt', 'Arrow', 2, 1499.00, 800.00, 2499.00, 60, 15, 'active', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80', '100% breathable combed cotton with a tailored modern cut suitable for work and casual outings.', 4.3, 45),
(6, 'SE-HOM-033', 'Cast Iron Pre-Seasoned Dutch Oven', 'cast-iron-dutch-oven', 'Prestige', 3, 2999.00, 1800.00, 4499.00, 22, 5, 'active', 'https://images.unsplash.com/photo-1584990347449-399c43e06180?w=600&auto=format&fit=crop&q=80', 'Heavy-duty cast iron retaining uniform heat for baking artisan bread, braising stews, and slow cooking.', 4.9, 87),
(7, 'SE-BOK-009', 'Atomic Habits - James Clear', 'atomic-habits-james-clear', 'Penguin', 5, 399.00, 220.00, 599.00, 85, 20, 'active', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80', 'An easy and proven way to build good habits and break bad ones. Multi-million copy global bestseller.', 4.9, 540),
(8, 'SE-BEA-055', 'Hydrating Vitamin C Glow Serum', 'hydrating-vitamin-c-glow-serum', 'Minimalist', 4, 699.00, 380.00, 999.00, 50, 10, 'active', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80', 'Concentrated 10% ethyl ascorbic acid formulation designed to brighten dull skin and diminish dark spots.', 4.6, 115);

-- 4. Initial Inventory Logs
INSERT INTO inventory_logs (product_id, change_type, quantity_change, new_quantity, notes) VALUES
(1, 'restock', 50, 50, 'Initial supplier batch arrival'),
(2, 'restock', 20, 20, 'Shipment received from distributor'),
(3, 'restock', 30, 30, 'Initial inventory setup'),
(4, 'restock', 35, 35, 'Seasonal footwear collection'),
(5, 'restock', 60, 60, 'Apparel bulk arrival'),
(6, 'restock', 25, 25, 'Kitchenware restock'),
(7, 'restock', 100, 100, 'Books shipment from publisher'),
(8, 'restock', 55, 55, 'Cosmetics batch verification');

-- 5. Addresses
INSERT INTO addresses (user_id, full_name, phone, address_line1, address_line2, city, state, pincode, is_default) VALUES
(2, 'Priya Sharma', '+91 9812345678', 'Flat 402, Sunshine Apartments', 'MG Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', TRUE),
(3, 'Rahul Verma', '+91 9823456789', 'House 15, Sector 14', 'Near City Center', 'Gurugram', 'Haryana', '122001', TRUE);

-- 6. Coupons
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, expires_at, is_active) VALUES
('NEWUSER', 'percentage', 10.00, 499.00, '2027-12-31', TRUE),
('FESTIVE20', 'percentage', 20.00, 1999.00, '2027-12-31', TRUE),
('FLAT500', 'fixed', 500.00, 2999.00, '2027-12-31', TRUE);

-- 7. Orders
INSERT INTO orders (id, order_number, user_id, coupon_id, subtotal, discount_amount, shipping_fee, tax_amount, total_amount, order_status, payment_method, payment_status, shipping_address) VALUES
(1, 'ORD-2026-90412', 2, 1, 4999.00, 499.90, 0.00, 225.00, 4724.10, 'delivered', 'upi', 'paid', 'Priya Sharma, Flat 402 Sunshine Apartments, MG Road, Indiranagar, Bengaluru, KA - 560038'),
(2, 'ORD-2026-90413', 3, NULL, 8495.00, 0.00, 0.00, 424.00, 8919.00, 'shipped', 'card', 'paid', 'Rahul Verma, House 15 Sector 14, Near City Center, Gurugram, HR - 122001'),
(3, 'ORD-2026-90414', 2, 1, 399.00, 39.90, 50.00, 18.00, 427.10, 'processing', 'cod', 'pending', 'Priya Sharma, Flat 402 Sunshine Apartments, MG Road, Indiranagar, Bengaluru, KA - 560038');

-- 8. Order Items
INSERT INTO order_items (order_id, product_id, product_title, price, quantity, total_price) VALUES
(1, 1, 'Noise-Cancelling Wireless Headphones', 4999.00, 1, 4999.00),
(2, 4, 'Air Max Athletic Sneakers', 8495.00, 1, 8495.00),
(3, 7, 'Atomic Habits - James Clear', 399.00, 1, 399.00);

-- 9. Cart Items
INSERT INTO cart_items (user_id, product_id, quantity) VALUES
(2, 3, 1),
(2, 8, 2);

-- 10. Wishlist
INSERT INTO wishlist_items (user_id, product_id) VALUES
(2, 2),
(2, 4),
(3, 1);

-- 11. Notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(2, 'Order Dispatched', 'Your order ORD-2026-90412 has been delivered successfully.', 'order', TRUE),
(2, 'Special Welcome Offer', 'Use coupon NEWUSER to get 10% off your purchase!', 'promo', FALSE),
(1, 'Low Stock Alert', 'Product Galaxy S24 FE 5G has fallen to 15 units.', 'inventory', FALSE);
