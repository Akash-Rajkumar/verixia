import { ethers } from 'ethers';

/**
 * Validates and converts a decimal token string (e.g. "0.5") to wei BigInt (18 decimals).
 * Rejects non-string inputs, invalid numbers, and JS numbers.
 */
export function parseEtherString(amountStr) {
  if (typeof amountStr !== 'string') {
    throw new TypeError(`Amount must be a decimal string, received ${typeof amountStr}`);
  }
  const trimmed = amountStr.trim();
  if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) < 0) {
    throw new Error(`Invalid decimal amount string: "${amountStr}"`);
  }
  try {
    return ethers.parseUnits(trimmed, 18);
  } catch (err) {
    throw new Error(`Failed to parse ether amount string "${amountStr}": ${err.message}`);
  }
}

/**
 * Converts wei (BigInt or string) to a human-readable decimal string (18 decimals).
 */
export function formatEtherString(weiValue) {
  if (weiValue === undefined || weiValue === null) {
    return '0';
  }
  return ethers.formatUnits(weiValue, 18);
}

/**
 * Validates and normalizes an Ethereum/MST address to lowercase hex string.
 */
export function normalizeAddress(address) {
  if (typeof address !== 'string') {
    throw new TypeError(`Address must be a string, received ${typeof address}`);
  }
  const lower = address.trim().toLowerCase();
  if (!ethers.isAddress(lower)) {
    throw new Error(`Invalid EVM address format: "${address}"`);
  }
  return lower;
}

/**
 * Normalizes SpendingCharter rules output object.
 */
export function formatRules(rulesTuple) {
  const [maxPerTx, dailyCap, humanApprovalThreshold, allowListEnabled] = rulesTuple;
  return {
    maxPerTx: formatEtherString(maxPerTx),
    dailyCap: formatEtherString(dailyCap),
    humanApprovalThreshold: formatEtherString(humanApprovalThreshold),
    allowListEnabled: Boolean(allowListEnabled)
  };
}

/**
 * Normalizes SpendingCharter status output object.
 */
export function formatStatus(statusTuple) {
  const [windowStart, spentInWindow, remainingInWindow, balance] = statusTuple;
  return {
    windowStart: Number(windowStart),
    spentInWindow: formatEtherString(spentInWindow),
    remainingInWindow: formatEtherString(remainingInWindow),
    balance: formatEtherString(balance)
  };
}

/**
 * Formats SpendingCharter attemptPayment execution result into standard backend structure.
 */
export function formatPaymentOutcome({ executed, reasonCode, txHash, to, amount, spentInWindow = null }) {
  return {
    executed: Boolean(executed),
    reasonCode: Number(reasonCode),
    txHash: txHash || null,
    to: to ? normalizeAddress(to) : null,
    amount: amount ? (typeof amount === 'string' ? amount : formatEtherString(amount)) : '0',
    spentInWindow: spentInWindow !== null ? formatEtherString(spentInWindow) : null
  };
}

/**
 * Maps raw RPC/contract exceptions into a standardized backend CHAIN_ERROR object.
 */
export function normalizeChainError(err) {
  const message = err?.reason || err?.message || 'Blockchain operation failed';
  const code = 'CHAIN_ERROR';
  const details = {
    originalCode: err?.code || 'UNKNOWN',
    shortMessage: err?.shortMessage || message
  };

  const errorObj = new Error(message);
  errorObj.code = code;
  errorObj.status = 502;
  errorObj.details = details;
  return errorObj;
}
