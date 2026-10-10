-- =============================================================================
-- INVENTORY & ORDER MANAGEMENT SYSTEM - DATABASE SCHEMA (PHASE 2)
-- PostgreSQL DDL Script
-- =============================================================================

-- Drop existing tables if re-initializing schema (drop in reverse dependency order)
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- -----------------------------------------------------------------------------
-- 0. TRIGGER FUNCTION FOR AUTOMATIC UPDATED_AT TIMESTAMPS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Represents customers and administrative users.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('CUSTOMER', 'ADMIN')),
    CONSTRAINT chk_users_email_not_empty CHECK (length(trim(email)) > 0),
    CONSTRAINT chk_users_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- Represents product categories (e.g. Electronics, Clothing).
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT uq_categories_name UNIQUE (name),
    CONSTRAINT chk_categories_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- 3. PRODUCTS TABLE
-- Represents catalog items available for sale.
-- Note: Stock quantity is deliberately kept in the separate `inventory` table.
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys & Constraints
    CONSTRAINT fk_products_category FOREIGN KEY (category_id)
        REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT chk_products_price_non_negative CHECK (price >= 0),
    CONSTRAINT chk_products_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- 4. INVENTORY TABLE
-- Represents current stock for each product (V1 single warehouse model).
-- -----------------------------------------------------------------------------
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys & Constraints
    CONSTRAINT uq_inventory_product_id UNIQUE (product_id),
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_inventory_quantity_non_negative CHECK (quantity >= 0)
);

CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- 5. ORDERS TABLE
-- Represents customer orders.
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys & Constraints
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_orders_status CHECK (
        status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')
    ),
    CONSTRAINT chk_orders_total_amount_non_negative CHECK (total_amount >= 0)
);

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- 6. ORDER ITEMS TABLE
-- Resolves the Many-to-Many relationship between Orders and Products.
-- Also records historical price at time of purchase (`price_at_purchase`).
-- -----------------------------------------------------------------------------
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys & Constraints
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
        REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT chk_order_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_order_items_price_non_negative CHECK (price_at_purchase >= 0),
    CONSTRAINT uq_order_items_order_product UNIQUE (order_id, product_id)
);


-- -----------------------------------------------------------------------------
-- INDEXES
-- Optimized for frequent queries and foreign key lookups.
-- -----------------------------------------------------------------------------

-- Products
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);


-- -----------------------------------------------------------------------------
-- 7. INVENTORY MOVEMENTS TABLE (Stock Audit Ledger)
-- Tracks all stock adjustments, reservations, restorations, and restocks.
--
-- Foreign Key Policy:
-- - `product_id` uses ON DELETE SET NULL to preserve audit history if an un-ordered product is deleted.
-- - `order_id` uses ON DELETE SET NULL to preserve movement logs if an order is archived/deleted.
-- -----------------------------------------------------------------------------
CREATE TABLE inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INT NULL,
    order_id INT NULL,
    change_quantity INTEGER NOT NULL,
    resulting_quantity INTEGER NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys & Constraints
    CONSTRAINT fk_inventory_movements_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE SET NULL,
    CONSTRAINT fk_inventory_movements_order FOREIGN KEY (order_id)
        REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT chk_movement_type CHECK (
        movement_type IN ('INITIAL_STOCK', 'ORDER_RESERVATION', 'ORDER_CANCEL_RESTORE', 'ADMIN_ADJUSTMENT', 'RESTOCK')
    )
);

-- Inventory Movements Indexes
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_order_id ON inventory_movements(order_id);
CREATE INDEX idx_inventory_movements_movement_type ON inventory_movements(movement_type);

