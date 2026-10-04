import http from 'http';
import app from '../app.js';
import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';

/**
 * AUTOMATED INVENTORY API & CONCURRENCY VERIFICATION SUITE (PHASE 4)
 * Tests Inventory REST endpoints, atomic stock updates, race conditions, filtering, and regression suites.
 */
async function runInventoryApiTests() {
  // Spin up an ephemeral test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_key_change_in_production_12345';
  const adminToken = jwt.sign({ userId: 1, role: 'ADMIN' }, jwtSecret, { expiresIn: '1d' });
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  console.log('----------------------------------------------------');
  console.log(`🧪 RUNNING PHASE 4 INVENTORY API & CONCURRENCY SUITE (${baseUrl})`);
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

  let tempCategoryId, tempProductId, tempInventoryId;

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: REGRESSION SUITE (Health, Category, Product)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Regression Suite Verification ---');

    await test('GET /api/health works correctly', async () => {
      const res = await fetch(`${baseUrl}/health`);
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.database.status !== 'connected') {
        throw new Error(`Expected 200 OK with connected DB, got ${res.status}`);
      }
    });

    await test('Category API regression (GET /api/categories)', async () => {
      const res = await fetch(`${baseUrl}/categories`);
      const body = await res.json();
      if (res.status !== 200 || !body.success || !Array.isArray(body.data)) {
        throw new Error(`Expected 200 OK with category array, got ${res.status}`);
      }
    });

    await test('Product API regression (GET /api/products)', async () => {
      const res = await fetch(`${baseUrl}/products`);
      const body = await res.json();
      if (res.status !== 200 || !body.success || !Array.isArray(body.data)) {
        throw new Error(`Expected 200 OK with product array, got ${res.status}`);
      }
    });


    // -------------------------------------------------------------------------
    // SECTION 2: SETUP TEST DATA (Unstocked Product)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Test Setup (Creating Test Product) ---');

    await test('Create temporary test product for inventory testing', async () => {
      // 1. Fetch category
      const catRes = await fetch(`${baseUrl}/categories`);
      const catBody = await catRes.json();
      tempCategoryId = catBody.data[0].id;

      // 2. Create unstocked product
      const prodRes = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          category_id: tempCategoryId,
          name: `Unstocked Test Item ${Date.now()}`,
          description: 'Product created for Phase 4 inventory testing',
          price: 99.99,
          is_active: true,
        }),
      });
      const prodBody = await prodRes.json();
      if (prodRes.status !== 201 || !prodBody.data.id) {
        throw new Error(`Failed to create test product: ${JSON.stringify(prodBody)}`);
      }
      tempProductId = prodBody.data.id;
    });


    // -------------------------------------------------------------------------
    // SECTION 3: INVENTORY CREATION & DUPLICATE REJECTION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Inventory Creation & Duplicate Prevention ---');

    await test('GET /api/inventory/product/:productId returns 404 for unstocked product', async () => {
      const res = await fetch(`${baseUrl}/inventory/product/${tempProductId}`);
      const body = await res.json();
      if (res.status !== 404 || body.success !== false) {
        throw new Error(`Expected 404 Not Found for product without inventory, got ${res.status}`);
      }
    });

    await test('POST /api/inventory creates initial inventory', async () => {
      const res = await fetch(`${baseUrl}/inventory`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          product_id: tempProductId,
          quantity: 25,
        }),
      });
      const body = await res.json();
      if (res.status !== 201 || !body.success || body.data.quantity !== 25) {
        throw new Error(`Expected 201 Created with quantity 25, got ${res.status}: ${JSON.stringify(body)}`);
      }
      tempInventoryId = body.data.id;
    });

    await test('POST /api/inventory rejects duplicate inventory for same product (409 Conflict)', async () => {
      const res = await fetch(`${baseUrl}/inventory`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          product_id: tempProductId,
          quantity: 100,
        }),
      });
      const body = await res.json();
      if (res.status !== 409 || body.success !== false) {
        throw new Error(`Expected 409 Conflict for duplicate inventory, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('POST /api/inventory rejects non-existent product_id (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/inventory`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          product_id: 999999,
          quantity: 10,
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for invalid product_id, got ${res.status}`);
      }
    });

    await test('POST /api/inventory rejects negative quantity (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/inventory`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          product_id: tempProductId,
          quantity: -5,
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for negative quantity, got ${res.status}`);
      }
    });


    // -------------------------------------------------------------------------
    // SECTION 4: INVENTORY RETRIEVAL & DETAILS
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Inventory Retrieval & Details ---');

    await test('GET /api/inventory lists all inventory joined with product data', async () => {
      const res = await fetch(`${baseUrl}/inventory?limit=1000`, { headers: authHeaders });
      const body = await res.json();
      if (res.status !== 200 || !body.success || !Array.isArray(body.data) || !body.pagination) {
        throw new Error(`Expected 200 OK with inventory data and pagination, got ${res.status}`);
      }
      const item = body.data.find((i) => i.product_id === tempProductId);
      if (!item || !item.product_name || !item.stock_status) {
        throw new Error(`Expected joined product metadata and stock_status in inventory list`);
      }
    });

    await test('GET /api/inventory/:id returns inventory record by ID', async () => {
      const res = await fetch(`${baseUrl}/inventory/${tempInventoryId}`);
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.id !== tempInventoryId) {
        throw new Error(`Expected 200 OK with matching inventory ID, got ${res.status}`);
      }
    });

    await test('GET /api/inventory/product/:productId returns inventory by product ID', async () => {
      const res = await fetch(`${baseUrl}/inventory/product/${tempProductId}`);
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.product_id !== tempProductId) {
        throw new Error(`Expected 200 OK with matching product ID, got ${res.status}`);
      }
    });

    await test('GET /api/inventory/:id returns 404 for non-existent inventory ID', async () => {
      const res = await fetch(`${baseUrl}/inventory/999999`);
      const body = await res.json();
      if (res.status !== 404 || body.success !== false) {
        throw new Error(`Expected 404 Not Found, got ${res.status}`);
      }
    });


    // -------------------------------------------------------------------------
    // SECTION 5: INVENTORY UPDATE (PUT) & ADJUSTMENT (PATCH)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Inventory Stock Quantity Updates & Adjustments ---');

    await test('PUT /api/inventory/product/:productId sets absolute quantity', async () => {
      const res = await fetch(`${baseUrl}/inventory/product/${tempProductId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ quantity: 10 }),
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.quantity !== 10) {
        throw new Error(`Expected 200 OK with updated quantity 10, got ${res.status}`);
      }
    });

    await test('PUT /api/inventory/product/:productId rejects negative quantity (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/inventory/product/${tempProductId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ quantity: -15 }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for negative quantity, got ${res.status}`);
      }
    });

    await test('PATCH /api/inventory/product/:productId/adjust increases stock (+15)', async () => {
      const res = await fetch(`${baseUrl}/inventory/product/${tempProductId}/adjust`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ change: 15 }), // 10 + 15 = 25
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.quantity !== 25) {
        throw new Error(`Expected 200 OK with new quantity 25, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('PATCH /api/inventory/product/:productId/adjust decreases stock (-20)', async () => {
      const res = await fetch(`${baseUrl}/inventory/product/${tempProductId}/adjust`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ change: -20 }), // 25 - 20 = 5
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.quantity !== 5) {
        throw new Error(`Expected 200 OK with new quantity 5, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('PATCH /api/inventory/product/:productId/adjust reduces stock to zero (0)', async () => {
      const res = await fetch(`${baseUrl}/inventory/product/${tempProductId}/adjust`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ change: -5 }), // 5 - 5 = 0
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.quantity !== 0 || body.data.stock_status !== 'out_of_stock') {
        throw new Error(`Expected 200 OK with quantity 0 and stock_status out_of_stock, got ${res.status}`);
      }
    });

    await test('PATCH /api/inventory/product/:productId/adjust rejects negative resulting stock', async () => {
      const res = await fetch(`${baseUrl}/inventory/product/${tempProductId}/adjust`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ change: -10 }), // 0 - 10 = -10 (Rejection required!)
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for negative stock, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('PATCH /api/inventory/product/:productId/adjust rejects zero change (change: 0)', async () => {
      const res = await fetch(`${baseUrl}/inventory/product/${tempProductId}/adjust`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ change: 0 }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for zero change, got ${res.status}`);
      }
    });


    // -------------------------------------------------------------------------
    // SECTION 6: SEARCH & STOCK STATUS FILTERING
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Search, Stock Status Filtering & Pagination ---');

    await test('GET /api/inventory?stock_status=out_of_stock returns out of stock items', async () => {
      const res = await fetch(`${baseUrl}/inventory?stock_status=out_of_stock`, { headers: authHeaders });
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.some((i) => i.quantity !== 0)) {
        throw new Error(`Expected all items to have quantity 0 for out_of_stock filter`);
      }
    });

    await test('GET /api/inventory?stock_status=low_stock returns low stock items', async () => {
      // Set test product quantity to 5 (<= threshold 10)
      await fetch(`${baseUrl}/inventory/product/${tempProductId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ quantity: 5 }),
      });

      const res = await fetch(`${baseUrl}/inventory?stock_status=low_stock`, { headers: authHeaders });
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.some((i) => i.quantity === 0 || i.quantity > 10)) {
        throw new Error(`Expected all low_stock items to have 0 < quantity <= 10`);
      }
    });

    await test('GET /api/inventory?stock_status=in_stock returns in stock items', async () => {
      const res = await fetch(`${baseUrl}/inventory?stock_status=in_stock`, { headers: authHeaders });
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.some((i) => i.quantity <= 10)) {
        throw new Error(`Expected all in_stock items to have quantity > 10`);
      }
    });

    await test('GET /api/inventory?search=Headphones searches by product name', async () => {
      const res = await fetch(`${baseUrl}/inventory?search=Headphones`, { headers: authHeaders });
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.length === 0) {
        throw new Error(`Expected search matches for 'Headphones'`);
      }
      const match = body.data.every((i) => i.product_name.toLowerCase().includes('headphones'));
      if (!match) throw new Error('Search result includes non-matching items');
    });


    // -------------------------------------------------------------------------
    // SECTION 7: CONCURRENCY & ATOMIC RACE CONDITION TEST
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Atomic Concurrency & Race Condition Verification ---');

    await test('Atomic Concurrency Test: Simultaneous stock subtractions cannot drive stock negative', async () => {
      // 1. Set starting stock to exactly 10
      await fetch(`${baseUrl}/inventory/product/${tempProductId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ quantity: 10 }),
      });

      // 2. Fire Request A (-7) and Request B (-7) SIMULTANEOUSLY using Promise.all
      const [resA, resB] = await Promise.all([
        fetch(`${baseUrl}/inventory/product/${tempProductId}/adjust`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ change: -7 }),
        }),
        fetch(`${baseUrl}/inventory/product/${tempProductId}/adjust`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ change: -7 }),
        }),
      ]);

      const statusA = resA.status;
      const statusB = resB.status;

      // 3. Verify exactly ONE request succeeded (200) and ONE failed (400)
      const successCount = (statusA === 200 ? 1 : 0) + (statusB === 200 ? 1 : 0);
      const failureCount = (statusA === 400 ? 1 : 0) + (statusB === 400 ? 1 : 0);

      if (successCount !== 1 || failureCount !== 1) {
        throw new Error(
          `Race condition vulnerability detected! Expected 1 success (200) and 1 failure (400), got A=${statusA}, B=${statusB}`
        );
      }

      // 4. Verify final stock quantity in database is exactly 3 (10 - 7), NOT -4!
      const checkRes = await fetch(`${baseUrl}/inventory/product/${tempProductId}`);
      const checkBody = await checkRes.json();
      const finalQuantity = checkBody.data.quantity;

      if (finalQuantity !== 3) {
        throw new Error(`Database corruption detected! Expected final quantity = 3, got ${finalQuantity}`);
      }

      console.log(`     ℹ️ Concurrency result: 1 request succeeded (200), 1 request rejected (400), final stock = ${finalQuantity} (never negative)`);
    });

  } finally {
    // Clean up temporary test data if created
    if (tempProductId) {
      await pool.query(`DELETE FROM inventory WHERE product_id = $1`, [tempProductId]).catch(() => {});
      await pool.query(`DELETE FROM products WHERE id = $1`, [tempProductId]).catch(() => {});
    }
    server.close();
    await pool.end();
  }

  // -------------------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log(`📊 INVENTORY API VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('----------------------------------------------------');

  if (passedTests === totalTests) {
    console.log('🎉 ALL PHASE 4 INVENTORY & CONCURRENCY VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME INVENTORY TESTS FAILED.');
    process.exitCode = 1;
  }
}

runInventoryApiTests();
