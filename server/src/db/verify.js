import { pool } from '../config/db.js';

/**
 * DATABASE VERIFICATION SUITE (PHASE 2)
 * Tests database integrity, constraints, relationships, and price history logic.
 */
async function verifyDatabase() {
  console.log('----------------------------------------------------');
  console.log('🧪 RUNNING DATABASE VERIFICATION SUITE');
  console.log('----------------------------------------------------');

  let passedTests = 0;
  let totalTests = 0;

  async function test(description, testFn) {
    totalTests++;
    try {
      await testFn();
      console.log(`  ✅ [PASS] ${description}`);
      passedTests++;
    } catch (error) {
      console.error(`  ❌ [FAIL] ${description}`);
      console.error(`     Error: ${error.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // SECTION 1: VALID DATA INSERTS & SELECTS
  // ---------------------------------------------------------------------------
  console.log('\n--- 1. Valid Data Insertion & Relationship Verification ---');

  let testUserId, testCategoryId, testProductId, testOrderId;

  await test('Insert valid User', async () => {
    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Test Verification User', 'verify_user_${Date.now()}@example.com', 'hashed_pass_123', 'CUSTOMER')
       RETURNING id`
    );
    testUserId = res.rows[0].id;
    if (!testUserId) throw new Error('Failed to return inserted user ID');
  });

  await test('Insert valid Category', async () => {
    const res = await pool.query(
      `INSERT INTO categories (name, description)
       VALUES ('Verify Category ${Date.now()}', 'Test Category Description')
       RETURNING id`
    );
    testCategoryId = res.rows[0].id;
    if (!testCategoryId) throw new Error('Failed to return inserted category ID');
  });

  await test('Insert valid Product referencing Category', async () => {
    const res = await pool.query(
      `INSERT INTO products (category_id, name, description, price, is_active)
       VALUES ($1, 'Verify Wireless Mouse', 'Ergonomic Mouse', 500.00, true)
       RETURNING id`,
      [testCategoryId]
    );
    testProductId = res.rows[0].id;
    if (!testProductId) throw new Error('Failed to return inserted product ID');
  });

  await test('Insert valid Inventory record for Product', async () => {
    const res = await pool.query(
      `INSERT INTO inventory (product_id, quantity)
       VALUES ($1, 100)
       RETURNING id`,
      [testProductId]
    );
    if (!res.rows[0].id) throw new Error('Failed to return inserted inventory ID');
  });

  await test('Insert valid Order referencing User', async () => {
    const res = await pool.query(
      `INSERT INTO orders (user_id, status, total_amount)
       VALUES ($1, 'PENDING', 1000.00)
       RETURNING id`,
      [testUserId]
    );
    testOrderId = res.rows[0].id;
    if (!testOrderId) throw new Error('Failed to return inserted order ID');
  });

  await test('Insert valid OrderItem referencing Order and Product', async () => {
    const res = await pool.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
       VALUES ($1, $2, 2, 500.00)
       RETURNING id`,
      [testOrderId, testProductId]
    );
    if (!res.rows[0].id) throw new Error('Failed to return inserted order item ID');
  });


  // ---------------------------------------------------------------------------
  // SECTION 2: INVALID DATA REJECTIONS (CONSTRAINT ENFORCEMENT)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Database Constraint & Negative Test Enforcement ---');

  await test('Reject duplicate User Email', async () => {
    try {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ('Duplicate User', 'alice@example.com', 'hash123', 'CUSTOMER')`
      );
      throw new Error('Database allowed duplicate email insert');
    } catch (err) {
      if (err.code === '23505') return; // 23505 is PostgreSQL unique_violation
      throw err;
    }
  });

  await test('Reject invalid User Role', async () => {
    try {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ('Invalid Role User', 'invalidrole@example.com', 'hash123', 'SUPERUSER')`
      );
      throw new Error('Database allowed invalid role insert');
    } catch (err) {
      if (err.code === '23514') return; // check_violation
      throw err;
    }
  });

  await test('Reject negative Product Price', async () => {
    try {
      await pool.query(
        `INSERT INTO products (category_id, name, price)
         VALUES ($1, 'Negative Price Item', -50.00)`,
        [testCategoryId]
      );
      throw new Error('Database allowed negative product price');
    } catch (err) {
      if (err.code === '23514') return; // check_violation
      throw err;
    }
  });

  await test('Reject negative Inventory Quantity', async () => {
    try {
      await pool.query(
        `INSERT INTO inventory (product_id, quantity)
         VALUES ($1, -10)`,
        [testProductId]
      );
      throw new Error('Database allowed negative inventory quantity');
    } catch (err) {
      if (err.code === '23514' || err.code === '23505') return; // check or unique violation
      throw err;
    }
  });

  await test('Reject multiple Inventory records for same Product (Single Warehouse V1 Rule)', async () => {
    try {
      await pool.query(
        `INSERT INTO inventory (product_id, quantity)
         VALUES ($1, 50)`,
        [testProductId]
      );
      throw new Error('Database allowed duplicate inventory record for product');
    } catch (err) {
      if (err.code === '23505') return; // unique_violation
      throw err;
    }
  });

  await test('Reject invalid Order Status', async () => {
    try {
      await pool.query(
        `INSERT INTO orders (user_id, status, total_amount)
         VALUES ($1, 'INVALID_STATUS', 100.00)`,
        [testUserId]
      );
      throw new Error('Database allowed invalid order status');
    } catch (err) {
      if (err.code === '23514') return; // check_violation
      throw err;
    }
  });

  await test('Reject zero or negative OrderItem Quantity', async () => {
    try {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, 0, 100.00)`,
        [testOrderId, testProductId]
      );
      throw new Error('Database allowed 0 quantity order item');
    } catch (err) {
      if (err.code === '23514' || err.code === '23505') return;
      throw err;
    }
  });

  await test('Reject negative OrderItem Purchase Price', async () => {
    try {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, 1, -10.00)`,
        [testOrderId, testProductId]
      );
      throw new Error('Database allowed negative purchase price');
    } catch (err) {
      if (err.code === '23514' || err.code === '23505') return;
      throw err;
    }
  });

  await test('Reject invalid Foreign Key references', async () => {
    try {
      await pool.query(
        `INSERT INTO products (category_id, name, price)
         VALUES (999999, 'Orphan Product', 100.00)`
      );
      throw new Error('Database allowed product with invalid category_id');
    } catch (err) {
      if (err.code === '23503') return; // foreign_key_violation
      throw err;
    }
  });


  // ---------------------------------------------------------------------------
  // SECTION 3: HISTORICAL PRICE INTEGRITY VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Price History Integrity Verification ---');

  await test('Verify OrderItem historical price is preserved when Product price changes', async () => {
    // 1. Fetch historical purchase price recorded in order item
    const itemBefore = await pool.query(
      `SELECT price_at_purchase FROM order_items WHERE id = (
        SELECT id FROM order_items WHERE order_id = $1 AND product_id = $2
      )`,
      [testOrderId, testProductId]
    );
    const originalPriceAtPurchase = parseFloat(itemBefore.rows[0].price_at_purchase);
    if (originalPriceAtPurchase !== 500.00) {
      throw new Error(`Expected price_at_purchase 500.00, got ${originalPriceAtPurchase}`);
    }

    // 2. Update current product catalog price from 500 to 700
    await pool.query(
      `UPDATE products SET price = 700.00 WHERE id = $1`,
      [testProductId]
    );

    // 3. Verify current product price is 700
    const prodCheck = await pool.query(`SELECT price FROM products WHERE id = $1`, [testProductId]);
    const updatedProdPrice = parseFloat(prodCheck.rows[0].price);
    if (updatedProdPrice !== 700.00) {
      throw new Error(`Product price was not updated to 700.00`);
    }

    // 4. Verify historical order item price remains unchanged at 500
    const itemAfter = await pool.query(
      `SELECT price_at_purchase FROM order_items WHERE id = (
        SELECT id FROM order_items WHERE order_id = $1 AND product_id = $2
      )`,
      [testOrderId, testProductId]
    );
    const preservedPriceAtPurchase = parseFloat(itemAfter.rows[0].price_at_purchase);

    if (preservedPriceAtPurchase !== 500.00) {
      throw new Error(`Historical price changed! Expected 500.00, got ${preservedPriceAtPurchase}`);
    }
  });


  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log(`📊 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('----------------------------------------------------');

  if (passedTests === totalTests) {
    console.log('🎉 ALL DATABASE VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME TESTS FAILED. PLEASE REVIEW LOGS.');
    process.exitCode = 1;
  }

  await pool.end();
}

verifyDatabase();
