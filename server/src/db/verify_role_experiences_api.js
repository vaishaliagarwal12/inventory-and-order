import http from 'http';
import { pool } from '../config/db.js';
import app from '../app.js';
import * as userRepo from '../repositories/user.repository.js';
import * as productRepo from '../repositories/product.repository.js';
import * as inventoryRepo from '../repositories/inventory.repository.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';

let server;
let baseUrl;

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runSuite = async () => {
  console.log('\n----------------------------------------------------');
  console.log('🧪 RUNNING PHASE 2 ROLE-BASED EXPERIENCES & AUTHORIZATION SUITE');
  console.log('----------------------------------------------------');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  };

  // 1. Setup server
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  const timestamp = Date.now();
  const adminUser = await userRepo.create({
    name: `Admin RoleTest ${timestamp}`,
    email: `admin_role_${timestamp}@example.com`,
    password_hash: '$2b$10$my3nnJD0z8xpTDiCG1c4SejOzoBqDZTy0dS8SrHRbRphL4MkpHvMG', // Password123
    role: 'ADMIN',
  });
  const customerA = await userRepo.create({
    name: `Customer A RoleTest ${timestamp}`,
    email: `custA_role_${timestamp}@example.com`,
    password_hash: '$2b$10$my3nnJD0z8xpTDiCG1c4SejOzoBqDZTy0dS8SrHRbRphL4MkpHvMG',
    role: 'CUSTOMER',
  });
  const customerB = await userRepo.create({
    name: `Customer B RoleTest ${timestamp}`,
    email: `custB_role_${timestamp}@example.com`,
    password_hash: '$2b$10$my3nnJD0z8xpTDiCG1c4SejOzoBqDZTy0dS8SrHRbRphL4MkpHvMG',
    role: 'CUSTOMER',
  });

  const adminToken = jwt.sign({ userId: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
  const custAToken = jwt.sign({ userId: customerA.id, role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
  const custBToken = jwt.sign({ userId: customerB.id, role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
  const expiredToken = jwt.sign({ userId: customerA.id, role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '-1s' });

  // Test 1: Public Registration strictly creates CUSTOMER accounts
  const regRes = await request('POST', '/api/auth/register', {
    name: `New Customer ${timestamp}`,
    email: `newcust_${timestamp}@example.com`,
    password: 'Password123',
    role: 'ADMIN', // Client payload attempting to request ADMIN role
  });
  assert(
    regRes.status === 201 && regRes.body.data.role === 'CUSTOMER',
    'Public registration ignores client role payload and enforces CUSTOMER role strictly'
  );

  // Test 2: Customer attempts on Admin-Only Endpoints (403 Forbidden)
  const custProductRes = await request('POST', '/api/products', { category_id: 1, name: 'Hack', price: 10 }, custAToken);
  assert(custProductRes.status === 403, 'Customer attempting POST /api/products is rejected (403 Forbidden)');

  const custCategoryRes = await request('POST', '/api/categories', { name: 'Hack Category' }, custAToken);
  assert(custCategoryRes.status === 403, 'Customer attempting POST /api/categories is rejected (403 Forbidden)');

  const custAdjustRes = await request('PATCH', '/api/inventory/product/1/adjust', { change: 100 }, custAToken);
  assert(custAdjustRes.status === 403, 'Customer attempting PATCH /api/inventory/product/:id/adjust is rejected (403 Forbidden)');

  const custMovRes = await request('GET', '/api/inventory/movements', null, custAToken);
  assert(custMovRes.status === 403, 'Customer attempting GET /api/inventory/movements is rejected (403 Forbidden)');

  const custReportRes = await request('GET', '/api/reports/dashboard', null, custAToken);
  assert(custReportRes.status === 403, 'Customer attempting GET /api/reports/dashboard is rejected (403 Forbidden)');

  const custDirRes = await request('GET', '/api/users/customers', null, custAToken);
  assert(custDirRes.status === 403, 'Customer attempting GET /api/users/customers is rejected (403 Forbidden)');

  // Test 3: Customer Isolation (Viewing another customer order)
  const orderBRes = await request('POST', '/api/orders', { items: [{ product_id: 1, quantity: 1 }] }, custBToken);
  assert(orderBRes.status === 201 && orderBRes.body.data.id, 'Customer B created an order successfully');
  const orderBId = orderBRes.body.data.id;

  const custAViewBRes = await request('GET', `/api/orders/${orderBId}`, null, custAToken);
  assert(custAViewBRes.status === 403, 'Customer A attempting to view Customer B order is rejected (403 Forbidden)');

  const custACancelBRes = await request('PATCH', `/api/orders/${orderBId}/status`, { status: 'CANCELLED' }, custAToken);
  assert(custACancelBRes.status === 403, 'Customer A attempting to cancel Customer B order is rejected (403 Forbidden)');

  // Test 4: Admin Access to Operations, Analytics & Audit Ledgers (200 OK)
  const adminReportRes = await request('GET', '/api/reports/dashboard', null, adminToken);
  assert(
    adminReportRes.status === 200 && adminReportRes.body.data.summary.total_revenue !== undefined,
    'Admin accessing GET /api/reports/dashboard succeeds with real SQL analytics data (200 OK)'
  );

  const adminCustomersRes = await request('GET', '/api/users/customers', null, adminToken);
  assert(
    adminCustomersRes.status === 200 && Array.isArray(adminCustomersRes.body.data),
    'Admin accessing GET /api/users/customers succeeds with customer directory (200 OK)'
  );

  const adminMovementsRes = await request('GET', '/api/inventory/movements', null, adminToken);
  assert(
    adminMovementsRes.status === 200 && Array.isArray(adminMovementsRes.body.data),
    'Admin accessing GET /api/inventory/movements succeeds with audit ledger entries (200 OK)'
  );

  const adminViewBRes = await request('GET', `/api/orders/${orderBId}`, null, adminToken);
  assert(adminViewBRes.status === 200 && adminViewBRes.body.data.id === orderBId, 'Admin viewing Customer B order succeeds (200 OK)');

  // Test 5: Session Expiry (401 Unauthorized)
  const expiredRes = await request('GET', '/api/auth/me', null, expiredToken);
  assert(expiredRes.status === 401, 'Request with expired JWT token is rejected (401 Unauthorized)');

  // Cleanup server
  server.close();

  console.log('----------------------------------------------------');
  console.log(`📊 ROLE EXPERIENCES & AUTHORIZATION SUMMARY: ${passed}/${passed + failed} PASSED`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
};

runSuite().catch((err) => {
  console.error('Unhandled error in role experiences test suite:', err);
  if (server) server.close();
  process.exit(1);
});
