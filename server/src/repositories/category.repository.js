import { pool } from '../config/db.js';

/**
 * Data Access Layer for Categories.
 * Executes parameterized SQL queries using the PostgreSQL pool.
 */
export const findAll = async () => {
  const query = `
    SELECT
      c.id,
      c.name,
      c.description,
      c.created_at,
      c.updated_at,
      COUNT(p.id) FILTER (WHERE p.name NOT ILIKE 'Verify%' AND p.name NOT ILIKE 'Order Test%' AND p.name NOT ILIKE 'Single Stock%' AND p.name NOT ILIKE 'Test Product%' AND p.name NOT ILIKE 'Sports Gear%')::int AS product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    GROUP BY c.id
    ORDER BY c.id ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const findById = async (id) => {
  const query = `
    SELECT id, name, description, created_at, updated_at
    FROM categories
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

export const findByName = async (name) => {
  const query = `
    SELECT id, name, description, created_at, updated_at
    FROM categories
    WHERE LOWER(name) = LOWER($1)
  `;
  const result = await pool.query(query, [name]);
  return result.rows[0] || null;
};

export const findByNameExcludingId = async (name, excludeId) => {
  const query = `
    SELECT id, name, description, created_at, updated_at
    FROM categories
    WHERE LOWER(name) = LOWER($1) AND id <> $2
  `;
  const result = await pool.query(query, [name, excludeId]);
  return result.rows[0] || null;
};

export const create = async ({ name, description }) => {
  const query = `
    INSERT INTO categories (name, description)
    VALUES ($1, $2)
    RETURNING id, name, description, created_at, updated_at
  `;
  const result = await pool.query(query, [name, description || null]);
  return result.rows[0];
};

export const update = async (id, { name, description }) => {
  const query = `
    UPDATE categories
    SET name = $1, description = $2
    WHERE id = $3
    RETURNING id, name, description, created_at, updated_at
  `;
  const result = await pool.query(query, [name, description || null, id]);
  return result.rows[0] || null;
};

export const deleteById = async (id) => {
  const query = `
    DELETE FROM categories
    WHERE id = $1
    RETURNING id
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};
