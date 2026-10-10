import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function main() {
  const legitProds = await pool.query(`
    SELECT p.id, p.name, p.category_id, c.name as category_name, p.price, i.quantity as stock
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN inventory i ON p.id = i.product_id
    WHERE p.name NOT ILIKE 'Verify%' 
      AND p.name NOT ILIKE 'Order Test%' 
      AND p.name NOT ILIKE 'Single Stock%' 
      AND p.name NOT ILIKE 'Test Product%'
      AND p.name NOT ILIKE 'Sports Gear%'
    ORDER BY p.id ASC
  `);
  console.log('--- LEGITIMATE STOREFRONT PRODUCTS (' + legitProds.rows.length + ') ---');
  console.table(legitProds.rows);

  const cats = await pool.query(`
    SELECT c.id, c.name, c.description,
           COUNT(p.id) FILTER (WHERE p.name NOT ILIKE 'Verify%' AND p.name NOT ILIKE 'Order Test%' AND p.name NOT ILIKE 'Single Stock%' AND p.name NOT ILIKE 'Test Product%' AND p.name NOT ILIKE 'Sports Gear%')::int AS product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    WHERE c.name NOT ILIKE 'Verify%' AND c.name NOT ILIKE 'Sports Gear%' AND c.name NOT ILIKE 'Test%'
    GROUP BY c.id, c.name, c.description
    ORDER BY c.id ASC
  `);
  console.log('--- LEGITIMATE CATEGORIES WITH PRODUCT COUNTS ---');
  console.table(cats.rows);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
