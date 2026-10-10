-- =============================================================================
-- INVENTORY & ORDER MANAGEMENT SYSTEM - SEED DATA (PHASE 2 & 6)
-- Development Seed Data Script
-- =============================================================================

-- Clear existing data (in reverse dependency order)
TRUNCATE TABLE order_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;
TRUNCATE TABLE inventory RESTART IDENTITY CASCADE;
TRUNCATE TABLE products RESTART IDENTITY CASCADE;
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- -----------------------------------------------------------------------------
-- 1. SEED USERS
-- Pre-hashed password for dev login: 'Password123'
-- -----------------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role) VALUES
('System Administrator', 'admin@inventory.com', '$2b$10$my3nnJD0z8xpTDiCG1c4SejOzoBqDZTy0dS8SrHRbRphL4MkpHvMG', 'ADMIN'),
('Alice Smith', 'alice@example.com', '$2b$10$my3nnJD0z8xpTDiCG1c4SejOzoBqDZTy0dS8SrHRbRphL4MkpHvMG', 'CUSTOMER'),
('Bob Johnson', 'bob@example.com', '$2b$10$my3nnJD0z8xpTDiCG1c4SejOzoBqDZTy0dS8SrHRbRphL4MkpHvMG', 'CUSTOMER');

-- -----------------------------------------------------------------------------
-- 2. SEED CATEGORIES
-- -----------------------------------------------------------------------------
INSERT INTO categories (name, description) VALUES
('Electronics', 'Gadgets, devices, hardware, and electronic accessories'),
('Clothing', 'Apparel, garments, and fashion accessories'),
('Footwear', 'Athletic shoes, casual sneakers, boots, and footwear essentials'),
('Books', 'Physical books, novels, textbooks, and literature'),
('Home & Kitchen', 'Home appliances, cookware, and living essentials'),
('Furniture & Home Office', 'Desks, ergonomic chairs, office storage, and home furniture'),
('Sports & Fitness', 'Exercise equipment, athletic gear, outdoor activewear, and sports accessories'),
('Beauty & Personal Care', 'Skincare, grooming tools, wellness products, and personal hygiene essentials'),
('Bags & Travel', 'Backpacks, luggage, travel accessories, wallets, and carrier bags');

-- -----------------------------------------------------------------------------
-- 3. SEED PRODUCTS
-- -----------------------------------------------------------------------------
INSERT INTO products (category_id, name, description, price, is_active) VALUES
(1, 'Wireless Noise-Canceling Headphones', 'Premium over-ear headphones with active noise cancellation', 299.99, true),
(1, 'Ergonomic Mechanical Keyboard', 'RGB backlight tactile mechanical switch keyboard', 129.50, true),
(1, 'Ultra HD 4K Monitor 27"', 'IPS display monitor with HDR support and slim bezel', 349.00, true),
(2, 'Classic Denim Jacket', '100% cotton casual fit denim jacket', 79.99, true),
(3, 'Running Performance Sneakers', 'Lightweight breathable mesh athletic shoes', 110.00, true),
(4, 'Designing Data-Intensive Applications', 'Comprehensive guide to modern system architecture and distributed data', 45.00, true),
(4, 'Clean Architecture', 'A craftsman guide to software structure and design by Robert C. Martin', 38.50, true),
(5, 'Stainless Steel Espresso Machine', '15-bar pump espresso maker with steam wand', 199.99, true),
(5, 'Non-Stick Cast Iron Skillet', 'Pre-seasoned heavy-duty 10-inch skillet', 49.99, true);

-- -----------------------------------------------------------------------------
-- 4. SEED INVENTORY
-- Initial stock levels for each product
-- -----------------------------------------------------------------------------
INSERT INTO inventory (product_id, quantity) VALUES
(1, 50),   -- Wireless Headphones
(2, 35),   -- Ergonomic Keyboard
(3, 20),   -- 4K Monitor
(4, 100),  -- Denim Jacket
(5, 75),   -- Running Sneakers
(6, 60),   -- Designing Data-Intensive Applications
(7, 40),   -- Clean Architecture
(8, 15),   -- Espresso Machine
(9, 80);   -- Cast Iron Skillet
