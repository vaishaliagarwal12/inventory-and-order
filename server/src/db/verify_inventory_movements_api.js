import http from 'http';
import { pool } from '../config/db.js';
import app from '../app.js';
import * as userRepo from '../repositories/user.repository.js';
import * as productRepo from '../repositories/product.repository.js';
import * as inventoryRepo from '../repositories/inventory.repository.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_change_in_production_12345';
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
  console.log('🧪 RUNNING PHASE 1 INVENTORY MOVEMENTS & AUDIT LEDGER SUITE');
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

  // 1. Setup server & test data
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  const timestamp = Date.now();
  const adminUser = await userRepo.create({
    name: `Admin MoveTest ${timestamp}`,
    email: `admin_move_${timestamp}@example.com`,
    password_hash: 'hash',
    role: 'ADMIN',
  });
  const customerUser = await userRepo.create({
    name: `Customer MoveTest ${timestamp}`,
    email: `cust_move_${timestamp}@example.com`,
    password_hash: 'hash',
    role: 'CUSTOMER',
  });

  const adminToken = jwt.sign({ userId: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
  const customerToken = jwt.sign({ userId: customerUser.id, role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });

  // Create test product and inventory
  const categoryId = 1; // Electronics
  const product = await productRepo.create({
    category_id: categoryId,
    name: `Verify Movement Item ${timestamp}`,
    description: 'Ledger Audit Test Item',
    price: 150.00,
    is_active: true,
  });

  const initialStock = 50;
  await inventoryRepo.create({
    product_id: product.id,
    quantity: initialStock,
  });
  await inventoryRepo.createMovement({
    product_id: product.id,
    order_id: null,
    change_quantity: initialStock,
    resulting_quantity: initialStock,
    movement_type: 'INITIAL_STOCK',
    notes: 'Initial movement test setup',
  });

  // Test 1: Verify Initial Stock movement entry
  const initMovRes = await request('GET', `/api/inventory/movements/product/${product.id}`, null, adminToken);
  assert(
    initMovRes.status === 200 && initMovRes.body.data.some((m) => m.movement_type === 'INITIAL_STOCK' && m.change_quantity === 50),
    'Initial stock movement entry recorded correctly'
  );

  // Test 2: Order Creation & Stock Deduction Movement
  const orderRes = await request(
    'POST',
    '/api/orders',
    { items: [{ product_id: product.id, quantity: 5 }] },
    customerToken
  );
  assert(orderRes.status === 201 && orderRes.body.data.id, 'Order created successfully (201 Created)');
  const orderId = orderRes.body.data.id;

  const postOrderMovRes = await request('GET', `/api/inventory/movements/product/${product.id}`, null, adminToken);
  const orderMov = postOrderMovRes.body.data.find((m) => m.order_id === orderId && m.movement_type === 'ORDER_RESERVATION');
  assert(
    orderMov && orderMov.change_quantity === -5 && orderMov.resulting_quantity === 45,
    'ORDER_RESERVATION movement entry recorded with change_quantity -5 and resulting_quantity 45'
  );

  // Test 3: Insufficient Stock Order Failure & Transaction Rollback
  const excessOrderRes = await request(
    'POST',
    '/api/orders',
    { items: [{ product_id: product.id, quantity: 999 }] },
    customerToken
  );
  assert(excessOrderRes.status === 400, 'Order exceeding stock rejected with 400 Bad Request');
  
  const postFailMovRes = await request('GET', `/api/inventory/movements/product/${product.id}`, null, adminToken);
  assert(postFailMovRes.body.data.length === 2, 'Failed order creation rolled back completely (no orphan movement entries)');

  // Test 4: Order Cancellation & Stock Restoration Movement
  const cancelRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'CANCELLED' }, customerToken);
  assert(cancelRes.status === 200 && cancelRes.body.data.status === 'CANCELLED', 'Order cancelled successfully');

  const postCancelMovRes = await request('GET', `/api/inventory/movements/product/${product.id}`, null, adminToken);
  const cancelMov = postCancelMovRes.body.data.find((m) => m.order_id === orderId && m.movement_type === 'ORDER_CANCEL_RESTORE');
  assert(
    cancelMov && cancelMov.change_quantity === 5 && cancelMov.resulting_quantity === 50,
    'ORDER_CANCEL_RESTORE movement entry recorded with change_quantity +5 and resulting_quantity restored to 50'
  );

  // Test 5: Repeated Cancellation Attempt Prevention
  const repeatCancelRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'CANCELLED' }, customerToken);
  assert(repeatCancelRes.status === 400, 'Repeated order cancellation rejected (400 Order is already cancelled)');

  const postRepeatCancelMovRes = await request('GET', `/api/inventory/movements/product/${product.id}`, null, adminToken);
  const restoreMovCount = postRepeatCancelMovRes.body.data.filter((m) => m.order_id === orderId && m.movement_type === 'ORDER_CANCEL_RESTORE').length;
  assert(restoreMovCount === 1, 'Repeated cancellation did not duplicate stock restoration or movement entry');

  // Test 6: Admin Stock Adjustment & Movement
  const adjustRes = await request('PATCH', `/api/inventory/product/${product.id}/adjust`, { change: 25 }, adminToken);
  assert(adjustRes.status === 200 && adjustRes.body.data.quantity === 75, 'Admin stock adjustment (+25) succeeded');

  const postAdjustMovRes = await request('GET', `/api/inventory/movements/product/${product.id}`, null, adminToken);
  const adjustMov = postAdjustMovRes.body.data.find((m) => m.movement_type === 'RESTOCK' && m.change_quantity === 25);
  assert(
    adjustMov && adjustMov.resulting_quantity === 75,
    'RESTOCK / ADMIN_ADJUSTMENT movement entry recorded with change +25 and resulting_quantity 75'
  );

  // Test 7: Customer Access Control to Movements Endpoint
  const custMoveRes = await request('GET', '/api/inventory/movements', null, customerToken);
  assert(custMoveRes.status === 403, 'Customer requesting GET /api/inventory/movements receives 403 Forbidden');

  // Test 8: Concurrent Order Processing Safety
  const concurrentCount = 5;
  const concPromises = [];
  for (let i = 0; i < concurrentCount; i++) {
    concPromises.push(
      request('POST', '/api/orders', { items: [{ product_id: product.id, quantity: 2 }] }, customerToken)
    );
  }
  const concResults = await Promise.all(concPromises);
  const successfulConcOrders = concResults.filter((r) => r.status === 201);
  assert(successfulConcOrders.length === concurrentCount, `All ${concurrentCount} concurrent orders placed safely`);

  const finalInvRes = await request('GET', `/api/inventory/product/${product.id}`, null, adminToken);
  const expectedStockAfterConc = 75 - (concurrentCount * 2); // 75 - 10 = 65
  assert(finalInvRes.body.data.quantity === expectedStockAfterConc, `Final stock matches accurate deducted quantity (${expectedStockAfterConc})`);

  // Cleanup server
  server.close();

  console.log('----------------------------------------------------');
  console.log(`📊 INVENTORY MOVEMENTS VERIFICATION SUMMARY: ${passed}/${passed + failed} PASSED`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
};

runSuite().catch((err) => {
  console.error('Unhandled error in movements test suite:', err);
  if (server) server.close();
  process.exit(1);
});
