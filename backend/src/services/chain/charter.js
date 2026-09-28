import { ethers } from 'ethers';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getProvider, getDeployerSigner, getGoodAgentSigner } from './provider.js';
import {
  parseEtherString,
  formatEtherString,
  normalizeAddress,
  formatRules,
  formatStatus,
  formatPaymentOutcome,
  normalizeChainError
} from './formatters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedAbi = null;

export function getCharterAbi() {
  if (!cachedAbi) {
    const abiPath = path.resolve(__dirname, '../../../../shared/abi/SpendingCharter.json');
    if (fs.existsSync(abiPath)) {
      try {
        const content = fs.readFileSync(abiPath, 'utf8');
        cachedAbi = JSON.parse(content);
      } catch (err) {
        console.warn('Failed to read SpendingCharter ABI:', err.message);
      }
    }
  }
  return cachedAbi;
}

export function getCharterAddress() {
  if (process.env.CHARTER_ADDRESS) {
    return process.env.CHARTER_ADDRESS;
  }
  const deploymentPath = path.resolve(__dirname, '../../../../shared/deployments/mst-testnet.json');
  if (fs.existsSync(deploymentPath)) {
    try {
      const content = fs.readFileSync(deploymentPath, 'utf8');
      const deployment = JSON.parse(content);
      return deployment?.charterAddress || null;
    } catch {
      // ignore read errors for unconfigured deployment files
    }
  }
  return null;
}

function getCharterReadOnlyContract() {
  const address = getCharterAddress();
  const abi = getCharterAbi();
  const provider = getProvider();

  if (!address || !abi || !provider) {
    throw normalizeChainError(new Error('SpendingCharter contract address, ABI, or RPC provider is not configured'));
  }

  return new ethers.Contract(address, abi, provider);
}

/**
 * Reads configured rules from SpendingCharter.
 */
export async function getCharterRules() {
  try {
    const contract = getCharterReadOnlyContract();
    const rules = await contract.getRules();
    return formatRules(rules);
  } catch (err) {
    throw normalizeChainError(err);
  }
}

/**
 * Reads overall spending window status and contract balance from SpendingCharter.
 */
export async function getCharterStatus() {
  try {
    const contract = getCharterReadOnlyContract();
    const status = await contract.getStatus();
    return formatStatus(status);
  } catch (err) {
    throw normalizeChainError(err);
  }
}

/**
 * Performs off-chain/read-only check on SpendingCharter for a payment request.
 */
export async function checkCharterPayment(toAddress, amountStr) {
  try {
    const normalizedTo = normalizeAddress(toAddress);
    const weiAmount = parseEtherString(amountStr);
    const contract = getCharterReadOnlyContract();
    const [ok, reasonCode] = await contract.checkPayment(normalizedTo, weiAmount);
    return {
      ok: Boolean(ok),
      reasonCode: Number(reasonCode)
    };
  } catch (err) {
    throw normalizeChainError(err);
  }
}

/**
 * Reads status of a counterparty (0 = allowed, 1 = denied).
 */
export async function getCharterCounterpartyStatus(counterpartyAddress) {
  try {
    const normalized = normalizeAddress(counterpartyAddress);
    const contract = getCharterReadOnlyContract();
    const status = await contract.getCounterpartyStatus(normalized);
    return Number(status);
  } catch (err) {
    throw normalizeChainError(err);
  }
}

/**
 * Submits attemptPayment on SpendingCharter using Good Agent signer.
 * Blocked payments return { executed: false, reasonCode } as a valid outcome.
 */
export async function attemptCharterPayment(toAddress, amountStr, receiptIdBytes32, options = {}) {
  try {
    const normalizedTo = normalizeAddress(toAddress);
    const weiAmount = parseEtherString(amountStr);
    const address = getCharterAddress();
    const abi = getCharterAbi();

    if (!address || !abi) {
      throw new Error('SpendingCharter address or ABI is missing');
    }

    const signer = options.signer || getGoodAgentSigner();
    if (!signer) {
      throw new Error('Good Agent signer (GOOD_AGENT_PRIVATE_KEY) is not configured');
    }

    const contract = new ethers.Contract(address, abi, signer);
    const tx = await contract.attemptPayment(normalizedTo, weiAmount, receiptIdBytes32);
    const receipt = await tx.wait(1);

    let executed = false;
    let reasonCode = 0;
    let spentInWindow = null;

    if (receipt && receipt.logs) {
      const iface = new ethers.Interface(abi);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === 'PaymentExecuted') {
            executed = true;
            reasonCode = 0;
            spentInWindow = parsed.args.spentInWindow;
          } else if (parsed && parsed.name === 'PaymentBlocked') {
            executed = false;
            reasonCode = Number(parsed.args.reasonCode);
          }
        } catch {
          // ignore unparsable logs from third party contracts if any
        }
      }
    }

    return formatPaymentOutcome({
      executed,
      reasonCode,
      txHash: receipt.hash,
      to: normalizedTo,
      amount: amountStr,
      spentInWindow
    });
  } catch (err) {
    throw normalizeChainError(err);
  }
}

/**
 * Admin action: updates SpendingCharter rules using Deployer signer (owner).
 */
export async function setCharterRules(maxPerTxStr, dailyCapStr, humanApprovalThresholdStr, allowListEnabled, options = {}) {
  try {
    const maxPerTxWei = parseEtherString(maxPerTxStr);
    const dailyCapWei = parseEtherString(dailyCapStr);
    const thresholdWei = parseEtherString(humanApprovalThresholdStr);

    const address = getCharterAddress();
    const abi = getCharterAbi();
    if (!address || !abi) {
      throw new Error('SpendingCharter address or ABI is missing');
    }

    const signer = options.signer || getDeployerSigner();
    if (!signer) {
      throw new Error('Deployer signer (DEPLOYER_PRIVATE_KEY) is not configured');
    }

    const contract = new ethers.Contract(address, abi, signer);
    const tx = await contract.setRules(maxPerTxWei, dailyCapWei, thresholdWei, Boolean(allowListEnabled));
    const receipt = await tx.wait(1);
    return { txHash: receipt.hash };
  } catch (err) {
    throw normalizeChainError(err);
  }
}

/**
 * Admin action: sets counterparty status on SpendingCharter using Deployer signer (owner).
 */
export async function setCharterCounterpartyStatus(counterpartyAddress, statusUint8, options = {}) {
  try {
    const normalizedTo = normalizeAddress(counterpartyAddress);
    const statusNum = Number(statusUint8);
    if (statusNum !== 0 && statusNum !== 1) {
      throw new Error('Status must be 0 (allowed) or 1 (denied)');
    }

    const address = getCharterAddress();
    const abi = getCharterAbi();
    if (!address || !abi) {
      throw new Error('SpendingCharter address or ABI is missing');
    }

    const signer = options.signer || getDeployerSigner();
    if (!signer) {
      throw new Error('Deployer signer (DEPLOYER_PRIVATE_KEY) is not configured');
    }

    const contract = new ethers.Contract(address, abi, signer);
    const tx = await contract.setCounterpartyStatus(normalizedTo, statusNum);
    const receipt = await tx.wait(1);
    return { txHash: receipt.hash };
  } catch (err) {
    throw normalizeChainError(err);
  }
}
