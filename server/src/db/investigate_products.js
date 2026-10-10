import { pool } from '../config/db.js';

async function investigate() {
  console.log('=== 1. ALL PRODUCTS IN DATABASE ===');
  const prods = await pool.query(`
    SELECT p.id, p.name, p.price, p.is_active, p.category_id, c.name as category_name, COALESCE(i.quantity, 0) as stock_quantity
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN inventory i ON p.id = i.product_id
    ORDER BY p.id ASC
  `);

  console.log(`Total DB products: ${prods.rows.length}`);

  // Group by name pattern
  const grouped = {};
  prods.rows.forEach(p => {
    let key = p.name;
    if (p.name.startsWith('Single Stock Item')) key = 'Single Stock Item [Test Artifact]';
    else if (p.name.startsWith('Order Test Product')) key = 'Order Test Product [Test Artifact]';
    else if (p.name.startsWith('Verify Wireless Mouse')) key = 'Verify Wireless Mouse [Test Artifact]';
    
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  Object.keys(grouped).forEach(k => {
    const list = grouped[k];
    console.log(`\nProduct Pattern: "${k}" (Count: ${list.length})`);
    console.log(`Sample item: ID=${list[0].id}, Name="${list[0].name}", Price=${list[0].price}, Stock=${list[0].stock_quantity}, Category="${list[0].category_name}"`);
  });

  process.exit(0);
}

investigate();
