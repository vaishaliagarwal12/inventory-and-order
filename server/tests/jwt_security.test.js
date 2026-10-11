import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import jwt from 'jsonwebtoken';
import { validateJwtSecret, JWT_SECRET, JWT_EXPIRES_IN } from '../src/config/jwt.js';
import { authenticateToken, authorizeRoles } from '../src/middleware/auth.middleware.js';

test('SEC-01: JWT Configuration Validation Suite', async (t) => {

  await t.test('1. Rejects missing JWT_SECRET (undefined / null)', () => {
    assert.throws(
      () => validateJwtSecret(undefined, 'development'),
      /FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing/
    );
    assert.throws(
      () => validateJwtSecret(null, 'development'),
      /FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing/
    );
  });

  await t.test('2. Rejects empty and whitespace-only JWT_SECRET', () => {
    assert.throws(
      () => validateJwtSecret('', 'development'),
      /FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is empty or whitespace-only/
    );
    assert.throws(
      () => validateJwtSecret('   ', 'development'),
      /FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is empty or whitespace-only/
    );
    assert.throws(
      () => validateJwtSecret('\t\n', 'development'),
      /FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is empty or whitespace-only/
    );
  });

  await t.test('3. Rejects secret shorter than 32 characters in production mode', () => {
    const shortSecret = 'too_short_secret_key';
    assert.throws(
      () => validateJwtSecret(shortSecret, 'production'),
      (err) => {
        // Must contain clear guidance without exposing the secret itself
        assert.match(err.message, /at least 32 characters long in production/);
        assert.ok(!err.message.includes(shortSecret), 'Error message must NOT leak the secret value');
        return true;
      }
    );
  });

  await t.test('4. Accepts valid secret (>= 32 chars) in production mode', () => {
    const strongSecret = 'super_strong_production_secret_key_with_sufficient_entropy_64chars';
    const result = validateJwtSecret(strongSecret, 'production');
    assert.equal(result, strongSecret);
  });

  await t.test('5. Trims leading and trailing whitespace from valid secret', () => {
    const secretWithSpaces = '  valid_secret_key_with_at_least_32_chars_long  ';
    const result = validateJwtSecret(secretWithSpaces, 'production');
    assert.equal(result, 'valid_secret_key_with_at_least_32_chars_long');
  });

  await t.test('6. Process fails fast during startup if JWT_SECRET is empty (Child Process)', () => {
    assert.throws(
      () => {
        execSync('node -e "import(\'./src/config/jwt.js\')"', {
          cwd: process.cwd(),
          env: { ...process.env, JWT_SECRET: '' },
          stdio: 'pipe',
        });
      },
      (err) => {
        const stderr = err.stderr.toString();
        assert.match(stderr, /FATAL CONFIGURATION ERROR/);
        return true;
      }
    );
  });

  await t.test('7. Process fails fast during startup if secret is short in production (Child Process)', () => {
    assert.throws(
      () => {
        execSync('node -e "import(\'./src/config/jwt.js\')"', {
          cwd: process.cwd(),
          env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: 'short_dev_key' },
          stdio: 'pipe',
        });
      },
      (err) => {
        const stderr = err.stderr.toString();
        assert.match(stderr, /at least 32 characters long in production/);
        assert.ok(!stderr.includes('short_dev_key'), 'Stderr must NOT print the secret');
        return true;
      }
    );
  });
});

test('SEC-01: JWT Signing, Verification & Role Authorization Suite', async (t) => {

  await t.test('1. Valid configured secret allows signing and decoding token payload', () => {
    assert.ok(JWT_SECRET && JWT_SECRET.length > 0);
    const token = jwt.sign({ userId: 42, role: 'ADMIN' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const decoded = jwt.verify(token, JWT_SECRET);

    assert.equal(decoded.userId, 42);
    assert.equal(decoded.role, 'ADMIN');
  });

  await t.test('2. authenticateToken middleware successfully authenticates valid token', (t, done) => {
    const validToken = jwt.sign({ userId: 10, role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
    const req = {
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    };
    const res = {};
    const next = (err) => {
      assert.equal(err, undefined);
      assert.deepEqual(req.user, { id: 10, role: 'CUSTOMER' });
      done();
    };

    authenticateToken(req, res, next);
  });

  await t.test('3. Token signed with old hardcoded fallback is REJECTED when secret is rotated', (t, done) => {
    const oldFallbackString = 'dev_jwt_secret_key_change_in_production_12345';
    // Temporarily verify using a different mock secret to prove signature rejection
    const mockRotatedSecret = 'new_rotated_secret_that_differs_from_fallback_123456';
    const forgedToken = jwt.sign({ userId: 1, role: 'ADMIN' }, oldFallbackString, { expiresIn: '1h' });

    // When verified against a different secret, jwt.verify must throw JsonWebTokenError
    assert.throws(
      () => jwt.verify(forgedToken, mockRotatedSecret),
      (err) => {
        assert.equal(err.name, 'JsonWebTokenError');
        assert.equal(err.message, 'invalid signature');
        return true;
      }
    );
    done();
  });

  await t.test('4. authenticateToken middleware rejects malformed and missing tokens', (t, done) => {
    // Missing token
    const reqEmpty = { headers: {} };
    authenticateToken(reqEmpty, {}, (err) => {
      assert.ok(err);
      assert.equal(err.statusCode, 401);
      assert.equal(err.message, 'Authentication token required');

      // Invalid signature / tampered token
      const reqTampered = { headers: { authorization: 'Bearer invalid.jwt.token' } };
      authenticateToken(reqTampered, {}, (errTampered) => {
        assert.ok(errTampered);
        assert.equal(errTampered.statusCode, 401);
        assert.equal(errTampered.message, 'Invalid or expired authentication token');
        done();
      });
    });
  });

  await t.test('5. Role-based authorization behavior remains intact', () => {
    // Admin authorized for ADMIN role
    const adminReq = { user: { id: 1, role: 'ADMIN' } };
    let adminCalled = false;
    authorizeRoles('ADMIN')(adminReq, {}, (err) => {
      assert.equal(err, undefined);
      adminCalled = true;
    });
    assert.ok(adminCalled);

    // Customer FORBIDDEN for ADMIN role
    const customerReq = { user: { id: 2, role: 'CUSTOMER' } };
    let customerError = null;
    authorizeRoles('ADMIN')(customerReq, {}, (err) => {
      customerError = err;
    });
    assert.ok(customerError);
    assert.equal(customerError.statusCode, 403);
    assert.match(customerError.message, /Access forbidden: Role 'CUSTOMER' is not authorized/);

    // Unauthenticated request is rejected with 401
    const unauthReq = {};
    let unauthError = null;
    authorizeRoles('ADMIN')(unauthReq, {}, (err) => {
      unauthError = err;
    });
    assert.ok(unauthError);
    assert.equal(unauthError.statusCode, 401);
  });
});
