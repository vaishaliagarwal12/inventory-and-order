import http from 'http';
import app from '../app.js';
import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';
import { execSync } from 'child_process';

/**
 * AUTOMATED ORDER API, TRANSACTION ROLLBACK & CONCURRENCY VERIFICATION SUITE (PHASE 5)
 */
async function runOrderApiTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_key_change_in_production_12345';
  const adminToken = jwt.sign({ userId: 1, role: 'ADMIN' }, jwtSecret, { expiresIn: '1d' });
  const customerToken = jwt.sign({ userId: 2, role: 'CUSTOMER' }, jwtSecret, { expiresIn: '1d' });
  const customerBToken = jwt.sign({ userId: 3, role: 'CUSTOMER' }, jwtSecret, { expiresIn: '1d' });

  const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
  const customerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` };
  const customerBHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${customerBToken}` };

  console.log('----------------------------------------------------');
  console.log(`🧪 RUNNING PHASE 5 ORDER API & TRANSACTION SUITE (${baseUrl})`);
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

  let testCategoryId, testProductAId, testProductBId, testSingleStockProdId;
  let createdOrderId;

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: SETUP TEST DATA
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Setup Test Products & Inventory ---');

    await test('Setup Category & Test Products for Order testing', async () => {
      // Fetch category
      const catRes = await fetch(`${baseUrl}/categories`);
      const catBody = await catRes.json();
      testCategoryId = catBody.data[0].id;

      // Create Product A (Price: 50.00)
      const pARes = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          category_id: testCategoryId,
          name: `Order Test Product A ${Date.now()}`,
          price: 50.00,
          is_active: true,
        }),
      });
      const pABody = await pARes.json();
      testProductAId = pABody.data.id;

      // Add Stock 10 to Product A
      await fetch(`${baseUrl}/inventory`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ product_id: testProductAId, quantity: 10 }),
      });

      // Create Product B (Price: 100.00)
      const pBRes = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          category_id: testCategoryId,
          name: `Order Test Product B ${Date.now()}`,
          price: 100.00,
          is_active: true,
        }),
      });
      const pBBody = await pBRes.json();
      testProductBId = pBBody.data.id;

      // Add Stock 1 to Product B
      await fetch(`${baseUrl}/inventory`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ product_id: testProductBId, quantity: 1 }),
      });
    });


    // -------------------------------------------------------------------------
    // SECTION 2: ORDER CREATION & VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Order Creation & Input Validation ---');

    await test('POST /api/orders creates valid order (status PENDING, stock reduced, total calculated)', async () => {
      // User 2 (Alice) orders Product A (qty 2 @ 50 = 100)
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify({
          user_id: 2,
          items: [{ product_id: testProductAId, quantity: 2 }],
        }),
      });
      const body = await res.json();
      if (res.status !== 201 || !body.success || !body.data.id) {
        throw new Error(`Expected 201 Created, got ${res.status}: ${JSON.stringify(body)}`);
      }

      createdOrderId = body.data.id;
      if (body.data.status !== 'PENDING') throw new Error(`Expected PENDING status, got ${body.data.status}`);
      if (parseFloat(body.data.total_amount) !== 100.00) {
        throw new Error(`Expected total_amount 100.00, got ${body.data.total_amount}`);
      }

      // Check remaining stock of Product A (10 - 2 = 8)
      const invRes = await fetch(`${baseUrl}/inventory/product/${testProductAId}`);
      const invBody = await invRes.json();
      if (invBody.data.quantity !== 8) {
        throw new Error(`Expected remaining stock 8, got ${invBody.data.quantity}`);
      }
    });

    await test('POST /api/orders rejects non-existent user_id (404 Not Found)', async () => {
      // Send expired/fake token for non-existent user or test token without user
      const fakeToken = jwt.sign({ userId: 999999, role: 'CUSTOMER' }, jwtSecret, { expiresIn: '1d' });
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fakeToken}` },
        body: JSON.stringify({
          items: [{ product_id: testProductAId, quantity: 1 }],
        }),
      });
      const body = await res.json();
      if (res.status !== 404 || body.success !== false) {
        throw new Error(`Expected 404 Not Found for invalid user_id, got ${res.status}`);
      }
    });

    await test('POST /api/orders rejects empty items array (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify({ user_id: 2, items: [] }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for empty items, got ${res.status}`);
      }
    });

    await test('POST /api/orders rejects invalid item quantity <= 0 (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify({
          user_id: 2,
          items: [{ product_id: testProductAId, quantity: 0 }],
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for quantity=0, got ${res.status}`);
      }
    });

    await test('POST /api/orders rejects duplicate product IDs in items (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify({
          user_id: 2,
          items: [
            { product_id: testProductAId, quantity: 1 },
            { product_id: testProductAId, quantity: 2 },
          ],
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for duplicate product_ids, got ${res.status}`);
      }
    });

    await test('POST /api/orders rejects non-existent product_id (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify({
          user_id: 2,
          items: [{ product_id: 999999, quantity: 1 }],
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for non-existent product_id, got ${res.status}`);
      }
    });

    await test('POST /api/orders rejects inactive product (400 Bad Request)', async () => {
      // Deactivate Product B
      await fetch(`${baseUrl}/products/${testProductBId}/status`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ is_active: false }),
      });

      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify({
          user_id: 2,
          items: [{ product_id: testProductBId, quantity: 1 }],
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for inactive product, got ${res.status}`);
      }

      // Reactivate Product B
      await fetch(`${baseUrl}/products/${testProductBId}/status`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ is_active: true }),
      });
    });

    await test('POST /api/orders rejects order exceeding available stock (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify({
          user_id: 2,
          items: [{ product_id: testProductAId, quantity: 999 }],
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for insufficient stock, got ${res.status}`);
      }
    });


    // -------------------------------------------------------------------------
    // SECTION 3: TRANSACTION ROLLBACK VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. PostgreSQL Transaction Rollback Verification ---');

    await test('Transaction Rollback: Failure on 2nd item rolls back 1st item stock & prevents partial order', async () => {
      // Current stock: Product A = 8, Product B = 1
      // Attempt: Product A qty = 2 (valid), Product B qty = 5 (INSUFFICIENT STOCK!)
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify({
          user_id: 2,
          items: [
            { product_id: testProductAId, quantity: 2 },
            { product_id: testProductBId, quantity: 5 },
          ],
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request rejection, got ${res.status}: ${JSON.stringify(body)}`);
      }

      // Verify Product A stock remains 8 (did NOT reduce to 6!)
      const invA = await fetch(`${baseUrl}/inventory/product/${testProductAId}`).then((r) => r.json());
      if (invA.data.quantity !== 8) {
        throw new Error(`Rollback failed! Product A stock reduced to ${invA.data.quantity}, expected 8`);
      }

      // Verify Product B stock remains 1
      const invB = await fetch(`${baseUrl}/inventory/product/${testProductBId}`).then((r) => r.json());
      if (invB.data.quantity !== 1) {
        throw new Error(`Rollback failed! Product B stock changed to ${invB.data.quantity}, expected 1`);
      }
    });


    // -------------------------------------------------------------------------
    // SECTION 4: CONCURRENCY / ROW LOCKING VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Concurrency & Row Locking Verification ---');

    await test('Concurrency Test: Simultaneous orders for last available unit (stock=1)', async () => {
      // Create product with stock = 1
      const pRes = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          category_id: testCategoryId,
          name: `Single Stock Item ${Date.now()}`,
          price: 150.00,
          is_active: true,
        }),
      }).then((r) => r.json());
      testSingleStockProdId = pRes.data.id;

      await fetch(`${baseUrl}/inventory`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ product_id: testSingleStockProdId, quantity: 1 }),
      });

      // Fire 2 concurrent order requests for qty 1
      const [orderA, orderB] = await Promise.all([
        fetch(`${baseUrl}/orders`, {
          method: 'POST',
          headers: customerHeaders,
          body: JSON.stringify({
            user_id: 2,
            items: [{ product_id: testSingleStockProdId, quantity: 1 }],
          }),
        }),
        fetch(`${baseUrl}/orders`, {
          method: 'POST',
          headers: customerBHeaders,
          body: JSON.stringify({
            user_id: 3,
            items: [{ product_id: testSingleStockProdId, quantity: 1 }],
          }),
        }),
      ]);

      const successCount = (orderA.status === 201 ? 1 : 0) + (orderB.status === 201 ? 1 : 0);
      const failureCount = (orderA.status === 400 ? 1 : 0) + (orderB.status === 400 ? 1 : 0);

      if (successCount !== 1 || failureCount !== 1) {
        throw new Error(`Race condition vulnerability! Expected 1 success (201) and 1 failure (400), got A=${orderA.status}, B=${orderB.status}`);
      }

      // Check remaining stock is 0 (never -1!)
      const invSingle = await fetch(`${baseUrl}/inventory/product/${testSingleStockProdId}`).then((r) => r.json());
      if (invSingle.data.quantity !== 0) {
        throw new Error(`Expected final stock = 0, got ${invSingle.data.quantity}`);
      }

      console.log(`     ℹ️ Order Concurrency result: 1 order created (201), 1 order rejected (400), final stock = 0`);
    });


    // -------------------------------------------------------------------------
    // SECTION 5: ORDER RETRIEVAL & HISTORICAL PRICE INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Order Retrieval & Price History Integrity ---');

    await test('GET /api/orders/:id returns order details, items, & item subtotals', async () => {
      const res = await fetch(`${baseUrl}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.id !== createdOrderId) {
        throw new Error(`Expected 200 OK with order details, got ${res.status}`);
      }
      if (!Array.isArray(body.data.items) || body.data.items.length === 0) {
        throw new Error('Expected items array in order details');
      }
      const item = body.data.items[0];
      if (!item.product_name || !item.price_at_purchase || !item.subtotal) {
        throw new Error('Order item missing product_name, price_at_purchase, or subtotal');
      }
    });

    await test('Historical Price Integrity: Catalog price update does not affect historical price_at_purchase', async () => {
      // 1. Update Product A catalog price from 50.00 to 150.00
      await fetch(`${baseUrl}/products/${testProductAId}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({
          category_id: testCategoryId,
          name: 'Order Test Product A Updated',
          price: 150.00,
        }),
      });

      // 2. Fetch created order and verify price_at_purchase is STILL 50.00
      const res = await fetch(`${baseUrl}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const body = await res.json();
      const historicalItem = body.data.items.find((i) => i.product_id === testProductAId);

      if (parseFloat(historicalItem.price_at_purchase) !== 50.00) {
        throw new Error(`Historical price changed! Expected 50.00, got ${historicalItem.price_at_purchase}`);
      }
    });

    await test('GET /api/orders lists orders with user_id & status filters', async () => {
      const res = await fetch(`${baseUrl}/orders?status=PENDING&page=1&limit=10`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success || !Array.isArray(body.data) || !body.pagination) {
        throw new Error(`Expected 200 OK with order list and pagination, got ${res.status}`);
      }
      if (body.data.some((o) => o.user_id !== 2 || o.status !== 'PENDING')) {
        throw new Error('Order list includes non-matching user_id or status filters');
      }
    });


    // -------------------------------------------------------------------------
    // SECTION 6: ORDER STATUS LIFECYCLE & CANCELLATION STOCK RESTORATION
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Status Lifecycle & Cancellation Stock Restoration ---');

    await test('Valid status transitions: PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED', async () => {
      // PENDING -> CONFIRMED
      const res1 = await fetch(`${baseUrl}/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ status: 'CONFIRMED' }),
      }).then((r) => r.json());
      if (res1.data.status !== 'CONFIRMED') throw new Error('Failed to transition to CONFIRMED');

      // CONFIRMED -> PROCESSING
      const res2 = await fetch(`${baseUrl}/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ status: 'PROCESSING' }),
      }).then((r) => r.json());
      if (res2.data.status !== 'PROCESSING') throw new Error('Failed to transition to PROCESSING');

      // PROCESSING -> SHIPPED
      const res3 = await fetch(`${baseUrl}/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ status: 'SHIPPED' }),
      }).then((r) => r.json());
      if (res3.data.status !== 'SHIPPED') throw new Error('Failed to transition to SHIPPED');

      // SHIPPED -> DELIVERED
      const res4 = await fetch(`${baseUrl}/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ status: 'DELIVERED' }),
      }).then((r) => r.json());
      if (res4.data.status !== 'DELIVERED') throw new Error('Failed to transition to DELIVERED');
    });

    await test('Reject invalid status transition from DELIVERED (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for transition from DELIVERED, got ${res.status}`);
      }
    });

    let cancelTestOrderId;
    await test('Order Cancellation restores reserved inventory stock (PENDING -> CANCELLED)', async () => {
      // 1. Check current Product A stock (was 8)
      const invBefore = await fetch(`${baseUrl}/inventory/product/${testProductAId}`).then((r) => r.json());
      const stockBefore = invBefore.data.quantity;

      // 2. Create Order for 3 units of Product A
      const orderRes = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: customerHeaders,
        body: JSON.stringify({
          user_id: 2,
          items: [{ product_id: testProductAId, quantity: 3 }],
        }),
      }).then((r) => r.json());
      cancelTestOrderId = orderRes.data.id;

      // Verify stock decreased by 3
      const invAfterOrder = await fetch(`${baseUrl}/inventory/product/${testProductAId}`).then((r) => r.json());
      if (invAfterOrder.data.quantity !== stockBefore - 3) {
        throw new Error(`Stock did not decrease after order creation`);
      }

      // 3. Cancel Order
      const cancelRes = await fetch(`${baseUrl}/orders/${cancelTestOrderId}/status`, {
        method: 'PATCH',
        headers: customerHeaders,
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const cancelBody = await cancelRes.json();
      if (cancelRes.status !== 200 || cancelBody.data.status !== 'CANCELLED') {
        throw new Error(`Failed to cancel order: ${JSON.stringify(cancelBody)}`);
      }

      // 4. Verify stock restored back to stockBefore
      const invAfterCancel = await fetch(`${baseUrl}/inventory/product/${testProductAId}`).then((r) => r.json());
      if (invAfterCancel.data.quantity !== stockBefore) {
        throw new Error(`Stock restoration failed! Expected ${stockBefore}, got ${invAfterCancel.data.quantity}`);
      }
    });

    await test('Reject double cancellation of already CANCELLED order (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/orders/${cancelTestOrderId}/status`, {
        method: 'PATCH',
        headers: customerHeaders,
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for double cancellation, got ${res.status}`);
      }
    });

  } finally {
    // Cleanup temporary test data
    if (testSingleStockProdId) {
      await pool.query(`DELETE FROM inventory WHERE product_id = $1`, [testSingleStockProdId]).catch(() => {});
      await pool.query(`DELETE FROM products WHERE id = $1`, [testSingleStockProdId]).catch(() => {});
    }
    if (testProductAId) {
      await pool.query(`DELETE FROM inventory WHERE product_id = $1`, [testProductAId]).catch(() => {});
      await pool.query(`DELETE FROM products WHERE id = $1`, [testProductAId]).catch(() => {});
    }
    if (testProductBId) {
      await pool.query(`DELETE FROM inventory WHERE product_id = $1`, [testProductBId]).catch(() => {});
      await pool.query(`DELETE FROM products WHERE id = $1`, [testProductBId]).catch(() => {});
    }

    server.close();
    await pool.end();
  }

  // -------------------------------------------------------------------------
  // SECTION 7: REGRESSION SUITES (Phase 2, 3, 4)
  // -------------------------------------------------------------------------
  console.log('\n--- 7. Full Phase 2, 3, & 4 Regression Verification ---');

  await test('Phase 2 Database Schema & Constraint verification (npm run db:verify)', async () => {
    execSync('npm run db:verify', { cwd: 'd:\\inventory and order\\server', stdio: 'ignore' });
  });

  await test('Phase 3 Category & Product API verification (npm run api:verify)', async () => {
    execSync('npm run api:verify', { cwd: 'd:\\inventory and order\\server', stdio: 'ignore' });
  });

  await test('Phase 4 Inventory API & Concurrency verification (npm run inventory:verify)', async () => {
    execSync('npm run inventory:verify', { cwd: 'd:\\inventory and order\\server', stdio: 'ignore' });
  });


  // -------------------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log(`📊 ORDER API & TRANSACTION VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('----------------------------------------------------');

  if (passedTests === totalTests) {
    console.log('🎉 ALL PHASE 5 ORDER, TRANSACTION, & REGRESSION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME TESTS FAILED.');
    process.exitCode = 1;
  }
}

runOrderApiTests();
