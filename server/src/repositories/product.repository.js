import { pool } from '../config/db.js';

/**
 * Data Access Layer for Products.
 * Handles parameterized SQL queries for filtering, pagination, search, CRUD, and status updates.
 */
export const findAndCountAll = async ({ page = 1, limit = 10, search, category_id, is_active, exclude_test }) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const queryParams = [];

  // Filter by search string (product name or description)
  if (search && search.trim() !== '') {
    queryParams.push(`%${search.trim()}%`);
    whereClauses.push(`(p.name ILIKE $${queryParams.length} OR p.description ILIKE $${queryParams.length})`);
  }

  // Filter by category_id
  if (category_id !== undefined && category_id !== null && category_id !== '') {
    queryParams.push(category_id);
    whereClauses.push(`p.category_id = $${queryParams.length}`);
  }

  // Filter by is_active status
  if (is_active !== undefined && is_active !== null && is_active !== '') {
    queryParams.push(is_active);
    whereClauses.push(`p.is_active = $${queryParams.length}`);
  }

  // Filter out test script artifacts if exclude_test is true
  if (exclude_test) {
    whereClauses.push(`p.name NOT ILIKE 'Verify%' AND p.name NOT ILIKE 'Order Test%' AND p.name NOT ILIKE 'Single Stock%' AND p.name NOT ILIKE 'Test Product%' AND p.name NOT ILIKE 'Sports Gear%'`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // 1. Get total matching count
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM products p
    ${whereSql}
  `;
  const countResult = await pool.query(countQuery, queryParams);
  const total = countResult.rows[0]?.total || 0;

  // 2. Fetch paginated product rows with category details
  queryParams.push(limit);
  const limitParamIndex = queryParams.length;
  queryParams.push(offset);
  const offsetParamIndex = queryParams.length;

  const dataQuery = `
    SELECT
      p.id,
      p.category_id,
      c.name AS category_name,
      p.name,
      p.description,
      p.price,
      p.is_active,
      p.created_at,
      p.updated_at
    FROM products p
    JOIN categories c ON p.category_id = c.id
    ${whereSql}
    ORDER BY p.id ASC
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
      p.id,
      p.category_id,
      c.name AS category_name,
      p.name,
      p.description,
      p.price,
      p.is_active,
      p.created_at,
      p.updated_at
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

export const create = async ({ category_id, name, description, price, is_active = true }) => {
  const query = `
    INSERT INTO products (category_id, name, description, price, is_active)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, category_id, name, description, price, is_active, created_at, updated_at
  `;
  const result = await pool.query(query, [
    category_id,
    name,
    description || null,
    price,
    is_active,
  ]);
  return result.rows[0];
};

export const update = async (id, { category_id, name, description, price }) => {
  const query = `
    UPDATE products
    SET category_id = $1, name = $2, description = $3, price = $4
    WHERE id = $5
    RETURNING id, category_id, name, description, price, is_active, created_at, updated_at
  `;
  const result = await pool.query(query, [category_id, name, description || null, price, id]);
  return result.rows[0] || null;
};

export const updateStatus = async (id, is_active) => {
  const query = `
    UPDATE products
    SET is_active = $1
    WHERE id = $2
    RETURNING id, category_id, name, description, price, is_active, created_at, updated_at
  `;
  const result = await pool.query(query, [is_active, id]);
  return result.rows[0] || null;
};

export const deleteById = async (id) => {
  const query = `
    DELETE FROM products
    WHERE id = $1
    RETURNING id
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};
