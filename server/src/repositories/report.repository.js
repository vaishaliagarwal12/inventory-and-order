import { pool } from '../config/db.js';

/**
 * Data Access Layer for Business Intelligence & Operational Reports.
 * Executes parameterized SQL aggregation queries across products, inventory, orders, and movements.
 */

export const getDashboardSummary = async () => {
  const query = `
    SELECT
      (SELECT COALESCE(SUM(total_amount), 0)::numeric(10,2) FROM orders WHERE status != 'CANCELLED') AS total_revenue,
      (SELECT COUNT(*)::int FROM orders) AS total_orders_count,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'PENDING') AS pending_orders_count,
      (SELECT COUNT(*)::int FROM products WHERE is_active = true) AS active_products_count,
      (SELECT COUNT(*)::int FROM inventory WHERE quantity <= 10) AS low_stock_count,
      (SELECT COUNT(*)::int FROM users WHERE role = 'CUSTOMER') AS total_customers_count
  `;
  const result = await pool.query(query);
  return result.rows[0];
};

export const getSalesByStatus = async () => {
  const query = `
    SELECT
      status,
      COUNT(*)::int AS order_count,
      COALESCE(SUM(total_amount), 0)::numeric(10,2) AS total_amount
    FROM orders
    GROUP BY status
    ORDER BY status ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const getTopSellingProducts = async (limit = 5) => {
  const query = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      c.name AS category_name,
      COALESCE(SUM(oi.quantity), 0)::int AS total_units_sold,
      COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0)::numeric(10,2) AS total_revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'CANCELLED'
    GROUP BY p.id, p.name, c.name
    ORDER BY total_units_sold DESC, total_revenue DESC
    LIMIT $1
  `;
  const result = await pool.query(query, [limit]);
  return result.rows;
};

export const getLowStockAlerts = async (threshold = 10) => {
  const query = `
    SELECT
      i.id AS inventory_id,
      i.product_id,
      p.name AS product_name,
      c.name AS category_name,
      p.price AS product_price,
      i.quantity AS current_stock,
      CASE
        WHEN i.quantity = 0 THEN 'OUT_OF_STOCK'
        ELSE 'LOW_STOCK'
      END AS status_code
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE i.quantity <= $1 AND p.is_active = true
    ORDER BY i.quantity ASC, p.name ASC
  `;
  const result = await pool.query(query, [threshold]);
  return result.rows;
};
