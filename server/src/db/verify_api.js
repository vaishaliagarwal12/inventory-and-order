import http from 'http';
import app from '../app.js';
import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';

/**
 * AUTOMATED API TEST SUITE (PHASE 3)
 * Tests all Category and Product REST endpoints, validation rules, search, pagination, filtering, and error handling.
 */
async function runApiTests() {
  // Start server on an ephemeral port
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
  console.log(`🧪 RUNNING PHASE 3 API VERIFICATION SUITE (${baseUrl})`);
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

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: HEALTH API
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Health API Verification ---');
    await test('GET /api/health returns 200 and connected status', async () => {
      const res = await fetch(`${baseUrl}/health`);
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.database.status !== 'connected') {
        throw new Error(`Expected 200 OK, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    // -------------------------------------------------------------------------
    // SECTION 2: CATEGORY APIS
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Category API Verification ---');

    let createdCategoryId;
    let unusedCategoryId;

    await test('GET /api/categories returns category list', async () => {
      const res = await fetch(`${baseUrl}/categories`);
      const body = await res.json();
      if (res.status !== 200 || !body.success || !Array.isArray(body.data)) {
        throw new Error(`Expected 200 with data array, got ${res.status}`);
      }
      if (body.data.length === 0) {
        throw new Error('Expected seed categories to be present');
      }
    });

    await test('POST /api/categories creates a new category', async () => {
      const res = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: `Sports & Outdoors ${Date.now()}`,
          description: 'Sporting equipment and outdoor gear',
        }),
      });
      const body = await res.json();
      if (res.status !== 201 || !body.success || !body.data.id) {
        throw new Error(`Expected 201 Created, got ${res.status}: ${JSON.stringify(body)}`);
      }
      createdCategoryId = body.data.id;
    });

    await test('POST /api/categories rejects duplicate category name (409 Conflict)', async () => {
      const res = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: 'Electronics', // Seed category
          description: 'Duplicate electronics test',
        }),
      });
      const body = await res.json();
      if (res.status !== 409 || body.success !== false) {
        throw new Error(`Expected 409 Conflict, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('POST /api/categories rejects empty/whitespace name (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name: '   ', description: 'Blank name' }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('GET /api/categories/:id returns single category details', async () => {
      const res = await fetch(`${baseUrl}/categories/${createdCategoryId}`);
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.id !== createdCategoryId) {
        throw new Error(`Expected 200 OK with matching ID, got ${res.status}`);
      }
    });

    await test('GET /api/categories/:id returns 404 for non-existent category', async () => {
      const res = await fetch(`${baseUrl}/categories/999999`);
      const body = await res.json();
      if (res.status !== 404 || body.success !== false) {
        throw new Error(`Expected 404 Not Found, got ${res.status}`);
      }
    });

    await test('PUT /api/categories/:id updates existing category', async () => {
      const res = await fetch(`${baseUrl}/categories/${createdCategoryId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: `Sports Gear Updated ${Date.now()}`,
          description: 'Updated sports description',
        }),
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.id !== createdCategoryId) {
        throw new Error(`Expected 200 OK, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('POST /api/categories creates an empty category for deletion test', async () => {
      const res = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: `Empty Category ${Date.now()}`,
          description: 'Category with no products',
        }),
      });
      const body = await res.json();
      unusedCategoryId = body.data.id;
    });

    await test('DELETE /api/categories/:id deletes unused category successfully', async () => {
      const res = await fetch(`${baseUrl}/categories/${unusedCategoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success) {
        throw new Error(`Expected 200 OK, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('DELETE /api/categories/:id rejects deletion of category with assigned products', async () => {
      // Category 1 (Electronics) has seed products assigned
      const res = await fetch(`${baseUrl}/categories/1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      if (res.status !== 400 && res.status !== 409) {
        throw new Error(`Expected 400/409 error rejection, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });


    // -------------------------------------------------------------------------
    // SECTION 3: PRODUCT APIS
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Product API Verification ---');

    let createdProductId;

    await test('GET /api/products returns paginated product list', async () => {
      const res = await fetch(`${baseUrl}/products`);
      const body = await res.json();
      if (res.status !== 200 || !body.success || !Array.isArray(body.data) || !body.pagination) {
        throw new Error(`Expected 200 OK with data and pagination, got ${res.status}`);
      }
      if (typeof body.pagination.total !== 'number' || typeof body.pagination.totalPages !== 'number') {
        throw new Error(`Invalid pagination metadata structure`);
      }
    });

    await test('GET /api/products supports custom limit & page pagination', async () => {
      const res = await fetch(`${baseUrl}/products?page=1&limit=3`);
      const body = await res.json();
      if (res.status !== 200 || body.data.length > 3 || body.pagination.limit !== 3) {
        throw new Error(`Expected max 3 items and limit=3, got ${res.status}`);
      }
    });

    await test('GET /api/products supports name search filtering', async () => {
      const res = await fetch(`${baseUrl}/products?search=Keyboard`);
      const body = await res.json();
      if (res.status !== 200 || body.data.length === 0) {
        throw new Error(`Expected matching search items for 'Keyboard'`);
      }
      const match = body.data.some((item) => item.name.toLowerCase().includes('keyboard'));
      if (!match) throw new Error('Returned product does not match search term');
    });

    await test('GET /api/products supports category filtering', async () => {
      const res = await fetch(`${baseUrl}/products?category_id=1`);
      const body = await res.json();
      if (res.status !== 200 || body.data.some((p) => p.category_id !== 1)) {
        throw new Error(`Expected all returned products to have category_id=1`);
      }
    });

    await test('GET /api/products supports active status filtering', async () => {
      const res = await fetch(`${baseUrl}/products?is_active=true`);
      const body = await res.json();
      if (res.status !== 200 || body.data.some((p) => p.is_active !== true)) {
        throw new Error(`Expected all returned products to have is_active=true`);
      }
    });

    await test('GET /api/products rejects invalid page parameter (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/products?page=0`);
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for invalid page=0`);
      }
    });

    await test('POST /api/products creates a new product', async () => {
      const res = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          category_id: 1,
          name: 'Smart Watch Series X',
          description: 'Fitness and health tracking smart watch',
          price: 199.99,
          is_active: true,
        }),
      });
      const body = await res.json();
      if (res.status !== 201 || !body.success || !body.data.id) {
        throw new Error(`Expected 201 Created, got ${res.status}: ${JSON.stringify(body)}`);
      }
      createdProductId = body.data.id;
    });

    await test('POST /api/products rejects invalid/non-existent category_id (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          category_id: 99999,
          name: 'Orphan Watch',
          price: 99.99,
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for invalid category_id, got ${res.status}`);
      }
    });

    await test('POST /api/products rejects negative price (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          category_id: 1,
          name: 'Freebie Gadget',
          price: -25.00,
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request for negative price, got ${res.status}`);
      }
    });

    await test('GET /api/products/:id returns single product with category name', async () => {
      const res = await fetch(`${baseUrl}/products/${createdProductId}`);
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.id !== createdProductId || !body.data.category_name) {
        throw new Error(`Expected 200 with product & category_name, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('PUT /api/products/:id updates existing product', async () => {
      const res = await fetch(`${baseUrl}/products/${createdProductId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          category_id: 1,
          name: 'Smart Watch Series X Pro',
          description: 'Pro model with extra battery life',
          price: 249.99,
        }),
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success || parseFloat(body.data.price) !== 249.99) {
        throw new Error(`Expected 200 OK with updated price, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('PATCH /api/products/:id/status deactivates product', async () => {
      const res = await fetch(`${baseUrl}/products/${createdProductId}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ is_active: false }),
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.is_active !== false) {
        throw new Error(`Expected 200 OK with is_active=false, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('PATCH /api/products/:id/status reactivates product', async () => {
      const res = await fetch(`${baseUrl}/products/${createdProductId}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ is_active: true }),
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success || body.data.is_active !== true) {
        throw new Error(`Expected 200 OK with is_active=true, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('DELETE /api/products/:id deletes unreferenced product', async () => {
      const res = await fetch(`${baseUrl}/products/${createdProductId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success) {
        throw new Error(`Expected 200 OK for unreferenced product delete, got ${res.status}`);
      }
    });

    await test('DELETE /api/products/:id rejects deletion of product in order history', async () => {
      // Create order item referencing product 1 to simulate historical purchase
      await pool.query(
        `INSERT INTO orders (id, user_id, status, total_amount) VALUES (999, 1, 'CONFIRMED', 299.99) ON CONFLICT (id) DO NOTHING`
      );
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (999, 1, 1, 299.99) ON CONFLICT DO NOTHING`
      );

      // Now attempt to delete Product 1
      const res = await fetch(`${baseUrl}/products/1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      if (res.status !== 400 && res.status !== 409) {
        throw new Error(`Expected 400/409 rejection for product with order history, got ${res.status}: ${JSON.stringify(body)}`);
      }

      // Cleanup test order record
      await pool.query(`DELETE FROM order_items WHERE order_id = 999`);
      await pool.query(`DELETE FROM orders WHERE id = 999`);
    });

  } finally {
    // Stop temporary server and pool connection
    server.close();
    await pool.end();
  }

  // -------------------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log(`📊 API VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('----------------------------------------------------');

  if (passedTests === totalTests) {
    console.log('🎉 ALL PHASE 3 API VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME API TESTS FAILED.');
    process.exitCode = 1;
  }
}

runApiTests();
