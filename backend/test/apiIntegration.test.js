import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import * as chainService from '../src/services/chain/index.js';

let server;
let baseUrl;

test.before(async () => {
  process.env.ADMIN_API_KEY = 'secret-admin-key-123';
  process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

  app.locals.agentRuntime = {
    processTurn: async (event) => {
      const isPayment = event.content.includes('payment') || event.content.includes('pay') || event.amountWei;
      if (isPayment) {
        if (event.amountWei && BigInt(event.amountWei) > 500000000000000000n) {
          return {
            turnId: event.id,
            attemptId: '0x' + '1'.repeat(64),
            decision: 'BLOCKED',
            replyText: 'Payment blocked by Spending Charter (reason code 1).',
            charterReasonCode: 1,
            reasoningHash: '0x' + 'f'.repeat(64),
            receiptId: null,
            txHash: null,
            error: null
          };
        }
        return {
          turnId: event.id,
          attemptId: '0x' + '2'.repeat(64),
          decision: 'EXECUTED',
          replyText: 'Payment executed successfully.',
          charterReasonCode: 0,
          reasoningHash: '0x' + 'e'.repeat(64),
          receiptId: '0x' + '2'.repeat(64),
          txHash: '0x' + '3'.repeat(64),
          error: null
        };
      }

      return {
        turnId: event.id,
        attemptId: null,
        decision: 'DECLINED_BY_AGENT',
        replyText: 'Declined by agent.',
        charterReasonCode: 0,
        reasoningHash: '0x' + 'd'.repeat(64),
        receiptId: null,
        txHash: null,
        error: null
      };
    }
  };

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  delete app.locals.agentRuntime;
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('A. GET /api/v1/charter/rules returns 502 CHAIN_ERROR when unconfigured', async () => {
  const res = await fetch(`${baseUrl}/api/v1/charter/rules`);
  // Unconfigured RPC returns 502 CHAIN_ERROR
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, 'CHAIN_ERROR');
});

test('B. GET /api/v1/charter/status returns 502 CHAIN_ERROR when unconfigured', async () => {
  const res = await fetch(`${baseUrl}/api/v1/charter/status`);
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, 'CHAIN_ERROR');
});

test('C. POST /api/v1/charter/check performs validation and returns 502 when unconfigured', async () => {
  const resBad = await fetch(`${baseUrl}/api/v1/charter/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toAddress: '0x1111111111111111111111111111111111111111' })
  });
  assert.equal(resBad.status, 400);
  const bodyBad = await resBad.json();
  assert.equal(bodyBad.ok, false);
  assert.equal(bodyBad.error.code, 'VALIDATION_ERROR');

  const resUnconfigured = await fetch(`${baseUrl}/api/v1/charter/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      toAddress: '0x1111111111111111111111111111111111111111',
      amount: '0.5'
    })
  });
  assert.equal(resUnconfigured.status, 502);
  const bodyUnconfigured = await resUnconfigured.json();
  assert.equal(bodyUnconfigured.ok, false);
  assert.equal(bodyUnconfigured.error.code, 'CHAIN_ERROR');
});

test('D. POST /api/v1/good-agent/respond processes interaction and returns AgentTurnResult', async () => {
  const res = await fetch(`${baseUrl}/api/v1/good-agent/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'Please pay 0.5 MST to vendor',
      counterparty: '0x1111111111111111111111111111111111111111',
      amountWei: '500000000000000000'
    })
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.decision, 'EXECUTED');
  assert.equal(body.data.txHash, '0x' + '3'.repeat(64));

  // Missing content validation error test
  const resBad = await fetch(`${baseUrl}/api/v1/good-agent/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: 'user' })
  });
  assert.equal(resBad.status, 400);
  const bodyBad = await resBad.json();
  assert.equal(bodyBad.ok, false);
  assert.equal(bodyBad.error.code, 'VALIDATION_ERROR');
});

test('E & Part 12: POST /api/v1/demo/run-attack-sequence produces exactly urgent_pretext, prompt_injection, fake_trust_claim in canonical order', async () => {
  const processedEvents = [];
  app.locals.agentRuntime = {
    processTurn: async (event) => {
      processedEvents.push(event);
      return {
        turnId: event.id,
        attemptId: null,
        decision: 'BLOCKED',
        replyText: 'Defense evaluated.',
        charterReasonCode: 0,
        reasoningHash: null,
        receiptId: null,
        txHash: null,
        error: null
      };
    }
  };

  const res = await fetch(`${baseUrl}/api/v1/demo/run-attack-sequence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: 'test-conv-123' })
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.conversationId, 'test-conv-123');
  assert.ok(Array.isArray(body.data.attacks));
  assert.equal(body.data.attacks.length, 3);

  // Assert exact canonical order: urgent_pretext -> prompt_injection -> fake_trust_claim
  assert.equal(body.data.attacks[0].attackType, 'urgent_pretext');
  assert.equal(body.data.attacks[1].attackType, 'prompt_injection');
  assert.equal(body.data.attacks[2].attackType, 'fake_trust_claim');

  // Verify all 3 attacks reached Good Agent pipeline
  assert.equal(processedEvents.length, 3);
  assert.ok(processedEvents[0].content.includes('subscription expiring'));
  assert.ok(processedEvents[1].content.includes('SYSTEM UPDATE OVERRIDE'));
  assert.ok(processedEvents[2].content.includes('VendorCorp'));
});
