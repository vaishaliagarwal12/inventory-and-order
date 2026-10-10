import { pool } from '../config/db.js';

/**
 * Data Access Layer for Users.
 * Encapsulates parameterized database queries for user management.
 */
export const findById = async (id) => {
  const query = `
    SELECT id, name, email, role, created_at, updated_at
    FROM users
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

export const findByEmail = async (email) => {
  const query = `
    SELECT id, name, email, password_hash, role, created_at, updated_at
    FROM users
    WHERE LOWER(email) = LOWER($1)
  `;
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
};

export const create = async ({ name, email, password_hash, role = 'CUSTOMER' }) => {
  const query = `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at, updated_at
  `;
  const result = await pool.query(query, [name, email, password_hash, role]);
  return result.rows[0];
};

export const findAll = async () => {
  const query = `
    SELECT u.id, u.name, u.email, u.role, u.created_at, u.updated_at,
           COUNT(o.id)::int AS order_count
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const findCustomersAndCount = async ({ page = 1, limit = 10, search }) => {
  const offset = (page - 1) * limit;
  const whereClauses = ["u.role = 'CUSTOMER'"];
  const queryParams = [];

  if (search && search.trim() !== '') {
    queryParams.push(`%${search.trim()}%`);
    whereClauses.push(`(u.name ILIKE $${queryParams.length} OR u.email ILIKE $${queryParams.length})`);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM users u
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
      u.id,
      u.name,
      u.email,
      u.role,
      u.created_at,
      u.updated_at,
      COUNT(o.id)::int AS total_orders,
      COALESCE(SUM(CASE WHEN o.status != 'CANCELLED' THEN o.total_amount ELSE 0 END), 0)::numeric(10,2) AS total_spent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    ${whereSql}
    GROUP BY u.id
    ORDER BY u.id DESC
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  const dataResult = await pool.query(dataQuery, queryParams);

  return {
    rows: dataResult.rows,
    total,
  };
};


