import test from 'node:test';
import assert from 'node:assert/strict';

import { SpendingCharterAdapter, createSpendingCharterAdapter } from '../src/agent/adapters/SpendingCharterAdapter.js';
import { ValidationError, ChainError } from '../src/agent/errors.js';
import { processTurn } from '../src/agent/GoodAgentPipeline.js';

test('SpendingCharterAdapter: checkPayment delegates correctly and converts wei to MST decimal string', async () => {
  let capturedTo = null;
  let capturedAmountStr = null;

  const mockChainService = {
    checkCharterPayment: async (to, amountStr) => {
      capturedTo = to;
      capturedAmountStr = amountStr;
      return { ok: true, reasonCode: 0 };
    }
  };

  const adapter = createSpendingCharterAdapter({}, { chainService: mockChainService });
  const result = await adapter.checkPayment('0x1111111111111111111111111111111111111111', '1000000000000000000');

  assert.equal(capturedTo, '0x1111111111111111111111111111111111111111');
  assert.equal(capturedAmountStr, '1.0');
  assert.deepEqual(result, { allowed: true, reasonCode: 0 });
});

test('SpendingCharterAdapter: exact wei conversion for various amounts', async () => {
  let capturedAmountStr = null;
  const mockChainService = {
    checkCharterPayment: async (to, amountStr) => {
      capturedAmountStr = amountStr;
      return { ok: true, reasonCode: 0 };
    }
  };

  const adapter = createSpendingCharterAdapter({}, { chainService: mockChainService });

  await adapter.checkPayment('0x1111111111111111111111111111111111111111', '250000000000000000');
  assert.equal(capturedAmountStr, '0.25');

  await adapter.checkPayment('0x1111111111111111111111111111111111111111', 1000000000000000000n);
  assert.equal(capturedAmountStr, '1.0');
});

test('SpendingCharterAdapter: attemptPayment delegates correctly and preserves result', async () => {
  let capturedTo = null;
  let capturedAmountStr = null;
  let capturedReceiptId = null;

  const mockChainService = {
    attemptCharterPayment: async (to, amountStr, receiptId) => {
      capturedTo = to;
      capturedAmountStr = amountStr;
      capturedReceiptId = receiptId;
      return {
        executed: true,
        reasonCode: 0,
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        to,
        amount: amountStr
      };
    }
  };

  const adapter = createSpendingCharterAdapter({}, { chainService: mockChainService });
  const validReceiptId = '0x' + 'a'.repeat(64);
  const result = await adapter.attemptPayment(
    '0x1111111111111111111111111111111111111111',
    '500000000000000000',
    validReceiptId
  );

  assert.equal(capturedTo, '0x1111111111111111111111111111111111111111');
  assert.equal(capturedAmountStr, '0.5');
  assert.equal(capturedReceiptId, validReceiptId);
  assert.deepEqual(result, {
    executed: true,
    reasonCode: 0,
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  });
});

test('SpendingCharterAdapter: getRules and getStatus delegate correctly', async () => {
  const mockChainService = {
    getCharterRules: async () => ({
      maxPerTx: '0.5',
      dailyCap: '1.5',
      humanApprovalThreshold: '0.3',
      allowListEnabled: true
    }),
    getCharterStatus: async () => ({
      windowStart: 1700000000,
      spentInWindow: '0.1',
      remainingInWindow: '1.4',
      balance: '2.0'
    })
  };

  const adapter = createSpendingCharterAdapter({}, { chainService: mockChainService });

  const rules = await adapter.getRules();
  assert.deepEqual(rules, {
    maxPerTx: '0.5',
    dailyCap: '1.5',
    humanApprovalThreshold: '0.3',
    allowListEnabled: true
  });

  const status = await adapter.getStatus();
  assert.deepEqual(status, {
    windowStart: 1700000000,
    spentInWindow: '0.1',
    remainingInWindow: '1.4',
    balance: '2.0'
  });
});

test('SpendingCharterAdapter: validation error checks', async () => {
  const adapter = createSpendingCharterAdapter();
  const validAddr = '0x1111111111111111111111111111111111111111';
  const validReceiptId = '0x' + '1'.repeat(64);

  // F. JS numbers rejected
  await assert.rejects(
    () => adapter.checkPayment(validAddr, 1000),
    (err) => err instanceof ValidationError && err.message.includes('JavaScript numbers are rejected')
  );

  // G. Malformed amount strings rejected
  await assert.rejects(
    () => adapter.checkPayment(validAddr, '10.5'),
    ValidationError
  );
  await assert.rejects(
    () => adapter.checkPayment(validAddr, '-100'),
    ValidationError
  );
  await assert.rejects(
    () => adapter.checkPayment(validAddr, '0x10'),
    ValidationError
  );

  // H. Invalid EVM addresses rejected
  await assert.rejects(
    () => adapter.checkPayment('invalid-address', '1000'),
    ValidationError
  );

  // I. Malformed bytes32 receipt IDs rejected
  await assert.rejects(
    () => adapter.attemptPayment(validAddr, '1000', 'not-a-bytes32'),
    (err) => err instanceof ValidationError && err.message.includes('Invalid bytes32 receiptId')
  );
});

test('SpendingCharterAdapter: normal charter block returns allowed=false without throwing', async () => {
  const mockChainService = {
    checkCharterPayment: async () => ({
      ok: false,
      reasonCode: 1 // EXCEEDS_MAX_PER_TX
    })
  };

  const adapter = createSpendingCharterAdapter({}, { chainService: mockChainService });
  const result = await adapter.checkPayment('0x1111111111111111111111111111111111111111', '1000000000000000000');
  assert.deepEqual(result, { allowed: false, reasonCode: 1 });
});

test('SpendingCharterAdapter: ChainError propagation from P3', async () => {
  const p3ChainErr = new Error('RPC connection failed');
  p3ChainErr.code = 'CHAIN_ERROR';

  const mockChainService = {
    attemptCharterPayment: async () => {
      throw p3ChainErr;
    }
  };

  const adapter = createSpendingCharterAdapter({}, { chainService: mockChainService });
  const validReceiptId = '0x' + '2'.repeat(64);
  await assert.rejects(
    () => adapter.attemptPayment('0x1111111111111111111111111111111111111111', '1000000000000000000', validReceiptId),
    (err) => err.code === 'CHAIN_ERROR'
  );
});

// PHASE 6: End-to-End GoodAgentPipeline Integration Tests
test('GoodAgentPipeline + SpendingCharterAdapter + P3 chain service: PAYMENT_INTENT executed', async () => {
  const mockChainService = {
    checkCharterPayment: async () => ({ ok: true, reasonCode: 0 }),
    attemptCharterPayment: async () => ({
      executed: true,
      reasonCode: 0,
      txHash: '0xMockExecutedTxHash'
    })
  };

  const adapter = createSpendingCharterAdapter({}, { chainService: mockChainService });
  const event = {
    id: '0x' + '1'.repeat(64),
    sender: '0x9999999999999999999999999999999999999999',
    content: 'Please pay 0.5 MST to vendor',
    counterparty: '0x1111111111111111111111111111111111111111',
    amountWei: '500000000000000000'
  };

  const mockModel = {
    generate: async () => ({
      text: JSON.stringify({ decision: 'PAYMENT_INTENT', summary: 'Safe payment intent' }),
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      fallbackUsed: false
    })
  };

  const turnResult = await processTurn(event, {
    model: mockModel,
    charter: adapter
  });

  assert.equal(turnResult.decision, 'EXECUTED');
  assert.equal(turnResult.charterReasonCode, 0);
  assert.equal(turnResult.txHash, '0xMockExecutedTxHash');
  assert.equal(turnResult.error, null);
});

test('GoodAgentPipeline + SpendingCharterAdapter + P3 chain service: PAYMENT_INTENT blocked by charter', async () => {
  const mockChainService = {
    checkCharterPayment: async () => ({ ok: false, reasonCode: 1 }) // EXCEEDS_MAX_PER_TX
  };

  const adapter = createSpendingCharterAdapter({}, { chainService: mockChainService });
  const event = {
    id: '0x' + '2'.repeat(64),
    sender: '0x9999999999999999999999999999999999999999',
    content: 'Please pay 10 MST to vendor',
    counterparty: '0x1111111111111111111111111111111111111111',
    amountWei: '10000000000000000000'
  };

  const mockModel = {
    generate: async () => ({
      text: JSON.stringify({ decision: 'PAYMENT_INTENT', summary: 'Safe payment intent' }),
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      fallbackUsed: false
    })
  };

  const turnResult = await processTurn(event, {
    model: mockModel,
    charter: adapter
  });

  assert.equal(turnResult.decision, 'BLOCKED');
  assert.equal(turnResult.charterReasonCode, 1);
  assert.equal(turnResult.error, null);
});
