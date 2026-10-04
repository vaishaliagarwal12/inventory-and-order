# Enterprise Inventory & Order Management System

A production-ready full-stack enterprise application built with a strong emphasis on backend architecture, database integrity, concurrency protection, multi-currency support, security, responsive UI design, and global theme customization.

---

## 🎯 Project Overview & Problem Statement

Modern enterprise supply-chain and order processing platforms require strict data consistency, race-condition protection during high-volume purchasing, robust authorization boundaries between internal staff and external customers, and flexible multi-currency visualization.

This project delivers an end-to-end Solution for inventory allocation and order execution:
- **Atomicity**: Prevents overselling and negative stock through PostgreSQL `BEGIN`/`COMMIT`/`ROLLBACK` transactions and `FOR UPDATE` row locking.
- **Security**: Implements stateless JWT authentication with Role-Based Access Control (`CUSTOMER` vs `ADMIN`) and identity impersonation protection.
- **Multi-Currency Display**: Serves real-time USD ↔ INR exchange rates with 1-hour server-side caching and graceful fallback.
- **Global Theme System**: Offers 4 distinct, persistent themes (`Dark`, `Light`, `Desktop Dark`, `Desktop Light`).

---

## ✨ Key Features & User Roles

### 👤 Customer Capabilities
- **Product Discovery**: Search, filter by category, paginated catalog browsing, and real-time stock availability badges.
- **Cart Procurement**: Client-side cart staging with dynamic line-item quantity controls, instant subtotal calculation, and persistence.
- **Transactional Checkout**: Atomic multi-item order placement with stock deduction and order confirmation.
- **Order History & Management**: View historical orders, detailed itemized breakdown, and one-click order cancellation with automatic stock restoration for eligible pending orders.
- **Localization**: Live currency toggle between USD ($) and INR (₹).

### 🛠️ Admin Capabilities
- **Executive Dashboard**: System KPI metrics (active orders, revenue, inventory alerts, user metrics) and recent activity logs.
- **Catalog Management**: Add, update, activate/deactivate, and archive products; create and manage product categories.
- **Inventory Control**: Single-warehouse stock management, manual quantity updates, batch adjustments, and low-stock threshold monitoring.
- **Fulfillment Management**: Review all customer orders, filter by status (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`), and process status lifecycle updates.
- **User Directory**: View registered customer accounts and role designations.

---

## 💻 Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React 18, Vite 6, Tailwind CSS v3, Lucide Icons |
| **State & Context** | React Context (`AuthContext`, `CartContext`, `CurrencyContext`, `ThemeContext`) |
| **Backend API** | Node.js, Express 4, Layered Architecture |
| **Database** | PostgreSQL 16+, `pg` Connection Pooling |
| **Security & Auth** | JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), CORS |
| **Testing** | Custom Node.js Automated Verification Suites (9 test suites, 100% pass rate) |

---

## 🏗️ Layered Architecture Overview

```text
               +-------------------------------------------------------+
               |                  React 18 Frontend                   |
               |        (Vite, Tailwind, Context API, Lucide)          |
               +-------------------------------------------------------+
                                           │
                                     HTTP / REST / JSON
                                           │
               +-------------------------------------------------------+
               |                  Express API Server                   |
               +-------------------------------------------------------+
                                           │
       ┌───────────────────────────────────┴───────────────────────────────────┐
       ▼                                                                       ▼
[ authenticateToken ] (JWT Verification)                            [ authorizeRoles ] (Role Guard)
       │                                                                       │
       └───────────────────────────────────┬───────────────────────────────────┘
                                           │
                                  Route Layer (/api/*)
                                           │
                                   Controller Layer
                                           │
                                     Service Layer
                                 (Business & Concurrency)
                                           │
                                   Repository Layer
                                 (Parameterized SQL)
                                           │
                                           ▼
               +-------------------------------------------------------+
               |             PostgreSQL Relational Pool                |
               |  (Row Locking FOR UPDATE, ACID Transactions, Checks)  |
               +-------------------------------------------------------+
```

---

## 🗄️ Database Schema & Relational Model

The PostgreSQL database follows a 3rd Normal Form (3NF) relational design:

```text
   +------------------+         +--------------------+         +-------------------+
   |      users       |         |     categories     |         |     products      |
   +------------------+         +--------------------+         +-------------------+
   | id (PK)          |         | id (PK)            |         | id (PK)           |
   | email (UNIQUE)   |         | name (UNIQUE)      |         | category_id (FK)  |
   | password_hash    |         | description        |         | name              |
   | role             |         | created_at         |         | sku (UNIQUE)      |
   | created_at       |         +--------------------+         | price (>= 0)      |
   +--------+---------+                                   is_active           |
            | 1                                                +---------+---------+
            |                                                            | 1
            | N                                                          |
   +--------+---------+         +--------------------+                   |
   |      orders      |         |     inventory      |                   | 1
   +------------------+         +--------------------+                   |
   | id (PK)          |         | id (PK)            | <-----------------+
   | user_id (FK)     |         | product_id (FK,UQ) |
   | total_amount     |         | quantity (>= 0)    |
   | status           |         | updated_at         |
   | created_at       |         +--------------------+
   +--------+---------+
            | 1
            |
            | N
   +--------+---------+
   |   order_items    |
   +------------------+
   | id (PK)          |
   | order_id (FK)    |
   | product_id (FK)  |
   | quantity (> 0)   |
   | price_at_purchase|
   +------------------+
```

### Constraints & Data Integrity
- `users.role`: Constrained to `'CUSTOMER'` or `'ADMIN'`.
- `orders.status`: Constrained to `'PENDING'`, `'CONFIRMED'`, `'PROCESSING'`, `'SHIPPED'`, `'DELIVERED'`, or `'CANCELLED'`.
- `inventory.quantity`: Constrained to `quantity >= 0` via database `CHECK` constraint.
- `order_items.quantity`: Constrained to `quantity > 0`.
- `products.price`: Constrained to `price >= 0`.

---

## 🔐 Authentication & Security Mechanics

1. **Password Encryption**: Passwords are hashed using `bcryptjs` with salt rounds = 10. Raw passwords and hashes are never exposed in log files or DTOs.
2. **Stateless JWT Tokens**: Issued upon authentication containing `id`, `email`, and `role`. Verified via `Authorization: Bearer <token>` header.
3. **Impersonation Prevention**: `POST /api/orders` enforces order binding to `req.user.id` from the validated token payload.
4. **Data Isolation**: Customers can only view and cancel their own orders. Admin users have elevated privileges to manage all system resources.

---

## ⚡ Concurrency & Transactional Order Lifecycle

Order creation executes atomically inside a single PostgreSQL transaction (`BEGIN` / `COMMIT` / `ROLLBACK`):

1. **Transaction Begin**: `BEGIN;`
2. **Row Locking**: For each item in cart, lock inventory row: `SELECT quantity FROM inventory WHERE product_id = $1 FOR UPDATE;`
3. **Validation**: Verify `quantity >= requested_quantity`. If insufficient, throw error and `ROLLBACK;`.
4. **Order Insertion**: Insert record into `orders` with status `'PENDING'`.
5. **Item Insertion**: Insert records into `order_items` preserving `price_at_purchase`.
6. **Stock Deduction**: Execute `UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2;`.
7. **Transaction Commit**: `COMMIT;`

If an order is cancelled, the reserved quantities are restored to `inventory` atomically.

---

## 🌐 Multi-Currency System (USD & INR)

- **Base Currency**: Stored database values in PostgreSQL remain strictly in **USD**.
- **Exchange Rates API**: `GET /api/currency/rates` retrieves live USD $\rightarrow$ INR rates, cached in-memory for 1 hour with a fallback rate of 83.50.
- **Client Rendering**: `<CurrencyPrice amount={val} />` converts and formats values dynamically according to the user's active currency selection.

---

## 🎨 Global Theme System

The application features 4 selectable themes managed via `ThemeContext` and persisted in `localStorage`:
- **Dark**: Dark navy workspace (`#0f131c`) with cyan accents.
- **Light**: Clean light workspace (`#f5f7fa`) with sky blue accents.
- **Desktop Dark**: Deep dark enterprise workspace (`#070a12`) with indigo accents.
- **Desktop Light**: Slate light enterprise workspace (`#f1f5f9`) with indigo accents.

---

## 📖 API Endpoint Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new customer account (Public)
- `POST /api/auth/login` — Authenticate and receive JWT Bearer token (Public)
- `GET /api/auth/me` — Retrieve current authenticated user profile (Bearer Token)
- `GET /api/auth/users` — List registered accounts (Admin Only)

### Categories (`/api/categories`)
- `GET /api/categories` — List all categories (Public)
- `POST /api/categories` — Create a category (Admin Only)
- `PUT /api/categories/:id` — Update category details (Admin Only)
- `DELETE /api/categories/:id` — Delete category (Admin Only)

### Products (`/api/products`)
- `GET /api/products` — Search, filter, and paginate catalog (Public)
- `GET /api/products/:id` — Get product details by ID (Public)
- `POST /api/products` — Create a new product (Admin Only)
- `PUT /api/products/:id` — Update product details (Admin Only)
- `PATCH /api/products/:id/status` — Toggle active status (Admin Only)
- `DELETE /api/products/:id` — Soft-delete or archive product (Admin Only)

### Inventory (`/api/inventory`)
- `GET /api/inventory` — List inventory stock levels (Admin Only)
- `GET /api/inventory/product/:productId` — Get stock for a specific product (Admin Only)
- `POST /api/inventory` — Initialize stock for a product (Admin Only)
- `PUT /api/inventory/product/:productId` — Set exact stock quantity (Admin Only)
- `PATCH /api/inventory/product/:productId/adjust` — Adjust stock quantity relative (Admin Only)

### Orders (`/api/orders`)
- `GET /api/orders` — List orders (Customer: Own orders; Admin: All orders)
- `GET /api/orders/:id` — Get order breakdown by ID (Customer: Own order; Admin: Any order)
- `POST /api/orders` — Create new order with atomic stock reservation (Authenticated)
- `PATCH /api/orders/:id/status` — Update order status or cancel pending order (Authenticated)

### Currency & System (`/api/currency`, `/api/health`)
- `GET /api/currency/rates` — Get USD/INR exchange rates (Public)
- `GET /api/health` — System status & PostgreSQL pool diagnostic (Public)

---

## ⚙️ Environment Variables Setup

### Server Environment Configuration (`server/.env`)
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=postgres

# Security Secrets
JWT_SECRET=your_strong_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=1d

# Operational Thresholds
LOW_STOCK_THRESHOLD=10
```

### Client Environment Configuration (`client/.env`)
Create `client/.env` based on `client/.env.example`:
```env
VITE_API_URL=/api
```

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/inventory-and-order.git
cd inventory-and-order
```

### Step 2: Database Initialization & Seeding
```bash
cd server
npm install
npm run db:setup
```

### Step 3: Start Server Backend
```bash
cd server
npm run dev
```
The Express backend server will listen on `http://localhost:5000/api`.

### Step 4: Start Frontend Client
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
The React frontend application will launch at `http://localhost:5173`.

---

## 🧪 Verification & Automated Testing Commands

Execute full automated verification suites:
```bash
cd server

# Schema & Constraint Verification (16 tests)
npm run db:verify

# Category & Product API Suite (26 tests)
npm run api:verify

# Inventory & Concurrency Protection Suite (25 tests)
npm run inventory:verify

# Order & Transaction Integrity Suite (21 tests)
npm run orders:verify

# Authentication & Role Security Suite (30 tests)
npm run auth:verify

# Currency Exchange Rates API Suite (2 tests)
npm run currency:verify
```

### Frontend Production Build Test
```bash
cd client
npm run build
```

---

## 🛡️ Production & Security Considerations
- **Environment Isolation**: `.env` files are ignored via `.gitignore` to prevent secret leaks.
- **Production Headers & CORS**: CORS is configured to accept requests from configured client origins.
- **Error Sanitization**: Server-side error handlers log detailed stack traces internally while returning clean JSON error objects to client applications.
- **SQL Parameterization**: 100% of database queries utilize parameterized SQL placeholders ($1, $2, etc.) to prevent SQL injection vulnerabilities.

---

## 🔮 Future Enhancements
- Implementation of Refresh Token rotation.
- Support for multi-warehouse inventory allocation.
- Automated email notification dispatch upon order status updates.
- PDF invoice generation for completed orders.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
