import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let baseUrl;

test.before(async () => {
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

test('1: Valid urgent_pretext attack with conversationId succeeds', async () => {
  const res = await fetch(`${baseUrl}/api/v1/bad-agent/attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: 'conv_123', attackType: 'urgent_pretext' })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.attackType, 'urgent_pretext');
  assert.equal(body.data.conversationId, 'conv_123');
  assert.ok(body.data.message);
});

test('2: Valid prompt_injection attack succeeds', async () => {
  const res = await fetch(`${baseUrl}/api/v1/bad-agent/attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attackType: 'prompt_injection' })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.attackType, 'prompt_injection');
  assert.ok(body.data.message);
});

test('3: Valid fake_trust_claim attack succeeds', async () => {
  const res = await fetch(`${baseUrl}/api/v1/bad-agent/attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attackType: 'fake_trust_claim' })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.attackType, 'fake_trust_claim');
  assert.ok(body.data.message);
});

test('4: Missing attackType returns 400 VALIDATION_ERROR', async () => {
  const res = await fetch(`${baseUrl}/api/v1/bad-agent/attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: 'conv_123' })
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});

test('5: Invalid attackType returns 400 VALIDATION_ERROR', async () => {
  const res = await fetch(`${baseUrl}/api/v1/bad-agent/attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attackType: 'unsupported_attack' })
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});

test('6: Missing/invalid conversationId type returns 400 VALIDATION_ERROR', async () => {
  const res = await fetch(`${baseUrl}/api/v1/bad-agent/attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attackType: 'urgent_pretext', conversationId: 12345 })
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});

test('7: Response uses existing success envelope', async () => {
  const res = await fetch(`${baseUrl}/api/v1/bad-agent/attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attackType: 'urgent_pretext' })
  });
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.ok(body.data);
  assert.equal(body.error, undefined);
});

test('8: No targetAgentId is required in API request contract', async () => {
  const res = await fetch(`${baseUrl}/api/v1/bad-agent/attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attackType: 'urgent_pretext' })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.targetAgentId, undefined);
});

test('9: No fake Good Agent result is returned', async () => {
  const res = await fetch(`${baseUrl}/api/v1/bad-agent/attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attackType: 'urgent_pretext' })
  });
  const body = await res.json();
  assert.equal(body.data.goodAgentDecision, undefined);
  assert.equal(body.data.transactionHash, undefined);
  assert.equal(body.data.receiptId, undefined);
});

test('10: POST /api/v1/demo/run-attack-sequence runs full sequence', async () => {
  const res = await fetch(`${baseUrl}/api/v1/demo/run-attack-sequence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: 'seq_123' })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.conversationId, 'seq_123');
  assert.ok(Array.isArray(body.data.attacks));
  assert.equal(body.data.attacks.length, 3);
});
