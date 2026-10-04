import { pool } from '../config/db.js';

/**
 * Data Access Layer for Orders and Order Items.
 * Supports transactional operations using dedicated PostgreSQL clients and row locking.
 */

// -----------------------------------------------------------------------------
// TRANSACTIONAL OPERATIONS (Using dedicated client)
// -----------------------------------------------------------------------------

export const createOrderInClient = async (client, { user_id, status = 'PENDING', total_amount = 0.00 }) => {
  const query = `
    INSERT INTO orders (user_id, status, total_amount)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, status, total_amount, created_at, updated_at
  `;
  const result = await client.query(query, [user_id, status, total_amount]);
  return result.rows[0];
};

export const createOrderItemInClient = async (
  client,
  { order_id, product_id, quantity, price_at_purchase }
) => {
  const query = `
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES ($1, $2, $3, $4)
    RETURNING id, order_id, product_id, quantity, price_at_purchase, created_at
  `;
  const result = await client.query(query, [order_id, product_id, quantity, price_at_purchase]);
  return result.rows[0];
};

export const calculateAndSetOrderTotalInClient = async (client, orderId) => {
  const query = `
    UPDATE orders
    SET total_amount = (
      SELECT COALESCE(SUM(quantity * price_at_purchase), 0)
      FROM order_items
      WHERE order_id = $1
    )
    WHERE id = $1
    RETURNING id, user_id, status, total_amount, created_at, updated_at
  `;
  const result = await client.query(query, [orderId]);
  return result.rows[0];
};

export const lockInventoryRowsForProductsInClient = async (client, sortedProductIds) => {
  const query = `
    SELECT
      i.id AS inventory_id,
      i.product_id,
      i.quantity AS current_stock,
      p.name AS product_name,
      p.price AS current_price,
      p.is_active
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE i.product_id = ANY($1::int[])
    ORDER BY i.product_id ASC
    FOR UPDATE OF i
  `;
  const result = await client.query(query, [sortedProductIds]);
  return result.rows;
};

export const reduceInventoryQuantityInClient = async (client, { product_id, quantity }) => {
  const query = `
    UPDATE inventory
    SET quantity = quantity - $1
    WHERE product_id = $2 AND quantity >= $1
    RETURNING id, product_id, quantity
  `;
  const result = await client.query(query, [quantity, product_id]);
  return result.rows[0] || null;
};

export const restoreInventoryQuantityInClient = async (client, { product_id, quantity }) => {
  const query = `
    UPDATE inventory
    SET quantity = quantity + $1
    WHERE product_id = $2
    RETURNING id, product_id, quantity
  `;
  const result = await client.query(query, [quantity, product_id]);
  return result.rows[0] || null;
};

export const lockOrderForUpdateInClient = async (client, orderId) => {
  const query = `
    SELECT id, user_id, status, total_amount, created_at, updated_at
    FROM orders
    WHERE id = $1
    FOR UPDATE
  `;
  const result = await client.query(query, [orderId]);
  return result.rows[0] || null;
};

export const updateOrderStatusInClient = async (client, orderId, status) => {
  const query = `
    UPDATE orders
    SET status = $1
    WHERE id = $2
    RETURNING id, user_id, status, total_amount, created_at, updated_at
  `;
  const result = await client.query(query, [status, orderId]);
  return result.rows[0] || null;
};

export const findOrderItemsByOrderIdInClient = async (client, orderId) => {
  const query = `
    SELECT
      oi.id,
      oi.order_id,
      oi.product_id,
      p.name AS product_name,
      oi.quantity,
      oi.price_at_purchase,
      (oi.quantity * oi.price_at_purchase)::numeric(10,2) AS subtotal,
      oi.created_at
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = $1
    ORDER BY oi.id ASC
  `;
  const result = await client.query(query, [orderId]);
  return result.rows;
};


// -----------------------------------------------------------------------------
// STANDARD READ / NON-TRANSACTIONAL OPERATIONS (Using Connection Pool)
// -----------------------------------------------------------------------------

export const findById = async (id) => {
  const query = `
    SELECT
      o.id,
      o.user_id,
      u.name AS user_name,
      u.email AS user_email,
      o.status,
      o.total_amount,
      o.created_at,
      o.updated_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

export const findOrderItemsByOrderId = async (orderId) => {
  const query = `
    SELECT
      oi.id,
      oi.order_id,
      oi.product_id,
      p.name AS product_name,
      oi.quantity,
      oi.price_at_purchase,
      (oi.quantity * oi.price_at_purchase)::numeric(10,2) AS subtotal,
      oi.created_at
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = $1
    ORDER BY oi.id ASC
  `;
  const result = await pool.query(query, [orderId]);
  return result.rows;
};

export const findAndCountAll = async ({ page = 1, limit = 10, user_id, status }) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const queryParams = [];

  if (user_id !== undefined && user_id !== null && user_id !== '') {
    queryParams.push(user_id);
    whereClauses.push(`o.user_id = $${queryParams.length}`);
  }

  if (status !== undefined && status !== null && status !== '') {
    queryParams.push(status);
    whereClauses.push(`o.status = $${queryParams.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching orders
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM orders o
    ${whereSql}
  `;
  const countResult = await pool.query(countQuery, queryParams);
  const total = countResult.rows[0]?.total || 0;

  // Fetch paginated order records
  queryParams.push(limit);
  const limitParamIndex = queryParams.length;
  queryParams.push(offset);
  const offsetParamIndex = queryParams.length;

  const dataQuery = `
    SELECT
      o.id,
      o.user_id,
      u.name AS user_name,
      u.email AS user_email,
      o.status,
      o.total_amount,
      o.created_at,
      o.updated_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ${whereSql}
    ORDER BY o.id DESC
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  const dataResult = await pool.query(dataQuery, queryParams);

  return {
    rows: dataResult.rows,
    total,
  };
};

export const updateOrderStatus = async (id, status) => {
  const query = `
    UPDATE orders
    SET status = $1
    WHERE id = $2
    RETURNING id, user_id, status, total_amount, created_at, updated_at
  `;
  const result = await pool.query(query, [status, id]);
  return result.rows[0] || null;
};
