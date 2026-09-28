import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseEtherString,
  formatEtherString,
  normalizeAddress,
  formatRules,
  formatStatus,
  formatPaymentOutcome,
  normalizeChainError
} from '../../src/services/chain/formatters.js';

import {
  getProvider,
  getDeployerSigner,
  getGoodAgentSigner,
  getBadAgentSigner,
  resetChainProvider
} from '../../src/services/chain/provider.js';

import {
  getCharterAbi,
  getChainStatus
} from '../../src/services/chain/index.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('1: Formatters parse decimal amount strings to BigInt without floating-point conversion', () => {
  const parsed = parseEtherString('0.5');
  assert.equal(typeof parsed, 'bigint');
  assert.equal(parsed.toString(), '500000000000000000');

  const zeroParsed = parseEtherString('0');
  assert.equal(zeroParsed.toString(), '0');

  // Rejects JS numbers and non-strings
  assert.throws(() => parseEtherString(0.5), TypeError);
  assert.throws(() => parseEtherString(10), TypeError);
  assert.throws(() => parseEtherString('invalid-amount'), Error);
});

test('2: Formatters convert wei BigInt values to decimal strings', () => {
  const formatted = formatEtherString(500000000000000000n);
  assert.equal(formatted, '0.5');
  assert.equal(formatEtherString(0n), '0.0');
});

test('3: Formatters normalize valid EVM addresses to lowercase and reject invalid formats', () => {
  const validUpper = '0x1111111111111111111111111111111111111111';
  assert.equal(normalizeAddress(validUpper), '0x1111111111111111111111111111111111111111');

  const validMixed = '0xaB5801a7D398351b8bE11C439e05C5B3259aeC9B';
  assert.equal(normalizeAddress(validMixed), '0xab5801a7d398351b8be11c439e05c5b3259aec9b');

  assert.throws(() => normalizeAddress('not-an-address'), Error);
  assert.throws(() => normalizeAddress(12345), TypeError);
});

test('4: Formatters normalize rules and status tuples into backend-safe structures', () => {
  const rawRules = [500000000000000000n, 1500000000000000000n, 300000000000000000n, true];
  const rules = formatRules(rawRules);
  assert.equal(rules.maxPerTx, '0.5');
  assert.equal(rules.dailyCap, '1.5');
  assert.equal(rules.humanApprovalThreshold, '0.3');
  assert.equal(rules.allowListEnabled, true);

  const rawStatus = [1700000000n, 500000000000000000n, 1000000000000000000n, 2000000000000000000n];
  const status = formatStatus(rawStatus);
  assert.equal(status.windowStart, 1700000000);
  assert.equal(status.spentInWindow, '0.5');
  assert.equal(status.remainingInWindow, '1.0');
  assert.equal(status.balance, '2.0');
});

test('5: Blocked payment result normalization produces valid, non-error outcome', () => {
  const outcome = formatPaymentOutcome({
    executed: false,
    reasonCode: 1, // EXCEEDS_MAX_PER_TX
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    to: '0x2222222222222222222222222222222222222222',
    amount: '0.8'
  });

  assert.equal(outcome.executed, false);
  assert.equal(outcome.reasonCode, 1);
  assert.equal(outcome.txHash, '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
  assert.equal(outcome.to, '0x2222222222222222222222222222222222222222');
  assert.equal(outcome.amount, '0.8');
});

test('6: Error normalization converts exceptions to status 502 CHAIN_ERROR', () => {
  const rawErr = new Error('RPC connection timed out');
  rawErr.code = 'TIMEOUT';
  
  const chainErr = normalizeChainError(rawErr);
  assert.equal(chainErr.code, 'CHAIN_ERROR');
  assert.equal(chainErr.status, 502);
  assert.equal(chainErr.message, 'RPC connection timed out');
  assert.equal(chainErr.details.originalCode, 'TIMEOUT');
});

test('7: Provider and signers lazy initialization from environment variables', () => {
  resetChainProvider();

  // Save env
  const origRpc = process.env.MST_RPC_URL;
  const origDeployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  const origGoodKey = process.env.GOOD_AGENT_PRIVATE_KEY;
  const origBadKey = process.env.BAD_AGENT_PRIVATE_KEY;

  try {
    process.env.MST_RPC_URL = 'http://127.0.0.1:8545';
    process.env.DEPLOYER_PRIVATE_KEY = '0x0000000000000000000000000000000000000000000000000000000000000001';
    process.env.GOOD_AGENT_PRIVATE_KEY = '0x0000000000000000000000000000000000000000000000000000000000000002';
    process.env.BAD_AGENT_PRIVATE_KEY = '0x0000000000000000000000000000000000000000000000000000000000000003';

    const provider = getProvider();
    assert.ok(provider);

    const deployer = getDeployerSigner();
    assert.ok(deployer);
    assert.equal(deployer.address.toLowerCase(), '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf');

    const goodAgent = getGoodAgentSigner();
    assert.ok(goodAgent);
    assert.equal(goodAgent.address.toLowerCase(), '0x2b5ad5c4795c026514f8317c7a215e218dccd6cf');

    const badAgent = getBadAgentSigner();
    assert.ok(badAgent);
    assert.equal(badAgent.address.toLowerCase(), '0x6813eb9362372eef6200f3b1dbc3f819671cba69');

    const status = getChainStatus();
    assert.equal(status.configured, true);
    assert.equal(status.signersConfigured.deployer, true);
    assert.equal(status.signersConfigured.goodAgent, true);
    assert.equal(status.signersConfigured.badAgent, true);
  } finally {
    process.env.MST_RPC_URL = origRpc;
    process.env.DEPLOYER_PRIVATE_KEY = origDeployerKey;
    process.env.GOOD_AGENT_PRIVATE_KEY = origGoodKey;
    process.env.BAD_AGENT_PRIVATE_KEY = origBadKey;
    resetChainProvider();
  }
});

test('8: SpendingCharter ABI is loaded successfully from shared/abi/SpendingCharter.json', () => {
  const abi = getCharterAbi();
  assert.ok(Array.isArray(abi));
  assert.ok(abi.length > 0);

  const attemptPaymentFunc = abi.find(item => item.name === 'attemptPayment');
  assert.ok(attemptPaymentFunc);
  assert.equal(attemptPaymentFunc.inputs.length, 3);
});

test('9: Route handlers contain zero direct ethers imports', () => {
  const routesDir = path.resolve(__dirname, '../../src/routes');
  const files = fs.readdirSync(routesDir);

  for (const file of files) {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
      assert.equal(
        content.includes("from 'ethers'") || content.includes('from "ethers"') || content.includes("require('ethers')"),
        false,
        `Route handler ${file} contains direct ethers import!`
      );
    }
  }
});
