import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let baseUrl;

test.before(async () => {
  process.env.ADMIN_API_KEY = 'secret-admin-key-123';
  process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('1 & 2: backend starts and GET /api/v1/health returns 200 with healthy envelope', async () => {
  const res = await fetch(`${baseUrl}/api/v1/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.status, 'healthy');
  assert.ok(body.data.services);
});

test('3: GET /api/v1/config/public returns public config and does NOT expose secrets', async () => {
  const res = await fetch(`${baseUrl}/api/v1/config/public`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.ok(body.data.features);

  assert.equal(body.data.GEMINI_API_KEY, undefined);
  assert.equal(body.data.SUPABASE_SERVICE_ROLE_KEY, undefined);
  assert.equal(body.data.ADMIN_API_KEY, undefined);
  assert.equal(body.data.DEPLOYER_PRIVATE_KEY, undefined);
});

test('4: unknown route returns 404 with NOT_FOUND error envelope', async () => {
  const res = await fetch(`${baseUrl}/api/v1/unknown-route-12345`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, 'NOT_FOUND');
  assert.ok(body.error.message);
});

test('5: protected admin route rejects missing/invalid x-admin-key with 401 UNAUTHORIZED', async () => {
  const resMissing = await fetch(`${baseUrl}/api/v1/admin/reset-demo`, {
    method: 'POST'
  });
  assert.equal(resMissing.status, 401);
  const bodyMissing = await resMissing.json();
  assert.equal(bodyMissing.ok, false);
  assert.equal(bodyMissing.error.code, 'UNAUTHORIZED');

  const resInvalid = await fetch(`${baseUrl}/api/v1/admin/reset-demo`, {
    method: 'POST',
    headers: { 'x-admin-key': 'wrong-key' }
  });
  assert.equal(resInvalid.status, 401);
  const bodyInvalid = await resInvalid.json();
  assert.equal(bodyInvalid.ok, false);
  assert.equal(bodyInvalid.error.code, 'UNAUTHORIZED');

  const resValid = await fetch(`${baseUrl}/api/v1/admin/reset-demo`, {
    method: 'POST',
    headers: { 'x-admin-key': 'secret-admin-key-123' }
  });
  assert.equal(resValid.status, 501);
  const bodyValid = await resValid.json();
  assert.equal(bodyValid.ok, false);
  assert.equal(bodyValid.error.code, 'NOT_IMPLEMENTED');
});

test('6: later-stage routes return 501 with NOT_IMPLEMENTED envelope', async () => {
  const res = await fetch(`${baseUrl}/api/v1/agents`);
  assert.equal(res.status, 501);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, 'NOT_IMPLEMENTED');
});

test('7: CORS rejects forbidden origin and allows FRONTEND_ORIGIN', async () => {
  const resAllowed = await fetch(`${baseUrl}/api/v1/health`, {
    headers: { 'Origin': 'http://localhost:5173' }
  });
  assert.equal(resAllowed.status, 200);
  assert.equal(resAllowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');

  const resDisallowed = await fetch(`${baseUrl}/api/v1/health`, {
    headers: { 'Origin': 'http://malicious-site.com' }
  });
  assert.equal(resDisallowed.status, 403);
  const bodyDisallowed = await resDisallowed.json();
  assert.equal(bodyDisallowed.ok, false);
  assert.equal(bodyDisallowed.error.code, 'CORS_ERROR');
});
