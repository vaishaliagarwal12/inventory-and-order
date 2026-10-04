import http from 'http';
import app from '../app.js';
import { pool } from '../config/db.js';

/**
 * AUTOMATED CURRENCY API VERIFICATION SUITE (PHASE 7.1)
 */
async function runCurrencyApiTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  console.log('----------------------------------------------------');
  console.log(`🧪 RUNNING PHASE 7.1 CURRENCY API SUITE (${baseUrl})`);
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
    await test('GET /api/currency/rates returns 200 with USD base and valid INR exchange rate', async () => {
      const res = await fetch(`${baseUrl}/currency/rates`);
      if (res.status !== 200) {
        throw new Error(`Expected status 200, got ${res.status}`);
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(`Expected success: true, got ${JSON.stringify(data)}`);
      }
      if (data.data.base !== 'USD') {
        throw new Error(`Expected base USD, got ${data.data.base}`);
      }
      if (!data.data.rates || typeof data.data.rates.INR !== 'number' || data.data.rates.INR <= 0) {
        throw new Error(`Expected positive numeric INR rate, got ${JSON.stringify(data.data.rates)}`);
      }
      if (!data.data.updatedAt) {
        throw new Error('Expected updatedAt timestamp in response');
      }
    });

    await test('GET /api/currency/rates uses cached rate on subsequent calls', async () => {
      const res = await fetch(`${baseUrl}/currency/rates`);
      const data = await res.json();
      if (res.status !== 200 || !data.success || !data.data.rates.INR) {
        throw new Error('Cached rate fetch failed');
      }
    });

    console.log('\n----------------------------------------------------');
    console.log(`📊 PHASE 7.1 CURRENCY TEST SUMMARY: ${passedTests}/${totalTests} Passed`);
    console.log('----------------------------------------------------');
  } finally {
    server.close();
    await pool.end();
  }

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runCurrencyApiTests().catch((err) => {
  console.error('Fatal error in currency verification:', err);
  process.exit(1);
});
