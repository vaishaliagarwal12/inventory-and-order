import { pool } from '../config/db.js';

export const cleanupTestData = async () => {
  try {
    console.log('--- Cleaning up Test Fixtures in Database ---');

    // 1. Mark test fixture products as inactive so they are hidden from storefront
    const prodUpdate = await pool.query(`
      UPDATE products
      SET is_active = FALSE
      WHERE name ILIKE 'Verify%'
         OR name ILIKE 'Order Test%'
         OR name ILIKE 'Single Stock%'
         OR name ILIKE 'Test Product%'
         OR name ILIKE 'Sports Gear%';
    `);
    console.log(`Deactivated test products: ${prodUpdate.rowCount}`);

    // 2. Ensure all legitimate catalog products are active
    const catalogUpdate = await pool.query(`
      UPDATE products
      SET is_active = TRUE
      WHERE category_id IN (
        SELECT id FROM categories
        WHERE name IN (
          'Electronics', 'Clothing', 'Footwear', 'Books', 'Home & Kitchen',
          'Furniture & Home Office', 'Sports & Fitness', 'Beauty & Personal Care', 'Bags & Travel'
        )
      )
      AND name NOT ILIKE 'Verify%'
      AND name NOT ILIKE 'Order Test%'
      AND name NOT ILIKE 'Single Stock%'
      AND name NOT ILIKE 'Test Product%'
      AND name NOT ILIKE 'Sports Gear%';
    `);
    console.log(`Activated catalog products: ${catalogUpdate.rowCount}`);

    // 3. Delete empty test categories that have no products pointing to them
    const catDelete = await pool.query(`
      DELETE FROM categories
      WHERE (
        name ILIKE 'Verify%'
        OR name ILIKE 'Sports Gear%'
        OR name ILIKE 'Sports & Outdoors%'
        OR name ILIKE 'Test%'
      )
      AND id NOT IN (SELECT DISTINCT category_id FROM products);
    `);
    console.log(`Deleted orphaned test categories: ${catDelete.rowCount}`);

    // 4. Verification counts
    const activeProds = await pool.query(`SELECT count(id)::int as count FROM products WHERE is_active = TRUE;`);
    console.log(`Current Active Products: ${activeProds.rows[0].count}`);

    return {
      deactivatedProducts: prodUpdate.rowCount,
      activatedCatalog: catalogUpdate.rowCount,
      deletedCategories: catDelete.rowCount,
      activeProducts: activeProds.rows[0].count,
    };
  } catch (error) {
    console.error('Error during test data cleanup:', error);
    throw error;
  }
};

// Direct script execution
if (process.argv[1]?.endsWith('cleanup_test_data.js')) {
  cleanupTestData()
    .then(() => {
      console.log('✅ Test data cleanup complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Cleanup failed:', err);
      process.exit(1);
    });
}
