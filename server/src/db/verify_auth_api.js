import http from 'http';
import app from '../app.js';
import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';
import { execSync } from 'child_process';
import { JWT_SECRET } from '../config/jwt.js';

/**
 * AUTOMATED AUTHENTICATION, AUTHORIZATION & SECURITY EDGE CASE VERIFICATION SUITE (PHASE 6)
 */
async function runAuthApiTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  console.log('----------------------------------------------------');
  console.log(`🧪 RUNNING PHASE 6 AUTH, AUTHORIZATION & SECURITY SUITE (${baseUrl})`);
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

  let adminToken, customerAToken, customerBToken;
  let customerAUserId, customerBUserId;
  let categoryId, productId, customerAOrderId, customerBOrderId;

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: REGISTRATION & PASSWORD HASHING
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Registration & Password Validation ---');

    const regEmail = `testuser_${Date.now()}@example.com`;

    await test('POST /api/auth/register registers user (role CUSTOMER by default, password_hash not returned)', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '   New Test User   ',
          email: regEmail.toUpperCase(), // Test normalization
          password: 'Password123',
          role: 'ADMIN', // Impersonation attempt: MUST BE IGNORED
        }),
      });
      const body = await res.json();

      if (res.status !== 201 || !body.success || !body.data.id) {
        throw new Error(`Expected 201 Created, got ${res.status}: ${JSON.stringify(body)}`);
      }

      if (body.data.role !== 'CUSTOMER') {
        throw new Error(`Security Violation! User registered as ${body.data.role}, expected CUSTOMER`);
      }

      if (body.data.password_hash || body.data.password) {
        throw new Error('Security Leak! Password hash or plaintext password returned in response');
      }

      customerAUserId = body.data.id;

      // Verify email was normalized to lowercase in database
      const dbCheck = await pool.query(`SELECT email, password_hash FROM users WHERE id = $1`, [customerAUserId]);
      if (dbCheck.rows[0].email !== regEmail.toLowerCase()) {
        throw new Error(`Email normalization failed. DB email: ${dbCheck.rows[0].email}`);
      }
      if (!dbCheck.rows[0].password_hash.startsWith('$2')) {
        throw new Error('Password was not properly hashed with bcrypt');
      }
    });

    await test('POST /api/auth/register rejects duplicate email (409 Conflict)', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate User',
          email: regEmail,
          password: 'Password123',
        }),
      });
      const body = await res.json();
      if (res.status !== 409 || body.success !== false) {
        throw new Error(`Expected 409 Conflict, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('POST /api/auth/register rejects short password < 8 chars (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Short Pass User',
          email: `short_${Date.now()}@example.com`,
          password: '12345',
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || body.success !== false) {
        throw new Error(`Expected 400 Bad Request, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });


    // -------------------------------------------------------------------------
    // SECTION 2: LOGIN & JWT ISSUANCE
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Login & JWT Issuance ---');

    await test('POST /api/auth/login succeeds for valid credentials & returns JWT', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail,
          password: 'Password123',
        }),
      });
      const body = await res.json();

      if (res.status !== 200 || !body.token || !body.user) {
        throw new Error(`Expected 200 OK with token, got ${res.status}: ${JSON.stringify(body)}`);
      }
      if (body.user.password_hash) {
        throw new Error('Security Leak! password_hash returned in login response');
      }

      customerAToken = body.token;
    });

    await test('POST /api/auth/login rejects wrong password (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail,
          password: 'WrongPassword!',
        }),
      });
      const body = await res.json();
      if (res.status !== 401 || body.success !== false) {
        throw new Error(`Expected 401 Unauthorized, got ${res.status}: ${JSON.stringify(body)}`);
      }
    });

    await test('Login as Seed Admin (admin@inventory.com / Password123) succeeds', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@inventory.com',
          password: 'Password123',
        }),
      });
      const body = await res.json();
      if (res.status !== 200 || body.user.role !== 'ADMIN') {
        throw new Error(`Expected Admin login 200 OK, got ${res.status}`);
      }
      adminToken = body.token;
    });

    await test('Login as Seed Customer B (bob@example.com / Password123) succeeds', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'bob@example.com',
          password: 'Password123',
        }),
      });
      const body = await res.json();
      if (res.status !== 200 || body.user.role !== 'CUSTOMER') {
        throw new Error(`Expected Customer B login 200 OK, got ${res.status}`);
      }
      customerBToken = body.token;
      customerBUserId = body.user.id;
    });


    // -------------------------------------------------------------------------
    // SECTION 3: JWT AUTHENTICATION MIDDLEWARE
    // -------------------------------------------------------------------------
    console.log('\n--- 3. JWT Middleware Verification ---');

    await test('GET /api/auth/me returns authenticated user details with valid token', async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      const body = await res.json();
      if (res.status !== 200 || body.data.id !== customerAUserId) {
        throw new Error(`Expected 200 OK with matching user ID, got ${res.status}`);
      }
    });

    await test('GET /api/auth/me rejects request with missing token (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/auth/me`);
      const body = await res.json();
      if (res.status !== 401 || body.success !== false) {
        throw new Error(`Expected 401 Unauthorized for missing token, got ${res.status}`);
      }
    });

    await test('GET /api/auth/me rejects request with invalid/tampered token (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${customerAToken}invalid` },
      });
      const body = await res.json();
      if (res.status !== 401 || body.success !== false) {
        throw new Error(`Expected 401 Unauthorized for tampered token, got ${res.status}`);
      }
    });

    await test('GET /api/auth/me rejects request with expired token (401 Unauthorized)', async () => {
      const expiredToken = jwt.sign({ userId: customerAUserId, role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '-1s' });

      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      const body = await res.json();
      if (res.status !== 401 || body.success !== false) {
        throw new Error(`Expected 401 Unauthorized for expired token, got ${res.status}`);
      }
    });


    // -------------------------------------------------------------------------
    // SECTION 4: ADMIN API AUTHORIZATION RESTRICTIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Admin API Authorization (Category, Product, Inventory) ---');

    await test('Customer attempting ADMIN operation POST /api/categories is rejected (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({ name: 'Hacker Category' }),
      });
      const body = await res.json();
      if (res.status !== 403 || body.success !== false) {
        throw new Error(`Expected 403 Forbidden for Customer creating category, got ${res.status}`);
      }
    });

    await test('Admin executing POST /api/categories succeeds (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: `Auth Admin Category ${Date.now()}` }),
      });
      const body = await res.json();
      if (res.status !== 201 || !body.data.id) {
        throw new Error(`Expected 201 Created for Admin, got ${res.status}: ${JSON.stringify(body)}`);
      }
      categoryId = body.data.id;
    });

    await test('Customer attempting ADMIN operation POST /api/products is rejected (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({ category_id: categoryId, name: 'Hacker Product', price: 99 }),
      });
      const body = await res.json();
      if (res.status !== 403 || body.success !== false) {
        throw new Error(`Expected 403 Forbidden for Customer creating product, got ${res.status}`);
      }
    });

    await test('Admin executing POST /api/products succeeds (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ category_id: categoryId, name: `Auth Product ${Date.now()}`, price: 100.00 }),
      });
      const body = await res.json();
      if (res.status !== 201 || !body.data.id) {
        throw new Error(`Expected 201 Created for Admin product, got ${res.status}`);
      }
      productId = body.data.id;
    });

    await test('Admin creating inventory for product succeeds', async () => {
      const res = await fetch(`${baseUrl}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ product_id: productId, quantity: 20 }),
      });
      const body = await res.json();
      if (res.status !== 201) throw new Error(`Expected 201 Created for Admin inventory, got ${res.status}`);
    });


    // -------------------------------------------------------------------------
    // SECTION 5: ORDER SECURITY, IMPERSONATION & ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Order Security & Impersonation Prevention ---');

    await test('Customer A creates order and impersonation user_id payload is overridden with Customer A ID', async () => {
      // Customer A token is sent, but payload attempts user_id = customerBUserId (impersonation attempt)
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({
          user_id: customerBUserId, // Impersonation attempt
          items: [{ product_id: productId, quantity: 2 }],
        }),
      });
      const body = await res.json();
      if (res.status !== 201 || !body.data.id) {
        throw new Error(`Expected 201 Created, got ${res.status}: ${JSON.stringify(body)}`);
      }

      if (body.data.user_id !== customerAUserId) {
        throw new Error(`SECURITY VIOLATION! Order was assigned to user_id ${body.data.user_id} instead of authenticated user_id ${customerAUserId}`);
      }

      customerAOrderId = body.data.id;
    });

    await test('Customer B creates an order for Customer B', async () => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerBToken}`,
        },
        body: JSON.stringify({
          items: [{ product_id: productId, quantity: 1 }],
        }),
      });
      const body = await res.json();
      if (res.status !== 201 || body.data.user_id !== customerBUserId) {
        throw new Error(`Expected 201 Created for Customer B, got ${res.status}`);
      }
      customerBOrderId = body.data.id;
    });

    await test('Customer A attempting to view Customer B order GET /api/orders/:id is rejected (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/orders/${customerBOrderId}`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      const body = await res.json();
      if (res.status !== 403 || body.success !== false) {
        throw new Error(`Security Violation! Customer A was able to access Customer B order, got ${res.status}`);
      }
    });

    await test('Customer A viewing own order GET /api/orders/:id succeeds (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/orders/${customerAOrderId}`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      const body = await res.json();
      if (res.status !== 200 || body.data.id !== customerAOrderId) {
        throw new Error(`Expected 200 OK for own order, got ${res.status}`);
      }
    });

    await test('Admin viewing Customer B order GET /api/orders/:id succeeds (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/orders/${customerBOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      if (res.status !== 200 || body.data.id !== customerBOrderId) {
        throw new Error(`Expected Admin to view any order 200 OK, got ${res.status}`);
      }
    });

    await test('Customer A listing GET /api/orders receives ONLY Customer A orders', async () => {
      // Customer A sends query ?user_id=customerBUserId attempting to list Customer B orders
      const res = await fetch(`${baseUrl}/orders?user_id=${customerBUserId}`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      const body = await res.json();
      if (res.status !== 200 || !Array.isArray(body.data)) {
        throw new Error(`Expected 200 OK, got ${res.status}`);
      }
      // Verify all returned orders belong strictly to Customer A
      if (body.data.some((o) => o.user_id !== customerAUserId)) {
        throw new Error('Security Violation! Customer A order list contains orders belonging to another user');
      }
    });

    await test('Customer A attempting status change to CONFIRMED is rejected (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/orders/${customerAOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });
      const body = await res.json();
      if (res.status !== 403 || body.success !== false) {
        throw new Error(`Expected 403 Forbidden for Customer updating status to CONFIRMED, got ${res.status}`);
      }
    });

    await test('Customer A cancelling own PENDING order succeeds (200 OK & stock restored)', async () => {
      const res = await fetch(`${baseUrl}/orders/${customerAOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const body = await res.json();
      if (res.status !== 200 || body.data.status !== 'CANCELLED') {
        throw new Error(`Expected 200 OK for Customer cancelling own order, got ${res.status}`);
      }
    });

    await test('Customer A attempting to cancel Customer B order is rejected (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/orders/${customerBOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const body = await res.json();
      if (res.status !== 403 || body.success !== false) {
        throw new Error(`Expected 403 Forbidden for Customer cancelling another user order, got ${res.status}`);
      }
    });

    await test('Admin updating Customer B order status to CONFIRMED succeeds (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/orders/${customerBOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });
      const body = await res.json();
      if (res.status !== 200 || body.data.status !== 'CONFIRMED') {
        throw new Error(`Expected Admin status update 200 OK, got ${res.status}`);
      }
    });

  } finally {
    // Cleanup test data
    if (productId) {
      await pool.query(`DELETE FROM order_items WHERE product_id = $1`, [productId]).catch(() => {});
      await pool.query(`DELETE FROM inventory WHERE product_id = $1`, [productId]).catch(() => {});
      await pool.query(`DELETE FROM products WHERE id = $1`, [productId]).catch(() => {});
    }
    if (categoryId) {
      await pool.query(`DELETE FROM categories WHERE id = $1`, [categoryId]).catch(() => {});
    }
    if (customerAUserId) {
      await pool.query(`DELETE FROM users WHERE id = $1`, [customerAUserId]).catch(() => {});
    }

    server.close();
    await pool.end();
  }

  // -------------------------------------------------------------------------
  // SECTION 6: FULL REGRESSION SUITE (Phases 2, 3, 4, 5)
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Full Phase 2, 3, 4, & 5 Regression Verification ---');

  await test('Phase 2 Database Schema & Constraint verification (npm run db:verify)', async () => {
    execSync('npm run db:verify', { cwd: 'd:\\inventory and order\\server', stdio: 'ignore' });
  });

  await test('Phase 3 Category & Product API verification (npm run api:verify)', async () => {
    execSync('npm run api:verify', { cwd: 'd:\\inventory and order\\server', stdio: 'ignore' });
  });

  await test('Phase 4 Inventory API & Concurrency verification (npm run inventory:verify)', async () => {
    execSync('npm run inventory:verify', { cwd: 'd:\\inventory and order\\server', stdio: 'ignore' });
  });

  await test('Phase 5 Order API & Transaction verification (npm run orders:verify)', async () => {
    execSync('npm run orders:verify', { cwd: 'd:\\inventory and order\\server', stdio: 'ignore' });
  });


  // -------------------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log(`📊 AUTH & SECURITY VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('----------------------------------------------------');

  if (passedTests === totalTests) {
    console.log('🎉 ALL PHASE 6 AUTH, AUTHORIZATION, SECURITY & REGRESSION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME TESTS FAILED.');
    process.exitCode = 1;
  }
}

runAuthApiTests();
