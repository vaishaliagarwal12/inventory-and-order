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
  // 1. Check if Footwear category exists
  let catRes = await pool.query("SELECT id FROM categories WHERE name = 'Footwear'");
  let footwearId;
  if (catRes.rows.length === 0) {
    const insertRes = await pool.query(
      "INSERT INTO categories (name, description) VALUES ('Footwear', 'Athletic shoes, casual sneakers, boots, and footwear essentials') RETURNING id"
    );
    footwearId = insertRes.rows[0].id;
    console.log('Created Footwear category with ID:', footwearId);
  } else {
    footwearId = catRes.rows[0].id;
    console.log('Found existing Footwear category ID:', footwearId);
  }

  // 2. Update Running Performance Sneakers (id: 5) to Footwear
  const updateRes = await pool.query(
    'UPDATE products SET category_id = $1 WHERE id = 5 RETURNING id, name, category_id',
    [footwearId]
  );
  console.log('Updated Running Performance Sneakers:', updateRes.rows[0]);

  // 3. Verify all 9 legitimate products and their categories
  const legitProds = await pool.query(`
    SELECT p.id, p.name, p.category_id, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.id <= 9
    ORDER BY p.id ASC
  `);
  console.log('--- Verified 9 Storefront Products ---');
  console.table(legitProds.rows);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
