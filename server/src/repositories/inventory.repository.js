import { pool } from '../config/db.js';

/**
 * Data Access Layer for Inventory.
 * Executes parameterized SQL queries with joins and atomic concurrency protection.
 */
export const findAndCountAll = async ({
  page = 1,
  limit = 10,
  search,
  stock_status,
  low_stock_threshold = 10,
}) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const queryParams = [];

  // Filter by product name search
  if (search && search.trim() !== '') {
    queryParams.push(`%${search.trim()}%`);
    whereClauses.push(`p.name ILIKE $${queryParams.length}`);
  }

  // Filter by stock status
  if (stock_status) {
    if (stock_status === 'out_of_stock') {
      whereClauses.push(`i.quantity = 0`);
    } else if (stock_status === 'low_stock') {
      queryParams.push(low_stock_threshold);
      whereClauses.push(`i.quantity > 0 AND i.quantity <= $${queryParams.length}`);
    } else if (stock_status === 'in_stock') {
      queryParams.push(low_stock_threshold);
      whereClauses.push(`i.quantity > $${queryParams.length}`);
    }
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // 1. Get total count
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    ${whereSql}
  `;
  const countResult = await pool.query(countQuery, queryParams);
  const total = countResult.rows[0]?.total || 0;

  // 2. Get paginated inventory joined with product & category info
  queryParams.push(limit);
  const limitParamIndex = queryParams.length;
  queryParams.push(offset);
  const offsetParamIndex = queryParams.length;

  const dataQuery = `
    SELECT
      i.id,
      i.product_id,
      p.name AS product_name,
      p.description AS product_description,
      p.price AS product_price,
      p.category_id,
      c.name AS category_name,
      p.is_active,
      i.quantity,
      i.created_at,
      i.updated_at
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    ${whereSql}
    ORDER BY i.id ASC
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  const dataResult = await pool.query(dataQuery, queryParams);

  return {
    rows: dataResult.rows,
    total,
  };
};

export const findById = async (id) => {
  const query = `
    SELECT
      i.id,
      i.product_id,
      p.name AS product_name,
      p.description AS product_description,
      p.price AS product_price,
      p.category_id,
      c.name AS category_name,
      p.is_active,
      i.quantity,
      i.created_at,
      i.updated_at
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE i.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

export const findByProductId = async (productId) => {
  const query = `
    SELECT
      i.id,
      i.product_id,
      p.name AS product_name,
      p.description AS product_description,
      p.price AS product_price,
      p.category_id,
      c.name AS category_name,
      p.is_active,
      i.quantity,
      i.created_at,
      i.updated_at
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE i.product_id = $1
  `;
  const result = await pool.query(query, [productId]);
  return result.rows[0] || null;
};

export const create = async ({ product_id, quantity }) => {
  const query = `
    INSERT INTO inventory (product_id, quantity)
    VALUES ($1, $2)
    RETURNING id, product_id, quantity, created_at, updated_at
  `;
  const result = await pool.query(query, [product_id, quantity]);
  return result.rows[0];
};

export const createInClient = async (client, { product_id, quantity }) => {
  const query = `
    INSERT INTO inventory (product_id, quantity)
    VALUES ($1, $2)
    RETURNING id, product_id, quantity, created_at, updated_at
  `;
  const result = await client.query(query, [product_id, quantity]);
  return result.rows[0];
};

export const updateQuantityByProductId = async (productId, quantity) => {
  const query = `
    UPDATE inventory
    SET quantity = $1
    WHERE product_id = $2
    RETURNING id, product_id, quantity, created_at, updated_at
  `;
  const result = await pool.query(query, [quantity, productId]);
  return result.rows[0] || null;
};

export const updateQuantityInClient = async (client, productId, quantity) => {
  const query = `
    UPDATE inventory
    SET quantity = $1
    WHERE product_id = $2
    RETURNING id, product_id, quantity, created_at, updated_at
  `;
  const result = await client.query(query, [quantity, productId]);
  return result.rows[0] || null;
};

/**
 * Performs an ATOMIC stock adjustment query.
 * The condition `WHERE (quantity + $1) >= 0` guarantees at the database level that
 * concurrent stock adjustments can never drive quantity below 0.
 */
export const adjustQuantityAtomic = async (productId, change) => {
  const query = `
    UPDATE inventory
    SET quantity = quantity + $1
    WHERE product_id = $2 AND (quantity + $1) >= 0
    RETURNING id, product_id, quantity, created_at, updated_at
  `;
  const result = await pool.query(query, [change, productId]);
  return result.rows[0] || null;
};

export const adjustQuantityInClient = async (client, productId, change) => {
  const query = `
    UPDATE inventory
    SET quantity = quantity + $1
    WHERE product_id = $2 AND (quantity + $1) >= 0
    RETURNING id, product_id, quantity, created_at, updated_at
  `;
  const result = await client.query(query, [change, productId]);
  return result.rows[0] || null;
};

// -----------------------------------------------------------------------------
// INVENTORY MOVEMENTS (AUDIT LEDGER REPOSITORY METHODS)
// -----------------------------------------------------------------------------

export const createMovementInClient = async (
  client,
  { product_id, order_id = null, change_quantity, resulting_quantity, movement_type, notes = null }
) => {
  const query = `
    INSERT INTO inventory_movements (product_id, order_id, change_quantity, resulting_quantity, movement_type, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, product_id, order_id, change_quantity, resulting_quantity, movement_type, notes, created_at
  `;
  const result = await client.query(query, [
    product_id,
    order_id,
    change_quantity,
    resulting_quantity,
    movement_type,
    notes,
  ]);
  return result.rows[0];
};

export const createMovement = async ({
  product_id,
  order_id = null,
  change_quantity,
  resulting_quantity,
  movement_type,
  notes = null,
}) => {
  const query = `
    INSERT INTO inventory_movements (product_id, order_id, change_quantity, resulting_quantity, movement_type, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, product_id, order_id, change_quantity, resulting_quantity, movement_type, notes, created_at
  `;
  const result = await pool.query(query, [
    product_id,
    order_id,
    change_quantity,
    resulting_quantity,
    movement_type,
    notes,
  ]);
  return result.rows[0];
};

export const findMovementsAndCount = async ({ page = 1, limit = 10, product_id, movement_type }) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const queryParams = [];

  if (product_id !== undefined && product_id !== null && product_id !== '') {
    queryParams.push(product_id);
    whereClauses.push(`im.product_id = $${queryParams.length}`);
  }

  if (movement_type !== undefined && movement_type !== null && movement_type !== '') {
    queryParams.push(movement_type);
    whereClauses.push(`im.movement_type = $${queryParams.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM inventory_movements im
    ${whereSql}
  `;
  const countResult = await pool.query(countQuery, queryParams);
  const total = countResult.rows[0]?.total || 0;

  queryParams.push(limit);
  const limitParamIndex = queryParams.length;
  queryParams.push(offset);
  const offsetParamIndex = queryParams.length;

  const dataQuery = `
    SELECT
      im.id,
      im.product_id,
      p.name AS product_name,
      im.order_id,
      im.change_quantity,
      im.resulting_quantity,
      im.movement_type,
      im.notes,
      im.created_at
    FROM inventory_movements im
    LEFT JOIN products p ON im.product_id = p.id
    ${whereSql}
    ORDER BY im.id DESC
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  const dataResult = await pool.query(dataQuery, queryParams);

  return {
    rows: dataResult.rows,
    total,
  };
};

