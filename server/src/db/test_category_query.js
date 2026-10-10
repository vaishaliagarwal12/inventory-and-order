import { pool } from '../config/db.js';
import { getProducts } from '../services/product.service.js';

async function testAllCategories() {
  console.log('=== 1. FETCH ALL LEGITIMATE CATEGORIES ===');
  const catRes = await pool.query(`
    SELECT c.id, c.name, c.description, COUNT(p.id)::int as db_product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    WHERE c.name NOT LIKE 'Verify%' AND c.name NOT LIKE 'Sports Gear%'
    GROUP BY c.id, c.name, c.description
    ORDER BY c.id ASC
  `);

  console.log(`Found ${catRes.rows.length} legitimate categories in DB:`);
  console.table(catRes.rows);

  console.log('\n=== 2. QUERY GET PRODUCTS FOR EACH CATEGORY VIA SERVICE LAYER ===');
  for (const cat of catRes.rows) {
    const serviceRes = await getProducts({
      category_id: String(cat.id),
      exclude_test: 'true'
    });

    console.log(`\n----------------------------------------------------`);
    console.log(`Category ID ${cat.id}: "${cat.name}"`);
    console.log(`DB Count: ${cat.db_product_count} | Service Total Returned: ${serviceRes.pagination.total} | Service Data Rows: ${serviceRes.data.length}`);
    if (serviceRes.data.length > 0) {
      serviceRes.data.forEach(p => {
        console.log(`  -> Product ID=${p.id}, Name="${p.name}", Price=$${p.price}, Active=${p.is_active}, CategoryID=${p.category_id}`);
      });
    } else {
      console.log(`  -> [NO PRODUCTS RETURNED FOR THIS CATEGORY]`);
    }
  }

  process.exit(0);
}

testAllCategories();
