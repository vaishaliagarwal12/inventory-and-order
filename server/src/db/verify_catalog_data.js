import { pool } from '../config/db.js';

async function verifyCatalog() {
  console.log('====================================================');
  console.log('🔍 PHASE 3B DATABASE CATALOG VERIFICATION');
  console.log('====================================================\n');

  try {
    // 1. Total legitimate product count & count per category
    console.log('--- 1. Product Counts per Legitimate Category ---');
    const q1 = `
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        COUNT(p.id)::int AS product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
        AND p.name NOT ILIKE 'Verify%'
        AND p.name NOT ILIKE 'Order Test%'
        AND p.name NOT ILIKE 'Single Stock%'
        AND p.name NOT ILIKE 'Test%'
        AND p.name NOT ILIKE 'Sports Gear%'
        AND p.name NOT SIMILAR TO '%[0-9]{5,}%'
      WHERE c.name NOT ILIKE 'Verify%'
        AND c.name NOT ILIKE 'Sports Gear%'
        AND c.name NOT ILIKE 'Order Test%'
        AND c.name NOT SIMILAR TO '%[0-9]{5,}%'
      GROUP BY c.id, c.name
      ORDER BY c.id ASC;
    `;
    const res1 = await pool.query(q1);
    console.table(res1.rows);

    const totalLegitProducts = res1.rows.reduce((sum, r) => sum + r.product_count, 0);
    console.log(`Total Legitimate Products in Catalog: ${totalLegitProducts}\n`);

    // 2. Categories with zero products
    console.log('--- 2. Categories with No Products ---');
    const q2 = `
      SELECT
        c.id,
        c.name
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
        AND p.name NOT ILIKE 'Verify%'
        AND p.name NOT ILIKE 'Order Test%'
        AND p.name NOT ILIKE 'Single Stock%'
        AND p.name NOT ILIKE 'Test%'
        AND p.name NOT ILIKE 'Sports Gear%'
        AND p.name NOT SIMILAR TO '%[0-9]{5,}%'
      WHERE c.name NOT ILIKE 'Verify%'
        AND c.name NOT ILIKE 'Sports Gear%'
        AND c.name NOT ILIKE 'Order Test%'
        AND c.name NOT SIMILAR TO '%[0-9]{5,}%'
      GROUP BY c.id, c.name
      HAVING COUNT(p.id) = 0;
    `;
    const res2 = await pool.query(q2);
    if (res2.rows.length === 0) {
      console.log('✅ None. All 9 categories have real catalog products.\n');
    } else {
      console.table(res2.rows);
    }

    // 3. Products with missing or invalid category assignments
    console.log('--- 3. Products with Missing or Invalid Category Assignments ---');
    const q3 = `
      SELECT p.id, p.name, p.category_id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE c.id IS NULL OR p.category_id IS NULL;
    `;
    const res3 = await pool.query(q3);
    if (res3.rows.length === 0) {
      console.log('✅ None. All products have valid foreign key category assignments.\n');
    } else {
      console.table(res3.rows);
    }

    // 4. Products without inventory records
    console.log('--- 4. Catalog Products Without Inventory Records ---');
    const q4 = `
      SELECT p.id, p.name, p.category_id
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE i.id IS NULL
        AND p.name NOT ILIKE 'Verify%'
        AND p.name NOT ILIKE 'Order Test%'
        AND p.name NOT ILIKE 'Single Stock%'
        AND p.name NOT ILIKE 'Test%'
        AND p.name NOT ILIKE 'Sports Gear%'
        AND p.name NOT SIMILAR TO '%[0-9]{5,}%';
    `;
    const res4 = await pool.query(q4);
    if (res4.rows.length === 0) {
      console.log('✅ None. All catalog products have active inventory records.\n');
    } else {
      console.table(res4.rows);
    }

    // 5. Duplicate product names in catalog
    console.log('--- 5. Duplicate Product Names in Catalog ---');
    const q5 = `
      SELECT LOWER(name) AS normalized_name, COUNT(*)::int AS count
      FROM products
      WHERE name NOT ILIKE 'Verify%'
        AND name NOT ILIKE 'Order Test%'
        AND name NOT ILIKE 'Single Stock%'
        AND name NOT ILIKE 'Test%'
        AND name NOT ILIKE 'Sports Gear%'
        AND name NOT SIMILAR TO '%[0-9]{5,}%'
      GROUP BY LOWER(name)
      HAVING COUNT(*) > 1;
    `;
    const res5 = await pool.query(q5);
    if (res5.rows.length === 0) {
      console.log('✅ None. Zero duplicate product names found.\n');
    } else {
      console.table(res5.rows);
    }

    // 6. Invalid prices (< 0) or negative stock (< 0)
    console.log('--- 6. Invalid Prices (< 0) or Negative Stock (< 0) ---');
    const q6 = `
      SELECT p.id, p.name, p.price, i.quantity
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      WHERE p.price < 0 OR i.quantity < 0;
    `;
    const res6 = await pool.query(q6);
    if (res6.rows.length === 0) {
      console.log('✅ None. All products have non-negative prices and non-negative stock.\n');
    } else {
      console.table(res6.rows);
    }

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await pool.end();
  }
}

verifyCatalog();
