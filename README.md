# 🛒 Online Retail & Shopping Management System

A production-ready full-stack shopping and retail management platform featuring a responsive storefront, comprehensive administrative dashboard, RESTful API backend, and relational MySQL database schema.

---

## 🌟 Key Features

* **Storefront Experience**:
  * Product discovery with keyword search, category filtering, price sorting, and rating metrics.
  * Real-time shopping cart with quantity adjustments and coupon code validation.
  * Frictionless checkout flow with order summary calculation (GST, discounts, and free delivery thresholds).
  * Customer order history tracking and status indicators.
* **Administrative Management Portal**:
  * Executive dashboard with total sales revenue, order volumes, customer count, and low stock warnings.
  * Full product catalog CRUD operations (add, edit pricing, deactivate products).
  * Order fulfillment and lifecycle management (`pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`).
  * Live inventory tracking with threshold-based reorder alerts and one-click restocking.
  * Customer roster analysis with aggregate spend calculations.
* **Security & Reliability**:
  * Stateless **JWT (JSON Web Token)** authentication with role-based access control (`admin`, `customer`).
  * Password hashing with **bcryptjs**.
  * Parameterized SQL queries preventing SQL injection attacks.
  * Built-in **Hybrid In-Memory Fallback** mode: enables immediate zero-configuration local preview even prior to provisioning a live MySQL instance.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js (v18+), Express.js (v4), `mysql2/promise`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv` |
| **Database** | MySQL 8.0+ / MariaDB 10.4+ |
| **Frontend** | Semantic HTML5, Vanilla CSS3 (Custom design system, CSS Grid, Flexbox), Vanilla JavaScript ES6+ |
| **Architecture** | RESTful API Client-Server Monorepo |

---

## 📁 Project Structure

```
online-retail-system/
├── admin/                      # Admin portal pages (Dashboard, Products, Orders, Inventory, etc.)
├── customer/                   # Customer storefront pages (Products, Cart, Checkout, Orders, etc.)
├── css/                        # Design system & modular CSS stylesheets
├── js/
│   ├── config.js               # API URL base configuration
│   ├── api.js                  # Centralized RESTful API client with JWT handling
│   ├── auth.js                 # Authentication form bindings
│   ├── main.js                 # Global navbar session & cart badge state
│   ├── cart.js                 # Interactive shopping cart manager
│   ├── checkout.js             # Checkout processor & order placement
│   └── admin-app.js            # Admin portal live data synchronization
├── server/                     # Backend API server
│   ├── config/
│   │   └── db.js               # MySQL2 connection pool & fallback state
│   ├── controllers/            # Business logic handlers
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── couponController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── auth.js             # JWT verification & admin authorization
│   ├── routes/                 # Express route definitions
│   ├── database/
│   │   ├── schema.sql          # MySQL database schema (11 relational tables)
│   │   ├── seed.sql            # Seed dataset (users, products, categories, orders)
│   │   └── initDb.js           # Automated database initialization script
│   ├── .env.example            # Environment variables template
│   ├── package.json            # Server dependencies
│   └── server.js               # Express server entry point
├── index.html                  # Main store homepage
├── login.html                  # User & Admin authentication
├── register.html               # Account creation
├── package.json                # Monorepo root scripts
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

* **Node.js**: `v18.0.0` or higher installed
* **MySQL Server**: `v8.0` or higher (optional for immediate mock testing; required for live MySQL persistence)

---

### 1. Installation

Install dependencies from the root directory:

```bash
# Installs backend dependencies
npm run postinstall
# Or cd into server:
cd server && npm install
```

---

### 2. Environment Configuration

Copy the example environment file in `server/`:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` to match your local MySQL configuration:

```env
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=retail_db

# JWT Secret
JWT_SECRET=retail_super_secret_jwt_key_2026_change_in_production
JWT_EXPIRES_IN=7d

# CORS Allowed Origin
CLIENT_URL=http://localhost:5000
```

---

### 3. Database Initialization (MySQL)

Ensure your MySQL server is running, then execute the automated database setup script:

```bash
npm run db:init
```

This will automatically create the `retail_db` database, apply `schema.sql`, and populate sample records from `seed.sql`.

*(Manual alternative: Import `server/database/schema.sql` followed by `server/database/seed.sql` using MySQL Workbench or phpMyAdmin).*

---

### 4. Running the Server

Start the application:

```bash
npm start
```

For hot-reload during development:

```bash
npm run dev
```

* **Frontend & Backend unified URL**: Open [http://localhost:5000](http://localhost:5000) in your browser.
* **REST API base endpoint**: [http://localhost:5000/api](http://localhost:5000/api)
* **System health check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Default Credentials for Testing

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@example.com` | `password123` |
| **Customer** | `priya@example.com` | `password123` |
| **Customer 2** | `rahul@example.com` | `password123` |

---

## 📚 RESTful API Specification

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a customer or administrator account.
* `POST /api/auth/login` — Sign in and receive a JSON Web Token.
* `GET /api/auth/me` — Retrieve current authenticated session user.
* `PUT /api/auth/profile` — Update account profile details or password.

### Products & Categories (`/api/products`, `/api/categories`)
* `GET /api/categories` — List all active categories with product counts.
* `POST /api/categories` *(Admin)* — Create a new category.
* `GET /api/products` — Filter products by category, search query, price bounds, sorting, and pagination.
* `GET /api/products/:id` — Retrieve single product details and related recommendations.
* `POST /api/products` *(Admin)* — Add a new product to inventory.
* `PUT /api/products/:id` *(Admin)* — Update existing product information.
* `DELETE /api/products/:id` *(Admin)* — Deactivate/delete a product.

### Cart & Coupons (`/api/cart`, `/api/coupons`)
* `GET /api/cart` — Get items in authenticated user's cart with subtotal.
* `POST /api/cart` — Add product to cart.
* `PUT /api/cart/:id` — Update quantity of an item.
* `DELETE /api/cart/:id` — Remove item from cart.
* `DELETE /api/cart` — Empty cart.
* `POST /api/coupons/validate` — Validate promo code (`NEWUSER`, `FESTIVE20`, `FLAT500`).

### Checkout & Orders (`/api/orders`)
* `POST /api/orders` — Place order, deduct inventory, and record transaction items.
* `GET /api/orders` — Retrieve user's order history.
* `GET /api/orders/:orderNumber` — Retrieve detailed order breakdown and delivery status.

### Admin Operations (`/api/admin`)
* `GET /api/admin/dashboard` — Analytics KPIs (revenue, orders, low stock count, recent orders).
* `GET /api/admin/orders` — All store orders with search and status filter.
* `PATCH /api/admin/orders/:id/status` — Advance order fulfillment status.
* `GET /api/admin/inventory` — Stock levels and reorder alerts.
* `POST /api/admin/inventory/adjust` — Restock or adjust item quantities.
* `GET /api/admin/customers` — Customer list with total orders and lifetime spend.

---

## 📄 License

This project is licensed under the ISC License.
